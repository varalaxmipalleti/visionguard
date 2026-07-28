# pyrefly: ignore [missing-import]
import cv2
import asyncio
import numpy as np
from typing import AsyncGenerator, Dict, Any, Optional
import time

from src.ai.background_subtraction.engine import AdaptiveBGS
from src.ai.object_detection.yolo_detector import YOLOv11Detector
from src.ai.object_detection.utils import draw_bounding_boxes
from src.ai.tracking.manager import TrackingManager
from src.ai.tracking.utils import draw_tracking_info

class VideoProcessor:
    """
    Orchestrates the real-time AI pipeline for a single camera stream.
    Camera -> BGS -> YOLO -> ByteTrack -> Annotate -> Output
    """
    def __init__(self, camera_id: int, source_url: str):
        self.camera_id = camera_id
        self.source_url = source_url
        self.is_running = False
        
        # AI Modules
        self.bgs_engine = AdaptiveBGS()
        self.detector = YOLOv11Detector()
        self.tracker = TrackingManager()
        
        # Queues for async processing
        self.frame_queue = asyncio.Queue(maxsize=30)
        
    async def _capture_frames(self):
        """Runs continuously to pull frames from the video source."""
        # Note: cv2.VideoCapture can block, in a purely async highly-scalable env, 
        # consider using aiortc or a thread pool. For this pipeline, asyncio.to_thread is used.
        cap = await asyncio.to_thread(cv2.VideoCapture, self.source_url)
        
        if not cap.isOpened():
            print(f"Error: Could not open video source for camera {self.camera_id}")
            self.is_running = False
            return
            
        while self.is_running:
            # Run blocking read in a thread
            ret, frame = await asyncio.to_thread(cap.read)
            if not ret:
                # Video ended or error (if file, we might loop. If stream, we reconnect)
                break
                
            # If queue is full, drop frame to maintain real-time (don't fall behind)
            if self.frame_queue.full():
                try:
                    self.frame_queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            
            await self.frame_queue.put(frame)
            await asyncio.sleep(0.01) # Yield control
            
        cap.release()

    async def get_stream(self) -> AsyncGenerator[bytes, None]:
        """
        Consumes frames, runs the AI pipeline, and yields JPEG encoded frames for streaming.
        """
        self.is_running = True
        
        # Start capture task
        asyncio.create_task(self._capture_frames())
        
        while self.is_running:
            try:
                frame = await asyncio.wait_for(self.frame_queue.get(), timeout=2.0)
            except asyncio.TimeoutError:
                continue # Try again if stream paused
            except asyncio.CancelledError:
                break
                
            # 1. Background Subtraction (adaptive)
            # We run this to maintain the background model and get metadata, 
            # even though YOLO handles detection directly. We can use fg_mask for custom analytics.
            fg_mask, bgs_meta = await asyncio.to_thread(self.bgs_engine.process_frame, frame)
            
            # 2. Object Detection & ByteTrack tracking (combined via model.track)
            detections = await asyncio.to_thread(self.detector.detect, frame)
            
            # 3. Tracking Manager (maintains historical state, speeds, trajectories)
            tracked_objects = await asyncio.to_thread(self.tracker.update, detections)
            
            # 4. Annotation
            annotated_frame = await asyncio.to_thread(draw_bounding_boxes, frame, tracked_objects)
            annotated_frame = await asyncio.to_thread(draw_tracking_info, annotated_frame, tracked_objects)
            
            # Add BGS Meta to frame for debug/demo
            bgs_text = f"Color Space: {bgs_meta['color_space']} | BGS Latency: {bgs_meta['latency_ms']:.1f}ms"
            cv2.putText(annotated_frame, bgs_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
            
            # 5. Encode to JPEG for web streaming
            ret, buffer = cv2.imencode('.jpg', annotated_frame)
            if not ret:
                continue
                
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   + b'Content-Type: image/jpeg\r\n'
                   + f'Content-Length: {len(frame_bytes)}\r\n\r\n'.encode('utf-8') + frame_bytes + b'\r\n')

    def stop(self):
        self.is_running = False
