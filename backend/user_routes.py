"""User account and CRM routes"""
from fastapi import APIRouter, Depends, Header, HTTPException
from typing import Optional
import uuid

from database import database
from hrms_rbac import has_permission
from models import CompanyDocumentUpdate, HRMSLogin, UserLogin, UserRegister
from user_auth import create_session, delete_session, hash_password, verify_password, verify_session

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


async def verify_hrms_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="HRMS authentication required")
    token = authorization.replace("Bearer ", "", 1)
    session = verify_session(token)
    if not session:
        raise HTTPException(status_code=403, detail="You are not authorized to access HRMS")
    user = await database.get_user_by_id(session["user_id"])
    if not user:
        delete_session(token)
        raise HTTPException(status_code=403, detail="You are not authorized to access HRMS")
    authorization = await database.get_user_hrms_authorization(user["id"])
    if not has_permission(authorization, "hrms.access"):
        delete_session(token)
        raise HTTPException(status_code=403, detail="You are not authorized to access HRMS")
    session["user"] = user
    session["token"] = token
    session["roles"] = authorization["roles"]
    session["permissions"] = authorization["permissions"]
    return session


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
        "permissions": [],
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


@user_router.get("/company-documents/{service_id}")
async def get_company_documents(service_id: str, session: dict = Depends(verify_user_token)):
    documents = await database.get_user_company_documents(session["user_id"], service_id)
    return {"success": True, "data": documents}


@user_router.put("/company-documents/{service_id}")
async def update_company_document(
    service_id: str,
    document: CompanyDocumentUpdate,
    session: dict = Depends(verify_user_token),
):
    document_data = document.model_dump()
    document_data.update({
        "id": str(uuid.uuid4()),
        "user_id": session["user_id"],
        "service_id": service_id,
    })
    saved_document = await database.upsert_user_company_document(document_data)
    return {"success": True, "data": saved_document}


@user_router.post("/hrms/login")
async def login_hrms(credentials: HRMSLogin):
    user = await database.get_user_by_identifier(credentials.identifier)
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email/username or password")
    authorization = await database.get_user_hrms_authorization(user["id"])
    if not has_permission(authorization, "hrms.access"):
        raise HTTPException(status_code=403, detail="Credentials accepted, but this account has no HRMS role assigned")

    session = create_session(
        user["id"],
        user["email"],
        authorization["permissions"],
        remember_me=credentials.remember_me,
    )
    session["roles"] = authorization["roles"]
    return {
        "success": True,
        "token": session["token"],
        "user": public_user(user),
        "roles": authorization["roles"],
        "permissions": authorization["permissions"],
    }


@user_router.get("/hrms/verify")
async def verify_hrms(session: dict = Depends(verify_hrms_token)):
    return {
        "success": True,
        "user": public_user(session["user"]),
        "roles": session.get("roles", []),
        "permissions": session.get("permissions", []),
    }


@user_router.post("/hrms/logout")
async def logout_hrms(session: dict = Depends(verify_hrms_token)):
    delete_session(session["token"])
    return {"success": True, "message": "Logged out successfully"}


@user_router.get("/hrms/dashboard")
async def get_hrms_dashboard(session: dict = Depends(verify_hrms_token)):
    return {
        "success": True,
        "data": {
            "user": public_user(session["user"]),
            "roles": session.get("roles", []),
            "permissions": session.get("permissions", []),
        },
    }