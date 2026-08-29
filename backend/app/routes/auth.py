import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.auth import (
    hash_password,
    verify_password,
    validate_email,
    create_access_token,
    get_current_user,
    check_login_rate_limit,
    record_failed_login,
    clear_failed_login
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_suspended: bool
    created_at: str

@router.post("/signup")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    name = payload.name.strip()
    email = payload.email.lower().strip()
    password = payload.password

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name cannot be empty"
        )

    if not validate_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format. Please provide a valid email address."
        )

    if len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Check if duplicate email exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in instead."
        )

    # Create new customer user (Role is strictly forced to "customer")
    new_user = User(
        id=f"usr_{uuid.uuid4().hex[:12]}",
        name=name,
        email=email,
        hashed_password=hash_password(password),
        role="customer",
        is_suspended=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue JWT Token
    token = create_access_token(data={"sub": new_user.id, "email": new_user.email, "role": new_user.role})

    return {
        "success": True,
        "message": "Account created successfully",
        "token": token,
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "is_suspended": new_user.is_suspended,
            "created_at": new_user.created_at
        }
    }

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    password = payload.password

    # Check rate limiter
    check_login_rate_limit(email)

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        record_failed_login(email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please try again."
        )

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support."
        )

    # Clear rate limit state on successful authentication
    clear_failed_login(email)

    # Issue JWT Token
    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})

    return {
        "success": True,
        "message": "Logged in successfully",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_suspended": user.is_suspended,
            "created_at": user.created_at
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "is_suspended": current_user.is_suspended,
            "created_at": current_user.created_at
        }
    }
