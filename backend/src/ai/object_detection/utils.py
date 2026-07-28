import cv2
import numpy as np
from typing import List, Dict, Any

def draw_bounding_boxes(frame: np.ndarray, detections: List[Dict[str, Any]]) -> np.ndarray:
    """
    Draws bounding boxes and labels on the frame.
    """
    annotated_frame = frame.copy()
    
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        label = f"{det['class_name']} {det['confidence']:.2f}"
        
        # Draw rectangle
        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Draw label background
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(annotated_frame, (x1, y1 - 20), (x1 + w, y1), (0, 255, 0), -1)
        
        # Draw text
        cv2.putText(annotated_frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        
    return annotated_frame

def format_detections_as_json(detections: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Formats the raw detections list into a structured JSON response.
    """
    return {
        "status": "success",
        "detection_count": len(detections),
        "results": detections
    }
