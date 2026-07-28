from fastapi import APIRouter, Depends
from pydantic import BaseModel
from src.features.users.models import User
from src.features.auth.dependencies import get_current_active_user
from src.features.alerts.service import alert_service

router = APIRouter()

class AlertSettings(BaseModel):
    email_enabled: bool
    telegram_enabled: bool

@router.get("/settings", response_model=AlertSettings)
async def get_alert_settings(current_user: User = Depends(get_current_active_user)):
    """
    Get current user's notification settings.
    """
    return {
        "email_enabled": alert_service.email_enabled,
        "telegram_enabled": alert_service.telegram_enabled
    }

@router.post("/settings")
async def update_alert_settings(
    settings: AlertSettings,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update notification settings for motion and intrusion alerts.
    """
    alert_service.configure(email_enabled=settings.email_enabled, telegram_enabled=settings.telegram_enabled)
    return {"status": "success", "message": "Alert settings updated"}

@router.post("/trigger_test")
async def trigger_test_alert(current_user: User = Depends(get_current_active_user)):
    """
    Trigger a mock intrusion alert to verify settings.
    """
    result = await alert_service.trigger_alert(
        alert_type="Intrusion",
        message="Unauthorized person detected in restricted zone.",
        camera_name="Main Gate",
        recipient_email=current_user.email
    )
    return result
