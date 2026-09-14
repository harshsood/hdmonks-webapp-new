"""CRUD APIs for the HRMS organization hierarchy."""

import uuid
from datetime import datetime
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException

from database import database
from hrms_rbac import require_hrms_permission
from models import OrganizationResource, OrganizationResourceUpdate

organization_router = APIRouter(prefix="/api/hrms/organization", tags=["HRMS Organization"])
RESOURCE_TYPES = ("companies", "branches", "departments", "teams", "designations", "job_grades", "locations", "employment_types")
PARENT_FIELDS = {
    "branches": ("company_id", "companies"),
    "departments": ("branch_id", "branches"),
    "teams": ("department_id", "departments"),
}


def validate_resource(resource: str):
    if resource not in RESOURCE_TYPES:
        raise HTTPException(status_code=404, detail="Unknown organization resource")


async def validate_parents(resource: str, data: Dict[str, object]) -> None:
    if resource in PARENT_FIELDS:
        field, parent_resource = PARENT_FIELDS[resource]
        parent_id = data.get(field)
        if parent_id and not await database.get_hrms_resource(parent_resource, str(parent_id)):
            raise HTTPException(status_code=400, detail=f"Referenced {parent_resource[:-1]} does not exist")


async def audit(session: dict, action: str, resource: str, resource_id: str, fields: List[str]):
    await database.create_hrms_audit_log({
        "id": str(uuid.uuid4()),
        "actor_user_id": session["user_id"],
        "action": action,
        "entity_type": f"organization_{resource}",
        "entity_id": resource_id,
        "changed_fields": fields,
        "created_at": datetime.utcnow().isoformat(),
    })


@organization_router.get("")
async def get_organization_hierarchy(session: dict = Depends(require_hrms_permission("organization.view"))):
    data = {resource: await database.list_hrms_resources(resource) for resource in RESOURCE_TYPES}
    employees = await database.list_hrms_employees({}, "employee_code", 1, 0, 1000)
    data["employees"] = [
        {"id": employee["id"], "name": f'{employee.get("first_name", "")} {employee.get("last_name", "")}'.strip(), "manager_employee_id": employee.get("manager_employee_id"), "department": employee.get("department"), "team_id": employee.get("team_id")}
        for employee in employees
    ]
    return {"success": True, "data": data}


@organization_router.get("/{resource}")
async def list_organization_resource(resource: str, session: dict = Depends(require_hrms_permission("organization.view"))):
    validate_resource(resource)
    return {"success": True, "data": await database.list_hrms_resources(resource)}


@organization_router.post("/{resource}")
async def create_organization_resource(resource: str, payload: OrganizationResource, session: dict = Depends(require_hrms_permission("organization.manage"))):
    validate_resource(resource)
    data = payload.model_dump(exclude_none=True)
    await validate_parents(resource, data)
    data.update({"id": str(uuid.uuid4()), "created_at": datetime.utcnow().isoformat(), "updated_at": datetime.utcnow().isoformat()})
    created = await database.create_hrms_resource(resource, data)
    await audit(session, "created", resource, data["id"], list(data.keys()))
    return {"success": True, "data": created}


@organization_router.put("/{resource}/{resource_id}")
async def update_organization_resource(resource: str, resource_id: str, payload: OrganizationResourceUpdate, session: dict = Depends(require_hrms_permission("organization.manage"))):
    validate_resource(resource)
    if not await database.get_hrms_resource(resource, resource_id):
        raise HTTPException(status_code=404, detail="Organization record not found")
    data = payload.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No update fields provided")
    await validate_parents(resource, data)
    data["updated_at"] = datetime.utcnow().isoformat()
    updated = await database.update_hrms_resource(resource, resource_id, data)
    await audit(session, "updated", resource, resource_id, list(data.keys()))
    return {"success": True, "data": updated}


@organization_router.delete("/{resource}/{resource_id}")
async def deactivate_organization_resource(resource: str, resource_id: str, session: dict = Depends(require_hrms_permission("organization.manage"))):
    validate_resource(resource)
    existing = await database.get_hrms_resource(resource, resource_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Organization record not found")
    updated = await database.update_hrms_resource(resource, resource_id, {"is_active": False, "updated_at": datetime.utcnow().isoformat()})
    await audit(session, "deactivated", resource, resource_id, ["is_active"])
    return {"success": True, "data": updated}
