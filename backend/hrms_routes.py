"""HRMS APIs protected by the centralized HRMS RBAC layer."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from database import database
from hrms_rbac import require_hrms_permission

hrms_router = APIRouter(prefix="/api/hrms", tags=["HRMS"])


class HRMSRoleAssignment(BaseModel):
    role_keys: List[str] = Field(default_factory=list)


@hrms_router.get("/authorization/me")
async def get_my_hrms_authorization(session: dict = Depends(require_hrms_permission("hrms.access"))):
    return {
        "success": True,
        "data": {
            "roles": session.get("roles", []),
            "permissions": session.get("permissions", []),
        },
    }


@hrms_router.get("/roles")
async def list_hrms_roles(session: dict = Depends(require_hrms_permission("settings.manage"))):
    return {"success": True, "data": await database.get_hrms_roles()}


@hrms_router.get("/users")
async def list_hrms_users(
    search: Optional[str] = Query(None, max_length=100),
    session: dict = Depends(require_hrms_permission("settings.manage")),
):
    users = await database.list_hrms_users(search)
    for user in users:
        authorization = await database.get_user_hrms_authorization(user["id"])
        user["roles"] = authorization["roles"]
        user["permissions"] = authorization["permissions"]
    return {"success": True, "data": users}


@hrms_router.get("/users/{user_id}/roles")
async def get_user_hrms_roles(
    user_id: str,
    session: dict = Depends(require_hrms_permission("settings.manage")),
):
    user = await database.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "data": await database.get_user_hrms_authorization(user_id)}


@hrms_router.put("/users/{user_id}/roles")
async def assign_user_hrms_roles(
    user_id: str,
    assignment: HRMSRoleAssignment,
    session: dict = Depends(require_hrms_permission("settings.manage")),
):
    user = await database.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not await database.assign_hrms_roles(user_id, assignment.role_keys):
        raise HTTPException(status_code=400, detail="One or more HRMS roles are invalid")
    authorization = await database.get_user_hrms_authorization(user_id)
    return {"success": True, "data": authorization}
