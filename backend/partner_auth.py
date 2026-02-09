"""
Partner authentication and session management
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets

# Simple session storage (in-memory)
active_partner_sessions = {}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_session_token() -> str:
    return secrets.token_urlsafe(32)

def create_session(partner_id: str, username: str) -> dict:
    token = create_session_token()
    session_data = {
        "partner_id": partner_id,
        "username": username,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    }
    active_partner_sessions[token] = session_data
    return {"token": token, **session_data}

def verify_session(token: str) -> Optional[dict]:
    session = active_partner_sessions.get(token)
    if not session:
        return None
    if datetime.utcnow() > session["expires_at"]:
        del active_partner_sessions[token]
        return None
    return session

def delete_session(token: str):
    if token in active_partner_sessions:
        del active_partner_sessions[token]

def extend_session(token: str):
    if token in active_partner_sessions:
        active_partner_sessions[token]["expires_at"] = datetime.utcnow() + timedelta(hours=24)
