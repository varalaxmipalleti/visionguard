import cv2
import numpy as np

class AdaptiveBackgroundModel:
    """
    Wrapper around OpenCV's Background Subtractor.
    We use MOG2 as it naturally handles shadows and dynamic backgrounds (e.g., waving trees).
    """
    def __init__(self, history: int = 500, varThreshold: float = 16.0, detectShadows: bool = True):
        self.subtractor = cv2.createBackgroundSubtractorMOG2(
            history=history,
            varThreshold=varThreshold,
            detectShadows=detectShadows
        )
        self.learning_rate = -1 # Automatically adapt based on history
        
    def apply(self, frame: np.ndarray) -> np.ndarray:
        """
        Applies the background subtractor to the frame and returns the foreground mask.
        Shadows are typically marked as 127 in the mask if detectShadows is True.
        """
        mask = self.subtractor.apply(frame, learningRate=self.learning_rate)
        
        # Post-processing to clean up the mask (Morphological operations)
        # Remove small noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # Fill small holes in the foreground
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        # Treat shadows (value 127) as background (0) for cleaner foreground (255)
        # If shadows need to be retained for specific logic, this can be toggled.
        _, final_mask = cv2.threshold(mask, 254, 255, cv2.THRESH_BINARY)
        
        return final_mask

    def update_learning_rate(self, new_rate: float):
        """
        Dynamically adjust the learning rate if sudden illumination changes are detected.
        """
        self.learning_rate = new_rate
