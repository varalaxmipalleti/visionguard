from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import select
from src.core.database import get_db
from src.core.ai_config import ai_config
from src.features.auth.dependencies import get_current_user, require_admin
from src.features.users.models import User
from src.features.users.schemas import UserSettings, UserResponse, VALID_COLOR_SPACES

router = APIRouter()


@router.post("/sync", response_model=UserResponse)
async def sync_settings(
    settings: UserSettings,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Saves a user's AI engine preferences to the database and
    immediately applies them to the live running AI engine singleton.
    """
    # Validate ranges
    if not (0.05 <= settings.confidence <= 0.95):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Confidence threshold must be between 5% and 95%."
        )
    if not (0.10 <= settings.nms_iou <= 0.90):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="NMS IOU must be between 10% and 90%."
        )
    if settings.color_space not in VALID_COLOR_SPACES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid color space. Choose from: {', '.join(VALID_COLOR_SPACES)}"
        )

    # 1. Persist to database (per-user)
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.settings_confidence = settings.confidence
    user.settings_nms_iou = settings.nms_iou
    user.settings_gpu_enabled = settings.gpu_enabled
    user.settings_color_space = settings.color_space
    await db.commit()
    await db.refresh(user)

    # 2. Immediately update the live in-memory AI config singleton
    # The very next video frame processed will use these new values!
    ai_config.confidence_threshold = settings.confidence
    ai_config.nms_iou = settings.nms_iou
    ai_config.gpu_enabled = settings.gpu_enabled
    ai_config.color_space = settings.color_space

    return user


@router.get("/me", response_model=UserResponse)
async def get_my_settings(
    current_user: User = Depends(get_current_user),
):
    """
    Returns the currently saved AI engine preferences for the logged-in user.
    Called by the frontend on Settings page load to restore last saved slider positions.
    """
    return current_user


@router.get("/global")
async def get_global_ai_config(
    current_user: User = Depends(require_admin),
):
    """
    [ADMIN ONLY] Returns the current live in-memory AIConfig state —
    the exact parameters all active AI detection engines are running on right now.
    """
    return {
        "confidence_threshold": ai_config.confidence_threshold,
        "nms_iou": ai_config.nms_iou,
        "gpu_enabled": ai_config.gpu_enabled,
        "color_space": ai_config.color_space,
    }
