import uuid
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.enums import UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def extract_token_from_request(
    request: Request,
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[str]:
    """Extract JWT token from Bearer header or access_token cookie."""
    if auth_header and auth_header.credentials:
        return auth_header.credentials
    # Fallback to HttpOnly cookie
    return request.cookies.get("access_token")


def get_current_user(
    request: Request,
    token: Optional[str] = Depends(extract_token_from_request),
    db: Session = Depends(get_db),
) -> User:
    """Validate current authenticated user from token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHENTICATED",
                    "message": "Authentication credentials were not provided",
                }
            },
        )

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHENTICATED",
                    "message": "Invalid or expired authentication token",
                }
            },
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHENTICATED",
                    "message": "Malformed token payload",
                }
            },
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHENTICATED",
                    "message": "Invalid user ID in token",
                }
            },
        )

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHENTICATED",
                    "message": "User account not found",
                }
            },
        )

    return user


def get_optional_current_user(
    request: Request,
    token: Optional[str] = Depends(extract_token_from_request),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Optionally resolve user if token is present and valid; otherwise None."""
    if not token:
        return None
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    user_id_str = payload.get("sub")
    if not user_id_str:
        return None
    try:
        user_uuid = uuid.UUID(user_id_str)
        return db.query(User).filter(User.id == user_uuid).first()
    except Exception:
        return None


def require_role(required_role: UserRole):
    """Dependency factory enforcing specific UserRole."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "FORBIDDEN",
                        "message": f"Operation requires '{required_role.value}' role",
                    }
                },
            )
        return current_user

    return role_checker


require_admin = require_role(UserRole.ADMIN)
require_candidate = require_role(UserRole.CANDIDATE)
