# pyrefly: ignore [missing-import]
import cv2
import numpy as np
from enum import Enum

class ColorSpace(Enum):
    RGB = "RGB"
    HSV = "HSV"
    LAB = "LAB"
    YCrCb = "YCrCb" # Using YCrCb (OpenCV's version of YCbCr)

def convert_color_space(frame: np.ndarray, target_space: ColorSpace) -> np.ndarray:
    """
    Converts a BGR frame from OpenCV to the target color space.
    """
    if target_space == ColorSpace.RGB:
        return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    elif target_space == ColorSpace.HSV:
        return cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    elif target_space == ColorSpace.LAB:
        return cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    elif target_space == ColorSpace.YCrCb:
        return cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)
    return frame

def analyze_frame_characteristics(frame: np.ndarray) -> ColorSpace:
    """
    Analyzes the frame to automatically select the best color space for background subtraction.
    
    Logic:
    - If there are harsh shadows or significant illumination variations, HSV or LAB is preferred 
      because they separate luminance/intensity from color information.
    - If the frame has relatively uniform lighting and high contrast, RGB or YCrCb can work well.
    """
    # Convert to grayscale to measure overall illumination variance
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Calculate global contrast (standard deviation of pixel intensities)
    std_dev = np.std(gray)
    
    # Calculate brightness (mean intensity)
    mean_brightness = np.mean(gray)
    
    # Heuristic for color space selection
    if std_dev > 50 and mean_brightness < 100:
        # High contrast but low overall brightness might indicate harsh localized lighting/shadows
        return ColorSpace.HSV
    elif std_dev > 60:
        # High variance in lighting
        return ColorSpace.LAB
    elif mean_brightness > 200:
        # Overexposed scene
        return ColorSpace.YCrCb
    else:
        # Standard balanced scene
        return ColorSpace.RGB
