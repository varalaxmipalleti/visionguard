from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy.future import select
from pydantic import BaseModel
from src.core.database import get_db
from src.features.users.schemas import UserResponse, UserListResponse
from src.features.users.models import User
from src.features.auth.dependencies import get_current_active_user, require_admin
import src.features.users.service as user_service

router = APIRouter()


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
):
    """Get the currently authenticated user's profile."""
    return current_user


@router.post("/me/api-key/regenerate", status_code=200)
async def regenerate_my_api_key(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Regenerate and return a new API key for the authenticated user."""
    new_key = await user_service.regenerate_api_key(db, current_user)
    return {"api_key": new_key}


@router.put("/me/change-password", status_code=200)
async def change_my_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change the authenticated user's own password.
    Requires the correct current password to proceed.
    """
    import re
    if len(req.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must be at least 8 characters."
        )
    if not re.search(r"[A-Z]", req.new_password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must contain at least 1 uppercase letter."
        )
    if not re.search(r"[0-9]", req.new_password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must contain at least 1 number."
        )
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-]', req.new_password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must contain at least 1 special symbol."
        )
    success = await user_service.change_password(db, current_user, req.current_password, req.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )
    return {"message": "Password changed successfully."}


@router.delete("/me", status_code=200)
async def delete_my_account(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently delete the authenticated user's own account.
    This action is irreversible.
    """
    deleted = await user_service.delete_user(db, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Account not found.")
    return {"message": "Your account has been permanently deleted."}


@router.get("/all", response_model=UserListResponse)
async def list_all_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    [ADMIN ONLY] Returns a list of all registered users in the system.
    """
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return UserListResponse(users=list(users), total=len(users))


@router.put("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """[ADMIN ONLY] Deactivates a user account."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Administrators cannot deactivate their own account.")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = False
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """[ADMIN ONLY] Reactivates a previously deactivated user account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = True
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=200)
async def admin_delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    [ADMIN ONLY] Permanently deletes a user account. Irreversible.
    Admin cannot delete their own account.
    """
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own account.")
    deleted = await user_service.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"message": "User account permanently deleted."}
