from abc import ABC, abstractmethod
from typing import List, Dict, Any
import numpy as np

class BaseDetector(ABC):
    """
    Abstract base class for object detection models.
    This allows easy integration of custom models in the future.
    """
    
    @abstractmethod
    def load_model(self, model_path: str, **kwargs):
        """Loads the model weights and configuration."""
        pass

    @abstractmethod
    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Runs inference on a frame and returns a list of detections.
        Each detection should be a dictionary containing:
        - class_name (str)
        - class_id (int)
        - confidence (float)
        - bbox (List[int]): [x1, y1, x2, y2]
        """
        pass
