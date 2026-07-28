from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
# pyrefly: ignore [missing-import]
from fastapi.responses import StreamingResponse
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from typing import List, AsyncGenerator, Dict
import time
import asyncio
import threading
import numpy as np
# pyrefly: ignore [missing-import]
import cv2

from src.core.database import get_db
from src.features.cameras import service as camera_service
from src.features.cameras.models import Camera
from src.features.cameras.schemas import CameraCreate, CameraUpdate, CameraResponse
from src.features.users.models import User
from src.features.auth.dependencies import get_current_active_user
from src.ai.pipeline import stream_manager
from src.ai.object_detection.yolo_detector import YOLOv11Detector
from src.ai.object_detection.utils import draw_bounding_boxes
from src.ai.tracking.manager import TrackingManager
from src.ai.tracking.utils import draw_tracking_info

router = APIRouter()

# Active streaming session controls to guarantee instant hardware light power down on demand
_active_ip_sessions: Dict[str, bool] = {}

# Lazy-loaded singleton detector for fast IP stream inference
_ip_detector = None
def get_ip_detector() -> YOLOv11Detector:
    global _ip_detector
    if _ip_detector is None:
        _ip_detector = YOLOv11Detector()
    return _ip_detector

class LiveCameraStreamReader:
    """
    Background daemon thread that continuously grabs the freshest video frame from DroidCam WiFi sockets
    or local webcams at maximum physical speed. Completely eliminates network packet queue drift
    and buffer accumulation, guaranteeing true zero-lag real-time surveillance video!
    """
    def __init__(self, cap: cv2.VideoCapture):
        self.cap = cap
        self.running = True
        self.lock = threading.Lock()
        self.ret = False
        self.frame = None
        self.thread = threading.Thread(target=self._reader_worker, daemon=True)
        self.thread.start()

    def _reader_worker(self):
        while self.running and self.cap.isOpened():
            try:
                ret, frame = self.cap.read()
                if ret and frame is not None:
                    with self.lock:
                        self.ret = ret
                        self.frame = frame
                else:
                    time.sleep(0.01)
            except Exception:
                time.sleep(0.01)
            # Micro-pause to prevent CPU thread starvation and maintain buttery-smooth video output
            time.sleep(0.002)

    def read_latest(self):
        with self.lock:
            return self.ret, (self.frame.copy() if self.frame is not None else None)

    def stop(self):
        self.running = False
        self.thread.join(timeout=0.25)
        if self.cap and self.cap.isOpened():
            self.cap.release()
            print("Hardware camera sensor cleanly shut off via frame reader.")

async def generate_live_ip_frames(source_url: str) -> AsyncGenerator[bytes, None]:
    """
    Generator that processes an IP Camera (e.g. DroidCam) or Webcam stream in real time
    using non-blocking asynchronous camera connecting and zero-lag daemon frame grabbing.
    """
    # If an existing stream session is active on this URL or camera index, gracefully shut it down first
    if source_url in _active_ip_sessions and _active_ip_sessions[source_url]:
        _active_ip_sessions[source_url] = False
        await asyncio.sleep(0.3)

    def open_hardware_stream(src: str):
        if src.isdigit():
            idx = int(src)
            try:
                # Windows DirectShow (CAP_DSHOW) guarantees zero startup latency for webcams
                c = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
                if not c.isOpened():
                    c = cv2.VideoCapture(idx)
            except Exception:
                c = cv2.VideoCapture(idx)
            c.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            c.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            c.set(cv2.CAP_PROP_FPS, 30)
            c.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            return c
        else:
            c = cv2.VideoCapture(src)
            c.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            return c

    # Open network WiFi streams or webcams non-blockingly so FastAPI server never hangs or times out!
    cap = await asyncio.to_thread(open_hardware_stream, source_url)
    if not cap or not cap.isOpened():
        print(f"Failed to open IP Camera / webcam stream at: {source_url}")
        return

    # Engage daemon real-time frame reader
    reader = LiveCameraStreamReader(cap)
    tracker = TrackingManager()
    
    state = {
        "tracked_objects": [],
        "is_inferring": False
    }

    def run_inference_worker(frame_copy: np.ndarray):
        try:
            # Lazily retrieve YOLOv11 inside worker thread so connection startup is instantaneous!
            detector = get_ip_detector()
            detections = detector.detect(frame_copy)
            tracks = tracker.update(detections)
            state["tracked_objects"] = tracks
        except Exception as err:
            print(f"IP Camera background AI warning: {err}")
        finally:
            state["is_inferring"] = False

    loop = asyncio.get_running_loop()
    _active_ip_sessions[source_url] = True

    try:
        while _active_ip_sessions.get(source_url, False):
            try:
                ret, frame = reader.read_latest()
                if not ret or frame is None:
                    await asyncio.sleep(0.01)
                    continue

                # Scale to native 640 width for rapid processing
                height, width = frame.shape[:2]
                if width != 640 and width > 0:
                    scale = 640 / width
                    frame = cv2.resize(frame, (640, int(height * scale)))

                # Non-blocking background AI dispatch
                if not state["is_inferring"]:
                    state["is_inferring"] = True
                    frame_for_ai = frame.copy()
                    loop.run_in_executor(None, run_inference_worker, frame_for_ai)

                tracked = state["tracked_objects"]
                annotated = draw_bounding_boxes(frame, tracked)
                annotated = draw_tracking_info(annotated, tracked)

                # High-speed JPEG compression for buttery smooth WiFi streaming without frame stuttering
                ret, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
                if not ret:
                    continue

                frame_bytes = buffer.tobytes()
                yield (b"--frame\r\n"
                       + b"Content-Type: image/jpeg\r\n"
                       + f"Content-Length: {len(frame_bytes)}\r\n\r\n".encode("utf-8") + frame_bytes + b"\r\n")

                # Maintain steady, smooth ~30 FPS cadence
                await asyncio.sleep(0.02)

            except (GeneratorExit, asyncio.CancelledError, ConnectionResetError, BrokenPipeError):
                print("Client disconnected from surveillance station. Instantly terminating hardware camera feed...")
                break
            except Exception as loop_err:
                print(f"Live IP loop error: {loop_err}")
                break
    finally:
        _active_ip_sessions.pop(source_url, None)
        reader.stop()
        print("Hardware camera sensor cleanly shut off.")

@router.post("/stop-ip-stream")
async def stop_ip_stream(url: str):
    """
    Explicitly severs the hardware camera sensor lock and shuts down the video capture loop instantly on demand.
    """
    if url in _active_ip_sessions:
        _active_ip_sessions[url] = False
        print(f"Received explicit termination signal for surveillance target: {url}")
    return {"status": "terminated", "url": url}

@router.get("/live-ip-stream")
async def stream_live_ip_camera(url: str):
    """
    Streams a live wireless IP camera (e.g. mobile phone via IP Webcam) or laptop webcam with real-time YOLOv11 overlays.
    """
    return StreamingResponse(generate_live_ip_frames(url), media_type="multipart/x-mixed-replace; boundary=frame")

@router.get("/stream/{camera_id}")
async def get_camera_stream(
    camera_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    HTTP endpoint for MJPEG streaming (widely supported by browsers without WS logic).
    """
    # For a real system, you might want auth here, but browser img tags don't easily send auth headers.
    # In production, use token in query param.
    camera = await db.execute(
        select(Camera).where(Camera.id == camera_id)
    )
    camera = camera.scalars().first()
    
    if not camera or not camera.is_active:
        raise HTTPException(status_code=404, detail="Camera not found or inactive")
        
    processor = stream_manager.start_stream(camera_id=camera.id, source_url=camera.stream_url)
    return StreamingResponse(processor.get_stream(), media_type="multipart/x-mixed-replace; boundary=frame")

@router.get("/", response_model=List[CameraResponse])
async def read_cameras(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cameras = await camera_service.get_cameras(db, user_id=current_user.id, skip=skip, limit=limit)
    return cameras

@router.post("/", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
async def create_camera(
    camera_in: CameraCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return await camera_service.create_camera(db, camera_in=camera_in, user_id=current_user.id)

@router.get("/{camera_id}", response_model=CameraResponse)
async def read_camera(
    camera_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    camera = await camera_service.get_camera(db, camera_id=camera_id, user_id=current_user.id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera

@router.put("/{camera_id}", response_model=CameraResponse)
async def update_camera(
    camera_id: int,
    camera_in: CameraUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    camera = await camera_service.get_camera(db, camera_id=camera_id, user_id=current_user.id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return await camera_service.update_camera(db, db_camera=camera, camera_in=camera_in)

@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_camera(
    camera_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    success = await camera_service.delete_camera(db, camera_id=camera_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Camera not found")
    return None
