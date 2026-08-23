import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.models.user import User, CandidateProfile, PasswordResetToken
from app.models.enums import UserRole
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    AuthTokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
)
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set secure HttpOnly cookies for access and refresh tokens."""
    # Access token cookie (15 min)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_TTL_MIN * 60,
        expires=settings.ACCESS_TOKEN_TTL_MIN * 60,
        samesite="lax",
        secure=False,  # Set to True in production HTTPS
        path="/",
    )
    # Refresh token cookie (7 days)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
        expires=settings.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=False,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear access and refresh token cookies."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new candidate",
)
def register(
    data: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email_clean = data.email.strip().lower()

    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": {
                    "code": "EMAIL_ALREADY_EXISTS",
                    "message": "An account with this email address already exists",
                    "fields": {"email": "Email is already in use"},
                }
            },
        )

    # Create new candidate user
    user = User(
        email=email_clean,
        password_hash=get_password_hash(data.password),
        role=UserRole.CANDIDATE,
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        mobile=data.mobile.strip(),
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.flush()

    # Create initial candidate profile
    profile = CandidateProfile(
        user_id=user.id,
        is_fresher=False,
        total_experience_years=0.0,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    # Generate tokens
    access_token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        email=user.email,
    )
    refresh_token = create_refresh_token(subject=str(user.id))

    # Set cookies
    set_auth_cookies(response, access_token, refresh_token)

    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Authenticate user and set session cookies",
)
def login(
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email_clean = data.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password",
                }
            },
        )

    # Generate tokens
    access_token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        email=user.email,
    )
    refresh_token = create_refresh_token(subject=str(user.id))

    # Set cookies
    set_auth_cookies(response, access_token, refresh_token)

    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Clear authentication cookies",
)
def logout(response: Response):
    clear_auth_cookies(response)
    return MessageResponse(message="Logged out successfully")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Request password reset token link",
)
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    email_clean = data.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    # Constant-time behavior / no account enumeration
    if user:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(reset_record)
        db.commit()

        # In local development / Phase 2, token is logged for easy testing
        reset_link = f"{settings.PUBLIC_BASE_URL}/reset-password?token={raw_token}"
        # We can also print/log this for convenient local testing
        print(f"[AUTH] Password reset requested for {email_clean}. Reset link: {reset_link}")

    return MessageResponse(
        message="If this email is registered, a password reset link has been sent."
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using reset token",
)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    token_hash = hashlib.sha256(data.token.encode("utf-8")).hexdigest()
    now_utc = datetime.now(timezone.utc)

    reset_token = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now_utc,
        )
        .first()
    )

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_OR_EXPIRED_TOKEN",
                    "message": "The password reset token is invalid or has expired",
                }
            },
        )

    # Update user password
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "USER_NOT_FOUND",
                    "message": "Associated user account was not found",
                }
            },
        )

    user.password_hash = get_password_hash(data.new_password)
    reset_token.used_at = now_utc
    db.commit()

    return MessageResponse(message="Password has been reset successfully. You may now log in.")
