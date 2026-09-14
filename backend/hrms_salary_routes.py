"""Restricted HRMS salary templates, assignments, revisions, and salary history."""

import uuid
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from database import database
from hrms_rbac import has_permission, require_hrms_permission
from models import SalaryAssignmentCreate, SalaryRevisionCreate, SalaryTemplateCreate

salary_router = APIRouter(prefix="/api/hrms/salary", tags=["HRMS Salary"])

EARNING_CODES = {"BASIC", "HRA", "CONVEYANCE", "SPECIAL_ALLOWANCE", "MEDICAL_ALLOWANCE", "OTHER_ALLOWANCE", "BONUS", "INCENTIVE", "OVERTIME"}
DEDUCTION_CODES = {"PF", "ESI", "PROFESSIONAL_TAX", "TDS", "LOAN", "ADVANCE", "OTHER_DEDUCTION"}


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def project_salary(record: dict) -> dict:
    result = dict(record)
    result.pop("_id", None)
    result.pop("employee_id", None)
    return result


def validate_components(earnings: list, deductions: list) -> None:
    for component in [*earnings, *deductions]:
        allowed = EARNING_CODES if component["component_type"] == "earning" else DEDUCTION_CODES
        if component["code"] not in allowed:
            raise HTTPException(status_code=400, detail=f"Unsupported salary component: {component['code']}")


async def employee_for_user(session: dict) -> dict:
    employee = await database.db.hrms_employees.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="No HRMS employee profile is linked to this account")
    return employee


async def authorized_employee(employee_id: str, session: dict, allow_own: bool = True) -> dict:
    employee = await database.get_hrms_employee(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if allow_own and employee.get("user_id") == session["user_id"] and "employee" in session.get("roles", []):
        return employee
    if not has_permission(session, "salary.view"):
        raise HTTPException(status_code=403, detail="Salary access is restricted")
    return employee


async def audit(session: dict, action: str, employee_id: str, details: Dict[str, Any]) -> None:
    await database.create_hrms_audit_log({
        "id": str(uuid.uuid4()), "actor_user_id": session["user_id"], "action": action,
        "entity_type": "salary", "entity_id": employee_id, "details": details, "created_at": now_iso(),
    })


@salary_router.get("/templates")
async def list_salary_templates(session: dict = Depends(require_hrms_permission("salary.view"))):
    return {"success": True, "data": await database.list_hrms_salary_templates(active_only=True)}


@salary_router.post("/templates")
async def create_salary_template(payload: SalaryTemplateCreate, session: dict = Depends(require_hrms_permission("salary.create"))):
    earnings = [component.model_dump() for component in payload.earnings]
    deductions = [component.model_dump() for component in payload.deductions]
    validate_components(earnings, deductions)
    data = payload.model_dump(exclude={"earnings", "deductions"})
    data.update({"id": str(uuid.uuid4()), "earnings": earnings, "deductions": deductions, "created_by": session["user_id"], "created_at": now_iso(), "updated_at": now_iso()})
    try:
        created = await database.create_hrms_salary_template(data)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Salary template name already exists")
    await audit(session, "salary_template_created", data["id"], {"name": data["name"]})
    return {"success": True, "data": created}


@salary_router.get("/employees/{employee_id}")
async def get_employee_salary(employee_id: str, session: dict = Depends(require_hrms_permission("hrms.access"))):
    await authorized_employee(employee_id, session)
    assignment = await database.get_hrms_salary_assignment(employee_id)
    return {"success": True, "data": project_salary(assignment) if assignment else None}


@salary_router.get("/employees/{employee_id}/history")
async def get_salary_history(employee_id: str, session: dict = Depends(require_hrms_permission("hrms.access"))):
    await authorized_employee(employee_id, session)
    history = await database.list_hrms_salary_history(employee_id)
    return {"success": True, "data": [project_salary(item) for item in history]}


@salary_router.post("/employees/{employee_id}")
async def assign_employee_salary(employee_id: str, payload: SalaryAssignmentCreate, session: dict = Depends(require_hrms_permission("salary.create"))):
    await authorized_employee(employee_id, session, allow_own=False)
    earnings = [component.model_dump() for component in payload.earnings]
    deductions = [component.model_dump() for component in payload.deductions]
    validate_components(earnings, deductions)
    data = payload.model_dump(exclude={"earnings", "deductions"})
    data.update({"id": str(uuid.uuid4()), "employee_id": employee_id, "earnings": earnings, "deductions": deductions, "created_by": session["user_id"], "created_at": now_iso()})
    created = await database.create_hrms_salary_assignment(data)
    await audit(session, "salary_assigned", employee_id, {"assignment_id": data["id"], "change_type": data["change_type"], "effective_date": data["effective_date"]})
    return {"success": True, "data": project_salary(created)}


@salary_router.post("/employees/{employee_id}/revision")
async def revise_employee_salary(employee_id: str, payload: SalaryRevisionCreate, session: dict = Depends(require_hrms_permission("salary.update"))):
    await authorized_employee(employee_id, session, allow_own=False)
    earnings = [component.model_dump() for component in payload.earnings]
    deductions = [component.model_dump() for component in payload.deductions]
    validate_components(earnings, deductions)
    data = payload.model_dump(exclude={"earnings", "deductions"})
    data.update({"id": str(uuid.uuid4()), "employee_id": employee_id, "earnings": earnings, "deductions": deductions, "created_by": session["user_id"], "created_at": now_iso()})
    created = await database.create_hrms_salary_assignment(data)
    await audit(session, "salary_revision_created", employee_id, {"assignment_id": data["id"], "change_type": data["change_type"], "effective_date": data["effective_date"]})
    return {"success": True, "data": project_salary(created)}
