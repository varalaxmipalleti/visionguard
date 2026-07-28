"""
Global AI Configuration Singleton.
Holds the live active AI settings that all detection & background subtraction engines read from.
When settings are saved via the API, this object is updated in-place — the next AI frame
processed will immediately use the new values with zero server restart required.
"""

class AIConfig:
    """
    In-memory singleton for live AI engine parameters.
    All values here serve as the application-wide defaults.
    """
    # --- Neural Inference Engine ---
    # Min certainty (0.0 to 1.0) required before tagging a detection as real
    confidence_threshold: float = 0.30

    # IOU overlap ratio for Non-Maximum Suppression bounding box deduplication
    nms_iou: float = 0.40

    # Whether to enable CUDA/DirectML GPU hardware acceleration
    gpu_enabled: bool = True

    # --- Adaptive Background Subtraction ---
    # Active color space consensus mode for motion detection
    color_space: str = "YCbCr + HSV (Dual Consensus)"

# Global singleton instance — import and use this directly everywhere
ai_config = AIConfig()
