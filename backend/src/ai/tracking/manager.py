import time
import math
from typing import Dict, List, Any, Tuple
from collections import deque

class TrackedObject:
    def __init__(self, obj_id: int, initial_bbox: List[int]):
        self.obj_id = obj_id
        # Queue to store the last N center points (x, y) for trajectory
        self.trajectory = deque(maxlen=30)
        
        self.first_seen = time.time()
        self.last_seen = time.time()
        self.time_on_screen = 0.0
        self.current_speed = 0.0 # pixels per second
        self.direction = "Unknown"
        self.is_active = True
        
        self.add_position(initial_bbox)

    def _get_center(self, bbox: List[int]) -> Tuple[int, int]:
        x1, y1, x2, y2 = bbox
        return int((x1 + x2) / 2), int((y1 + y2) / 2)

    def add_position(self, bbox: List[int]):
        now = time.time()
        center = self._get_center(bbox)
        
        if len(self.trajectory) > 0:
            prev_center = self.trajectory[-1]
            # Calculate distance
            dist = math.hypot(center[0] - prev_center[0], center[1] - prev_center[1])
            time_diff = now - self.last_seen
            if time_diff > 0:
                # Speed in pixels/sec
                self.current_speed = dist / time_diff
                
            # Direction vector
            dx = center[0] - prev_center[0]
            dy = center[1] - prev_center[1]
            if abs(dx) > abs(dy):
                self.direction = "Right" if dx > 0 else "Left"
            else:
                self.direction = "Down" if dy > 0 else "Up"
                
        self.trajectory.append(center)
        self.last_seen = now
        self.time_on_screen = self.last_seen - self.first_seen
        self.is_active = True

    def get_info(self) -> Dict[str, Any]:
        return {
            "id": self.obj_id,
            "speed_px_s": round(self.current_speed, 2),
            "direction": self.direction,
            "time_on_screen_s": round(self.time_on_screen, 2),
            "trajectory": list(self.trajectory)
        }

class TrackingManager:
    """
    Manages the lifecycle and state of tracked objects across frames.
    """
    def __init__(self, stale_timeout: float = 2.0):
        self.stale_timeout = stale_timeout
        self.tracks: Dict[int, TrackedObject] = {}
        
    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Updates internal tracking state based on new detections containing an 'id' field.
        Returns the detections enriched with tracking info.
        """
        current_time = time.time()
        enriched_detections = []
        seen_ids = set()
        
        for det in detections:
            obj_id = det.get("id")
            if obj_id is None:
                # If detector failed to assign an ID, we can't track it
                enriched_detections.append(det)
                continue
                
            seen_ids.add(obj_id)
            
            if obj_id not in self.tracks:
                self.tracks[obj_id] = TrackedObject(obj_id, det["bbox"])
            else:
                self.tracks[obj_id].add_position(det["bbox"])
                
            # Enrich detection with tracking metadata
            enriched_det = det.copy()
            enriched_det["tracking"] = self.tracks[obj_id].get_info()
            enriched_detections.append(enriched_det)
            
        # Clean up stale tracks (e.g., object left screen or was occluded for too long)
        stale_ids = []
        for obj_id, track in self.tracks.items():
            if obj_id not in seen_ids:
                if (current_time - track.last_seen) > self.stale_timeout:
                    stale_ids.append(obj_id)
                else:
                    track.is_active = False # Temporarily lost
                    
        for obj_id in stale_ids:
            del self.tracks[obj_id]
            
        return enriched_detections
