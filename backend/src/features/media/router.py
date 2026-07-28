import os
import time
# pyrefly: ignore [missing-import]
import cv2
import shutil
import base64
import asyncio
import numpy as np
from typing import Dict, Any, AsyncGenerator
from fastapi import APIRouter, UploadFile, File, HTTPException, status
# pyrefly: ignore [missing-import]
from fastapi.responses import StreamingResponse

from src.ai.object_detection.yolo_detector import YOLOv11Detector
from src.ai.object_detection.utils import draw_bounding_boxes
from src.ai.background_subtraction.engine import AdaptiveBGS
from src.ai.tracking.manager import TrackingManager
from src.ai.tracking.utils import draw_tracking_info

router = APIRouter()

UPLOAD_DIR = "uploads/media"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def cleanup_old_uploads(max_age_seconds: int = 1800):
    """
    Automatically deletes uploaded media files older than 30 minutes (1800s)
    to prevent cloud servers (like Render or Hugging Face) from running out of storage.
    """
    try:
        now = time.time()
        for fname in os.listdir(UPLOAD_DIR):
            fpath = os.path.join(UPLOAD_DIR, fname)
            if os.path.isfile(fpath) and fname != ".gitkeep":
                if now - os.path.getmtime(fpath) > max_age_seconds:
                    os.remove(fpath)
    except Exception as e:
        print(f"[Garbage Collector] Warning during file cleanup: {e}")

# Lazy-loaded singleton detector for fast inference
_detector = None
def get_detector() -> YOLOv11Detector:
    global _detector
    if _detector is None:
        _detector = YOLOv11Detector()
    return _detector

@router.post("/inspect")
async def inspect_media(file: UploadFile = File(...)):
    """
    Analyzes an uploaded photo or video file with YOLOv11 & AI tracking models.
    Returns real-time bounding boxes, statistical breakdowns, or video streaming links.
    """
    # Auto-cleanup old files to prevent cloud storage exhaustion
    await asyncio.to_thread(cleanup_old_uploads, 1800)

    filename = file.filename or "uploaded_file"
    file_ext = os.path.splitext(filename)[1].lower()
    
    image_exts = [".jpg", ".jpeg", ".png", ".bmp", ".webp", ".jfif", ".tiff", ".tif"]
    video_exts = [".mp4", ".avi", ".mov", ".mkv", ".webm", ".m4v", ".3gp"]
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    if file_ext in image_exts:
        # Image Analysis Pipeline
        frame = cv2.imread(file_path)
        if frame is None:
            raise HTTPException(status_code=400, detail="Could not read image file.")
            
        detector = get_detector()
        detections = await asyncio.to_thread(detector.detect, frame)
        
        # Draw AI bounding boxes & labels
        annotated_frame = await asyncio.to_thread(draw_bounding_boxes, frame, detections)
        
        # Encode annotated frame to Base64 Data URL
        ret, buf = cv2.imencode(".jpg", annotated_frame)
        if not ret:
            raise HTTPException(status_code=500, detail="Failed to encode annotated image.")
        base64_str = f"data:image/jpeg;base64,{base64.b64encode(buf).decode('utf-8')}"
        
        # Build statistical class breakdown
        class_counts: Dict[str, int] = {}
        total_conf = 0.0
        for det in detections:
            cls_name = det.get("class_name", "unknown")
            class_counts[cls_name] = class_counts.get(cls_name, 0) + 1
            total_conf += det.get("confidence", 0.0)
            
        avg_conf = (total_conf / len(detections)) if detections else 0.0
        
        return {
            "status": "success",
            "type": "image",
            "filename": filename,
            "annotated_url": base64_str,
            "detection_count": len(detections),
            "class_breakdown": class_counts,
            "average_confidence": round(avg_conf, 2),
            "detections": detections
        }
        
    elif file_ext in video_exts:
        # Video File Upload & Live Stream setup with timestamp to bypass browser socket caching
        stream_url = f"http://localhost:8000/api/v1/media/stream-video/{filename}?t={int(time.time())}"
        return {
            "status": "success",
            "type": "video",
            "filename": filename,
            "stream_url": stream_url,
            "message": "Video successfully uploaded and ready for real-time forensic AI stream inspection."
        }
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. Supported: Images ({', '.join(image_exts)}) & Videos ({', '.join(video_exts)})"
        )

async def generate_video_frames(file_path: str) -> AsyncGenerator[bytes, None]:
    """
    Generator that processes a saved video file frame-by-frame with BGS, YOLO, and ByteTrack.
    Loops the video automatically for uninterrupted user inspection.
    """
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        return

    detector = get_detector()
    tracker = TrackingManager()
    # stop_event: signals the cap.read() thread to stop safely before cap.release()
    # This prevents the libavcodec pthread_frame assertion error on browser refresh!
    import threading
    stop_event = threading.Event()

    def safe_read():
        """Reads one frame only if stop has not been requested."""
        if stop_event.is_set():
            return False, None
        return cap.read()

    # Shared state for zero-blocking background AI inference
    state = {
        "tracked_objects": [],
        "is_inferring": False
    }

    def run_inference_worker(frame_copy: np.ndarray):
        try:
            detections = detector.detect(frame_copy)
            tracks = tracker.update(detections)
            state["tracked_objects"] = tracks
        except Exception as err:
            print(f"Background AI Worker warning: {err}")
        finally:
            state["is_inferring"] = False

    loop = asyncio.get_running_loop()

    try:
        while True:
            try:
                start_time = time.time()

                ret, frame = await asyncio.to_thread(safe_read)
                if not ret or frame is None:
                    if stop_event.is_set():
                        break  # Clean shutdown requested
                    # Replay from beginning for uninterrupted live inspection
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue

                # Scale to 640 width (native YOLO architecture resolution) for instant CPU detection & real-time visual tracking sync
                height, width = frame.shape[:2]
                if width != 640:
                    scale = 640 / width
                    frame = cv2.resize(frame, (640, int(height * scale)))

                # Dispatch background inference if AI worker is idle (never pause video stream!)
                if not state["is_inferring"]:
                    state["is_inferring"] = True
                    frame_for_ai = frame.copy()
                    loop.run_in_executor(None, run_inference_worker, frame_for_ai)

                # Draw latest bounding boxes and trajectories instantly at full 30 FPS real-time speed
                tracked = state["tracked_objects"]
                annotated = draw_bounding_boxes(frame, tracked)
                annotated = draw_tracking_info(annotated, tracked)

                ret, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if not ret:
                    continue

                frame_bytes = buffer.tobytes()
                yield (b"--frame\r\n"
                       + b"Content-Type: image/jpeg\r\n"
                       + f"Content-Length: {len(frame_bytes)}\r\n\r\n".encode("utf-8") + frame_bytes + b"\r\n")

                # Maintain true 30 FPS video cadence (~33 milliseconds per frame)
                elapsed = time.time() - start_time
                sleep_duration = max(0.001, 0.033 - elapsed)
                await asyncio.sleep(sleep_duration)

            except (asyncio.CancelledError, GeneratorExit):
                break
            except Exception as loop_err:
                print(f"Video loop error: {loop_err}")
                await asyncio.sleep(0.033)
    finally:
        # Signal the safe_read thread to stop BEFORE releasing the VideoCapture.
        # This prevents the FFmpeg libavcodec pthread_frame assertion error.
        stop_event.set()
        await asyncio.sleep(0.05)  # Brief pause so any in-flight cap.read() can exit
        cap.release()

@router.get("/stream-video/{filename}")
async def stream_video(filename: str):
    """
    Streams the uploaded video with real-time AI object detection and multi-object tracking overlays.
    """
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video file not found.")
        
    return StreamingResponse(generate_video_frames(file_path), media_type="multipart/x-mixed-replace; boundary=frame")
