"""User authentication and session management"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets

active_user_sessions = {}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def create_session(user_id: str, email: str) -> dict:
    token = secrets.token_urlsafe(32)
    session_data = {
        "user_id": user_id,
        "email": email,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24),
    }
    active_user_sessions[token] = session_data
    return {"token": token, **session_data}


def verify_session(token: str) -> Optional[dict]:
    session = active_user_sessions.get(token)
    if not session:
        return None
    if datetime.utcnow() > session["expires_at"]:
        del active_user_sessions[token]
        return None
    return session


def delete_session(token: str):
    active_user_sessions.pop(token, None)