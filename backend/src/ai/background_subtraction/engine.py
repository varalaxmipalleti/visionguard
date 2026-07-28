# pyrefly: ignore [missing-import]
import cv2
import numpy as np
import time
from typing import Optional, List, Tuple
from .color_spaces import ColorSpace, convert_color_space, analyze_frame_characteristics
from .models import AdaptiveBackgroundModel
from src.core.ai_config import ai_config

# ─────────────────────────────────────────────────────────────────────────────
# TRUE Multi-Space Consensus Map
# Each entry defines a LIST of color spaces that are ALL independently processed.
# The final foreground mask is the bitwise AND of every individual result —
# meaning ALL judges must agree that motion exists before it is declared real.
# ─────────────────────────────────────────────────────────────────────────────
COLOR_SPACE_CONSENSUS: dict[str, List[ColorSpace]] = {
    # ✅ Dual Consensus: both YCrCb AND HSV must independently detect motion
    "YCbCr + HSV (Dual Consensus)": [
        ColorSpace.YCrCb,
        ColorSpace.HSV,
    ],
    # ✅ Illumination Adaptive: Lab suppresses glare; RGB validates real color change
    "Lab + RGB (Illumination Adaptive)": [
        ColorSpace.LAB,
        ColorSpace.RGB,
    ],
    # ✅ Triple Consensus: all three must agree — zero false alarms
    "YCbCr + Lab + HSV (Triple Multi-Space)": [
        ColorSpace.YCrCb,
        ColorSpace.LAB,
        ColorSpace.HSV,
    ],
    # ✅ Single space for max speed — no consensus overhead
    "Standard RGB (High Speed / Low CPU)": [
        ColorSpace.RGB,
    ],
}


class AdaptiveBGS:
    """
    Universal Adaptive Multi-Color Space Background Subtraction Engine.
    Supports TRUE multi-space consensus: runs MOG2 independently per color
    space and ANDs the resulting masks together. This ensures that only
    motion confirmed by ALL chosen color judges triggers an alert —
    eliminating shadows, glare, and lighting shifts as false positives.
    """

    def __init__(self, auto_select_color_space: bool = True, default_space: ColorSpace = ColorSpace.RGB):
        self.auto_select = auto_select_color_space
        self.current_space = default_space

        # One dedicated background model per color space (up to 3 for Triple consensus)
        # Each is a separate MOG2 instance so they learn independently
        self._models: dict[ColorSpace, AdaptiveBackgroundModel] = {}

        # State tracking for sudden illumination changes
        self.prev_gray: Optional[np.ndarray] = None
        self.frame_count = 0

    def _get_model(self, space: ColorSpace) -> AdaptiveBackgroundModel:
        """Lazily initialise a dedicated MOG2 model for each color space."""
        if space not in self._models:
            self._models[space] = AdaptiveBackgroundModel()
        return self._models[space]

    def _detect_illumination_change(self, current_gray: np.ndarray) -> bool:
        """
        Detects sudden global illumination changes between consecutive frames.
        """
        if self.prev_gray is None:
            return False
        # Calculate absolute difference in mean brightness
        diff = abs(np.mean(current_gray) - np.mean(self.prev_gray))
        return diff > 30.0  # Threshold for sudden change (e.g., lights turned on/off)

    def _apply_learning_rate(self, rate: float):
        """Apply the same learning rate update to every active model."""
        for model in self._models.values():
            model.update_learning_rate(rate)

    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, dict]:
        """
        Processes a raw BGR frame with TRUE multi-space consensus.

        Returns:
            - The foreground mask (binary image) — AND of all consensus channels.
            - A dictionary containing metadata (active spaces, latency, etc.).
        """
        start_time = time.time()
        self.frame_count += 1

        # 1. Illumination check — adapts learning rate across all models
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        sudden_change = self._detect_illumination_change(gray)
        self.prev_gray = gray

        if sudden_change:
            self._apply_learning_rate(0.5)   # Fast adaptation on sudden light change
        else:
            self._apply_learning_rate(-1)     # Default adaptive learning

        # 2. Determine which color spaces to use for this frame
        active_spaces: List[ColorSpace] = []
        user_choice = COLOR_SPACE_CONSENSUS.get(ai_config.color_space)

        if user_choice:
            # User has a saved preference — use their exact consensus group
            active_spaces = user_choice
        elif self.auto_select and self.frame_count % 300 == 1:
            # Auto-pilot: re-evaluate the single best color space every 300 frames
            self.current_space = analyze_frame_characteristics(frame)
            active_spaces = [self.current_space]
        else:
            active_spaces = [self.current_space]

        # 3. TRUE CONSENSUS: run each color space through its own MOG2 independently
        individual_masks: List[np.ndarray] = []
        for space in active_spaces:
            converted = convert_color_space(frame, space)
            model = self._get_model(space)
            mask = model.apply(converted)
            individual_masks.append(mask)

        # 4. Merge all masks with bitwise AND
        # This is the "consensus" — only pixels that ALL color space models
        # agree are foreground (255) survive. Shadows that fool one model
        # but not the others are eliminated here.
        if len(individual_masks) == 1:
            fg_mask = individual_masks[0]
        else:
            fg_mask = individual_masks[0]
            for mask in individual_masks[1:]:
                fg_mask = cv2.bitwise_and(fg_mask, mask)

        # 5. Measure performance
        latency = (time.time() - start_time) * 1000  # ms

        meta = {
            "color_spaces_active": [s.value for s in active_spaces],
            "consensus_count": len(active_spaces),
            "sudden_illumination_change": sudden_change,
            "latency_ms": round(latency, 2),
        }

        return fg_mask, meta
