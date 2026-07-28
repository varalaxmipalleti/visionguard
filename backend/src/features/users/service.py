import random
import secrets
from datetime import datetime, timezone, timedelta
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy.future import select
from src.features.users.models import User
from src.features.users.schemas import UserCreate
from src.core.security import get_password_hash
from src.core.config import settings

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()

async def delete_user(db: AsyncSession, user_id: int) -> bool:
    """Permanently deletes a user account and all associated data."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        return False
    await db.delete(user)
    await db.commit()
    return True

async def change_password(
    db: AsyncSession, user: User, current_password: str, new_password: str
) -> bool:
    """Verifies current password and updates to the new one. Returns False if current password is wrong."""
    from src.core.security import verify_password
    if not verify_password(current_password, user.hashed_password):
        return False
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    await db.commit()
    return True

async def create_user(db: AsyncSession, user_in: UserCreate, is_verified: bool = False) -> User:
    hashed_password = get_password_hash(user_in.password)
    api_key = f"vg_live_{secrets.token_hex(12)}_secure"
    db_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
        role="user",  # Always force "user" — role CANNOT be set from the registration request
        is_verified=is_verified,
        api_key=api_key
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def regenerate_api_key(db: AsyncSession, user: User) -> str:
    """Regenerates a new unique API key for the user and saves it to the database."""
    new_key = f"vg_live_{secrets.token_hex(12)}_secure"
    user.api_key = new_key
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return new_key

async def generate_and_set_otp(db: AsyncSession, user: User) -> str:
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    user.otp_code = otp_code
    user.otp_expires_at = expires_at
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return otp_code

async def verify_user_otp(db: AsyncSession, user: User, otp_code: str) -> bool:
    if not user.otp_code or not user.otp_expires_at:
        return False
    if user.otp_code.strip() != otp_code.strip():
        return False
    
    # Check expiration
    now = datetime.now(timezone.utc)
    expires = user.otp_expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
        
    if now > expires:
        return False
        
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return True

async def generate_password_reset_token(db: AsyncSession, user: User) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    user.reset_token = token
    user.reset_expires_at = expires_at
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return token

async def reset_user_password(db: AsyncSession, token: str, new_password: str) -> User | None:
    result = await db.execute(select(User).where(User.reset_token == token))
    user = result.scalars().first()
    if not user or not user.reset_expires_at:
        return None
        
    now = datetime.now(timezone.utc)
    expires = user.reset_expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
        
    if now > expires:
        return None
        
    user.hashed_password = get_password_hash(new_password)
    user.reset_token = None
    user.reset_expires_at = None
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
