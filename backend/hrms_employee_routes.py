"""Employee management APIs with centralized HRMS RBAC and record scoping."""

import csv
import io
import re
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pymongo.errors import DuplicateKeyError

from database import database
from hrms_rbac import can_access_employee, has_permission, require_hrms_permission
from models import EmployeeCreate, EmployeeDocumentCreate, EmployeeStatusUpdate, EmployeeUpdate

employee_router = APIRouter(prefix="/api/hrms/employees", tags=["HRMS Employees"])

SENSITIVE_FIELDS = {
    "bank_name",
    "bank_account_number",
    "bank_ifsc",
    "payment_method",
    "tax_information",
}
SENSITIVE_DOCUMENT_TYPES = {"salary_revision"}


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def can_view_financial_data(session: dict) -> bool:
    return has_permission(session, "salary.view") or "super_admin" in session.get("roles", [])


def employee_query_for_scope(session: dict) -> Dict[str, Any]:
    roles = session.get("roles", [])
    user_id = session["user_id"]
    if "manager" in roles and not ({"super_admin", "hr_admin", "payroll_admin", "finance", "recruiter", "hr_viewer"} & set(roles)):
        return {"$or": [{"user_id": user_id}, {"manager_user_id": user_id}, {"manager_user_ids": user_id}]}
    if "employee" in roles and not ({"super_admin", "hr_admin", "payroll_admin", "finance", "recruiter", "hr_viewer", "manager"} & set(roles)):
        return {"user_id": user_id}
    return {}


def merge_query(scope_query: Dict[str, Any], filters: Dict[str, Any]) -> Dict[str, Any]:
    clauses = []
    if scope_query:
        clauses.append(scope_query)
    clauses.extend({key: value} for key, value in filters.items() if value is not None)
    if not clauses:
        return {}
    if len(clauses) == 1:
        return clauses[0]
    return {"$and": clauses}


def project_employee(employee: dict, session: dict) -> dict:
    result = dict(employee)
    result.pop("_id", None)
    if not can_view_financial_data(session):
        for field in SENSITIVE_FIELDS:
            result.pop(field, None)
    return result


async def get_scoped_employee(employee_id: str, session: dict, sensitive: bool = False) -> dict:
    employee = await database.get_hrms_employee(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if not can_access_employee(session, employee, sensitive=sensitive):
        raise HTTPException(status_code=403, detail="You are not authorized to access this employee record")
    return employee


async def audit_employee(session: dict, employee_id: str, action: str, changed_fields: list[str]) -> None:
    timestamp = now_iso()
    await database.create_hrms_audit_log({
        "id": str(uuid.uuid4()),
        "actor_user_id": session["user_id"],
        "action": action,
        "entity_type": "employee",
        "entity_id": employee_id,
        "changed_fields": changed_fields,
        "created_at": timestamp,
    })
    await database.create_hrms_activity({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "actor_user_id": session["user_id"],
        "activity_type": action,
        "summary": f"Employee record {action}",
        "created_at": timestamp,
    })


def employee_filters(
    search: Optional[str],
    department: Optional[str],
    designation: Optional[str],
    location: Optional[str],
    employment_status: Optional[str],
    employment_type: Optional[str],
    joining_date_from: Optional[str],
    joining_date_to: Optional[str],
) -> Dict[str, Any]:
    filters: Dict[str, Any] = {}
    if search:
        safe_search = re.escape(search.strip())
        filters["$or"] = [
            {"employee_code": {"$regex": safe_search, "$options": "i"}},
            {"first_name": {"$regex": safe_search, "$options": "i"}},
            {"last_name": {"$regex": safe_search, "$options": "i"}},
            {"work_email": {"$regex": safe_search, "$options": "i"}},
        ]
    for key, value in {
        "department": department,
        "designation": designation,
        "location": location,
        "employment_status": employment_status,
        "employment_type": employment_type,
    }.items():
        if value:
            filters[key] = value
    if joining_date_from or joining_date_to:
        date_filter: Dict[str, str] = {}
        if joining_date_from:
            date_filter["$gte"] = joining_date_from
        if joining_date_to:
            date_filter["$lte"] = joining_date_to
        filters["date_of_joining"] = date_filter
    return filters


@employee_router.get("")
async def list_employees(
    search: Optional[str] = Query(None, max_length=100),
    department: Optional[str] = Query(None, max_length=100),
    designation: Optional[str] = Query(None, max_length=100),
    location: Optional[str] = Query(None, max_length=100),
    employment_status: Optional[str] = Query(None, pattern="^(active|inactive|archived)$"),
    employment_type: Optional[str] = Query(None, pattern="^(full_time|part_time|contract|intern|consultant)$"),
    joining_date_from: Optional[str] = None,
    joining_date_to: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    session: dict = Depends(require_hrms_permission("employees.view")),
):
    filters = employee_filters(search, department, designation, location, employment_status, employment_type, joining_date_from, joining_date_to)
    query = merge_query(employee_query_for_scope(session), filters)
    total = await database.count_hrms_employees(query)
    employees = await database.list_hrms_employees(query, sort_by, 1 if sort_order == "asc" else -1, (page - 1) * page_size, page_size)
    return {
        "success": True,
        "data": [project_employee(employee, session) for employee in employees],
        "pagination": {"page": page, "page_size": page_size, "total": total, "pages": (total + page_size - 1) // page_size},
    }


@employee_router.get("/filters")
async def employee_filter_options(session: dict = Depends(require_hrms_permission("employees.view"))):
    return {"success": True, "data": await database.get_hrms_employee_filter_options(employee_query_for_scope(session))}


@employee_router.get("/export")
async def export_employees(
    search: Optional[str] = Query(None, max_length=100),
    department: Optional[str] = None,
    designation: Optional[str] = None,
    location: Optional[str] = None,
    employment_status: Optional[str] = None,
    employment_type: Optional[str] = None,
    joining_date_from: Optional[str] = None,
    joining_date_to: Optional[str] = None,
    session: dict = Depends(require_hrms_permission("employees.export")),
):
    filters = employee_filters(search, department, designation, location, employment_status, employment_type, joining_date_from, joining_date_to)
    query = merge_query(employee_query_for_scope(session), filters)
    employees = await database.list_hrms_employees(query, "employee_code", 1, 0, 10000)
    output = io.StringIO()
    fieldnames = ["employee_code", "first_name", "last_name", "work_email", "department", "designation", "location", "employment_type", "employment_status", "date_of_joining"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for employee in employees:
        writer.writerow({field: employee.get(field, "") for field in fieldnames})
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=employees.csv"})


@employee_router.post("")
async def create_employee(payload: EmployeeCreate, session: dict = Depends(require_hrms_permission("employees.create"))):
    data = payload.model_dump(exclude_none=True)
    sensitive_fields = SENSITIVE_FIELDS.intersection(data)
    if sensitive_fields and not has_permission(session, "salary.update"):
        raise HTTPException(status_code=403, detail="Salary permission is required for bank and tax information")
    employee_id = str(uuid.uuid4())
    timestamp = now_iso()
    data.update({"id": employee_id, "created_at": timestamp, "updated_at": timestamp})
    try:
        created = await database.create_hrms_employee(data)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Employee ID or linked user is already in use")
    await audit_employee(session, employee_id, "created", list(data.keys()))
    return {"success": True, "data": project_employee(created, session)}


@employee_router.get("/{employee_id}")
async def get_employee(employee_id: str, session: dict = Depends(require_hrms_permission("employees.view"))):
    employee = await get_scoped_employee(employee_id, session, sensitive=False)
    return {"success": True, "data": project_employee(employee, session)}


@employee_router.put("/{employee_id}")
async def update_employee(employee_id: str, payload: EmployeeUpdate, session: dict = Depends(require_hrms_permission("employees.view"))):
    existing = await get_scoped_employee(employee_id, session, sensitive=False)
    data = payload.model_dump(exclude_none=True)
    if not has_permission(session, "employees.update"):
        self_service_fields = {"profile_photo_url", "personal_email", "phone", "address", "emergency_contact"}
        if existing.get("user_id") != session["user_id"] or not set(data).issubset(self_service_fields):
            raise HTTPException(status_code=403, detail="You can only update your own allowed profile fields")
    sensitive_fields = SENSITIVE_FIELDS.intersection(data)
    if sensitive_fields and not has_permission(session, "salary.update"):
        raise HTTPException(status_code=403, detail="Salary permission is required for bank and tax information")
    if not data:
        raise HTTPException(status_code=400, detail="No update fields provided")
    data["updated_at"] = now_iso()
    try:
        updated = await database.update_hrms_employee(employee_id, data)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Employee ID or linked user is already in use")
    changed_fields = [key for key in data if key != "updated_at"]
    await audit_employee(session, employee_id, "updated", changed_fields)
    return {"success": True, "data": project_employee(updated, session)}


@employee_router.post("/{employee_id}/status")
async def update_employee_status(employee_id: str, payload: EmployeeStatusUpdate, session: dict = Depends(require_hrms_permission("employees.update"))):
    employee = await get_scoped_employee(employee_id, session, sensitive=False)
    if payload.status == "archived" and not has_permission(session, "employees.delete"):
        raise HTTPException(status_code=403, detail="Employee archive permission is required")
    updated = await database.update_hrms_employee(employee_id, {"employment_status": payload.status, "updated_at": now_iso(), "status_reason": payload.reason})
    await audit_employee(session, employee_id, payload.status, ["employment_status", "status_reason"])
    return {"success": True, "data": project_employee(updated, session)}


@employee_router.get("/{employee_id}/documents")
async def list_employee_documents(employee_id: str, session: dict = Depends(require_hrms_permission("documents.view"))):
    await get_scoped_employee(employee_id, session, sensitive=False)
    documents = await database.list_hrms_documents(employee_id)
    if not can_view_financial_data(session):
        documents = [document for document in documents if document.get("document_type") not in SENSITIVE_DOCUMENT_TYPES]
    return {"success": True, "data": documents}


@employee_router.post("/{employee_id}/documents")
async def add_employee_document(employee_id: str, payload: EmployeeDocumentCreate, session: dict = Depends(require_hrms_permission("documents.upload"))):
    await get_scoped_employee(employee_id, session, sensitive=payload.document_type in SENSITIVE_DOCUMENT_TYPES)
    if payload.document_type == "salary_revision" and not has_permission(session, "salary.update"):
        raise HTTPException(status_code=403, detail="Salary permission is required for salary revision documents")
    data = payload.model_dump(exclude_none=True)
    data.update({"id": str(uuid.uuid4()), "employee_id": employee_id, "uploaded_by": session["user_id"], "created_at": now_iso()})
    created = await database.create_hrms_document(data)
    await audit_employee(session, employee_id, "document_uploaded", ["document_type", "file_name"])
    return {"success": True, "data": created}


@employee_router.get("/{employee_id}/timeline")
async def employee_timeline(employee_id: str, session: dict = Depends(require_hrms_permission("employees.view"))):
    await get_scoped_employee(employee_id, session, sensitive=False)
    return {"success": True, "data": await database.list_hrms_activity(employee_id)}
