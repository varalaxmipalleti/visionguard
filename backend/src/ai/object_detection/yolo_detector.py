import numpy as np
from typing import List, Dict, Any
# pyrefly: ignore [missing-import]
from ultralytics import YOLO
from .base import BaseDetector
from src.core.ai_config import ai_config



class YOLOv11Detector(BaseDetector):
    """
    YOLOv11 implementation for real-time object detection.
    Detects all 80 COCO categories dynamically using model.names vocabulary.
    Confidence threshold is read live from the global AIConfig singleton,
    allowing instant updates from the Settings page without server restart.
    """
    
    def __init__(self, model_path: str = "yolo11n.pt"):
        self.model = None
        self.load_model(model_path)
        
    def load_model(self, model_path: str, **kwargs):
        """Loads the YOLOv11 model using ultralytics."""
        try:
            self.model = YOLO(model_path)
        except Exception as e:
            raise RuntimeError(f"Failed to load YOLOv11 model from {model_path}: {e}")

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Runs YOLOv11 inference and filters results for target classes.
        """
        if self.model is None:
            raise RuntimeError("Model is not loaded.")
            
        try:
            # Use track() instead of predict() to enable ByteTrack
            # Reads confidence live from global AIConfig singleton (updated by Settings page)
            results = self.model.track(
                source=frame, 
                conf=ai_config.confidence_threshold,
                persist=True, # Persist tracking across frames
                tracker="bytetrack.yaml", # Use ByteTrack
                verbose=False
            )
        except Exception:
            # If tracker state encounters an edge case across sequential frames, fall back cleanly to predict
            results = self.model.predict(
                source=frame,
                conf=ai_config.confidence_threshold,
                verbose=False
            )
        
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                class_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                
                # Check if the tracker assigned an ID
                obj_id = int(box.id[0].item()) if box.id is not None else None
                
                # Fetch precise item label straight from model syntax vocabulary (80 classes supported)
                class_name = self.model.names.get(class_id, "object")
                    
                detections.append({
                    "id": obj_id,
                    "class_name": class_name,
                    "class_id": class_id,
                    "confidence": confidence,
                    "bbox": [x1, y1, x2, y2]
                })
                
        return detections
