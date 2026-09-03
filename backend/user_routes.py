"""User account and CRM routes"""
from fastapi import APIRouter, Depends, Header, HTTPException
from typing import Optional
import uuid

from database import database
from models import UserLogin, UserRegister
from user_auth import create_session, hash_password, verify_password, verify_session

user_router = APIRouter(prefix="/api/user", tags=["User"])


async def verify_user_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token provided")
    token = authorization.replace("Bearer ", "")
    session = verify_session(token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return session


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "created_at": user.get("created_at"),
    }


@user_router.post("/register")
async def register_user(credentials: UserRegister):
    existing_user = await database.get_user_by_email(str(credentials.email).lower())
    if existing_user:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_data = {
        "id": str(uuid.uuid4()),
        "full_name": credentials.full_name.strip(),
        "email": str(credentials.email).lower(),
        "password_hash": hash_password(credentials.password),
    }
    created_user = await database.create_user(user_data)
    session = create_session(created_user["id"], created_user["email"])
    return {"success": True, "token": session["token"], "user": public_user(created_user)}


@user_router.post("/login")
async def login_user(credentials: UserLogin):
    user = await database.get_user_by_email(str(credentials.email).lower())
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    session = create_session(user["id"], user["email"])
    return {"success": True, "token": session["token"], "user": public_user(user)}


@user_router.get("/verify")
async def verify_user(session: dict = Depends(verify_user_token)):
    user = await database.get_user_by_email(session["email"])
    if not user:
        raise HTTPException(status_code=401, detail="User account not found")
    return {"success": True, "user": public_user(user)}


@user_router.get("/dashboard")
async def get_user_dashboard(session: dict = Depends(verify_user_token)):
    user = await database.get_user_by_email(session["email"])
    if not user:
        raise HTTPException(status_code=401, detail="User account not found")
    return {
        "success": True,
        "data": {
            "user": public_user(user),
            "active_projects": 0,
            "open_requests": 0,
            "upcoming_consultations": 0,
        },
    }