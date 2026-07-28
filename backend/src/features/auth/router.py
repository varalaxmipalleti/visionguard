from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordRequestForm
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.core.security import verify_password, create_access_token
from src.core.email import send_verification_otp, send_password_reset_email
from src.features.users import service as user_service
from src.features.users.schemas import (
    UserCreate,
    UserResponse,
    VerifyEmailRequest,
    ResendOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from src.features.auth.dependencies import get_current_user
from src.features.users.models import User
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@router.post("/login", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, check email verification status and return access token.
    """
    user = await user_service.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED",
        )
    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user and generate a 6-digit OTP email verification pin.
    """
    user = await user_service.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = await user_service.create_user(db, user_in=user_in, is_verified=False)
    
    # Generate OTP and send email in background task
    otp_code = await user_service.generate_and_set_otp(db, user)
    background_tasks.add_task(send_verification_otp, user.email, otp_code)
    
    return {"message": "Registration successful. Please check your email for the verification code.", "email": user.email}

@router.post("/verify-email", response_model=Token)
async def verify_email_otp(
    req: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify user account using the 6-digit OTP pin and log in immediately.
    """
    user = await user_service.get_user_by_email(db, email=req.email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User account not found.",
        )
    if user.is_verified and not user.otp_code:
        access_token = create_access_token(subject=str(user.id))
        return {"access_token": access_token, "token_type": "bearer", "user": user}

    is_valid = await user_service.verify_user_otp(db, user, req.otp_code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please try again or request a new code.",
        )
        
    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/resend-otp")
async def resend_verification_otp(
    req: ResendOTPRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate and re-send a fresh 6-digit OTP verification code.
    """
    user = await user_service.get_user_by_email(db, email=req.email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )
    if user.is_verified:
        return {"message": "User is already verified."}
        
    otp_code = await user_service.generate_and_set_otp(db, user)
    background_tasks.add_task(send_verification_otp, user.email, otp_code)
    return {"message": "A new verification code has been dispatched."}

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Get real-time profile credentials of currently authenticated user.
    """
    return current_user

@router.post("/forgot-password")
async def forgot_password(
    req: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Dispatch an automated password reset recovery link via email.
    """
    user = await user_service.get_user_by_email(db, email=req.email)
    if not user:
        # To prevent user enumeration, respond with success even if email not found
        return {"message": "If an account matches this email, a recovery link has been dispatched."}
        
    reset_token = await user_service.generate_password_reset_token(db, user)
    background_tasks.add_task(send_password_reset_email, user.email, reset_token)
    return {"message": "If an account matches this email, a recovery link has been dispatched."}

@router.post("/reset-password", response_model=Token)
async def reset_password(
    req: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify reset token signature and set a fresh encrypted password.
    """
    user = await user_service.reset_user_password(db, token=req.token, new_password=req.new_password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link is invalid or has expired. Please request a new link."
        )
        
    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer", "user": user}

