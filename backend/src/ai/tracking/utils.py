import cv2
import numpy as np
from typing import List, Dict, Any

def draw_tracking_info(frame: np.ndarray, detections: List[Dict[str, Any]]) -> np.ndarray:
    """
    Draws trajectories and speed information on the frame for tracked objects.
    """
    annotated_frame = frame.copy()
    
    for det in detections:
        tracking_info = det.get("tracking")
        if not tracking_info:
            continue
            
        # Draw Trajectory
        trajectory = tracking_info["trajectory"]
        if len(trajectory) > 1:
            for i in range(1, len(trajectory)):
                pt1 = trajectory[i-1]
                pt2 = trajectory[i]
                # Draw a line connecting the past positions (Cyan color)
                cv2.line(annotated_frame, pt1, pt2, (255, 255, 0), 2)
                
        # Draw Tracking details near the bounding box
        x1, y1, x2, y2 = det["bbox"]
        obj_id = tracking_info["id"]
        speed = tracking_info["speed_px_s"]
        direction = tracking_info["direction"]
        
        info_text = f"ID:{obj_id} | {speed}px/s | {direction}"
        
        # We put this text at the bottom of the bounding box to separate from class label
        cv2.putText(annotated_frame, info_text, (x1, y2 + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
        
    return annotated_frame
