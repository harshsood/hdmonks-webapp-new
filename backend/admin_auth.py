"""
Admin authentication and session management
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
from models import Admin, AdminLogin

# Simple session storage (in-memory for now, can be moved to Redis later)
active_sessions = {}

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed

def create_session_token() -> str:
    """Generate secure session token"""
    return secrets.token_urlsafe(32)

def create_session(admin_id: str, username: str) -> dict:
    """Create new session"""
    token = create_session_token()
    session_data = {
        "admin_id": admin_id,
        "username": username,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    }
    active_sessions[token] = session_data
    return {"token": token, **session_data}

def verify_session(token: str) -> Optional[dict]:
    """Verify if session token is valid"""
    session = active_sessions.get(token)
    if not session:
        return None
    
    if datetime.utcnow() > session["expires_at"]:
        del active_sessions[token]
        return None
    
    return session

def delete_session(token: str):
    """Delete session (logout)"""
    if token in active_sessions:
        del active_sessions[token]

def extend_session(token: str):
    """Extend session expiry"""
    if token in active_sessions:
        active_sessions[token]["expires_at"] = datetime.utcnow() + timedelta(hours=24)
