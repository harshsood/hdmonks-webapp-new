"""HRMS attendance, correction approval, and policy APIs."""

import uuid
from datetime import datetime, date
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.errors import DuplicateKeyError

from database import database
from hrms_rbac import has_permission, require_hrms_permission
from models import AttendanceCheckRequest, AttendanceCorrectionCreate, AttendanceCorrectionDecision, AttendanceManualUpdate, AttendancePolicy

attendance_router = APIRouter(prefix="/api/hrms/attendance", tags=["HRMS Attendance"])


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def hours_between(check_in: Optional[str], check_out: Optional[str], break_minutes: int = 0) -> float:
    if not check_in or not check_out:
        return 0.0
    try:
        started = datetime.fromisoformat(check_in.replace("Z", "+00:00"))
        ended = datetime.fromisoformat(check_out.replace("Z", "+00:00"))
        return round(max(0, (ended - started).total_seconds() / 3600 - break_minutes / 60), 2)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid check-in or check-out timestamp")


async def own_employee(session: dict) -> dict:
    employee = await database.db.hrms_employees.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="No HRMS employee profile is linked to this account")
    return employee


async def employee_for_record(record: dict) -> dict:
    employee = await database.get_hrms_employee(record["employee_id"])
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    return employee


async def can_view_record(session: dict, employee: dict) -> bool:
    roles = set(session.get("roles", []))
    if roles & {"super_admin", "hr_admin", "hr_viewer", "payroll_admin", "finance"}:
        return True
    if "manager" in roles:
        return employee.get("user_id") == session["user_id"] or employee.get("manager_user_id") == session["user_id"] or employee.get("manager_employee_id") == session.get("employee_id")
    return employee.get("user_id") == session["user_id"]


def record_view(record: dict) -> dict:
    result = dict(record)
    result.pop("_id", None)
    return result


async def audit(session: dict, action: str, record_id: str, details: Dict[str, Any]):
    await database.create_hrms_audit_log({
        "id": str(uuid.uuid4()), "actor_user_id": session["user_id"], "action": action,
        "entity_type": "attendance", "entity_id": record_id, "details": details, "created_at": now_iso(),
    })


async def save_attendance(employee_id: str, attendance_date: str, updates: Dict[str, Any], session: dict, action: str) -> dict:
    existing = await database.get_hrms_attendance(employee_id, attendance_date)
    if existing and existing.get("approved_by") and not has_permission(session, "attendance.manage"):
        raise HTTPException(status_code=409, detail="Approved attendance records cannot be changed directly")
    data = {
        **(existing or {}), "id": existing.get("id", str(uuid.uuid4())) if existing else str(uuid.uuid4()),
        "employee_id": employee_id, "attendance_date": attendance_date, **updates,
        "updated_at": now_iso(), "created_at": (existing or {}).get("created_at", now_iso()),
    }
    data["total_working_hours"] = hours_between(data.get("check_in"), data.get("check_out"), int(data.get("break_duration_minutes", 0) or 0))
    try:
        saved = await database.upsert_hrms_attendance(data)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Attendance already exists for this employee and date")
    await audit(session, action, saved["id"], {"attendance_date": attendance_date, "fields": list(updates)})
    return saved


@attendance_router.get("")
async def list_attendance(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    employee_id: Optional[str] = None,
    department: Optional[str] = None,
    session: dict = Depends(require_hrms_permission("attendance.view")),
):
    roles = set(session.get("roles", []))
    if "employee" in roles and not roles & {"super_admin", "hr_admin", "manager", "hr_viewer", "payroll_admin", "finance"}:
        employee = await own_employee(session)
        employee_id = employee["id"]
    elif "manager" in roles and not roles & {"super_admin", "hr_admin", "hr_viewer", "payroll_admin", "finance"}:
        employee = await own_employee(session)
        session["employee_id"] = employee["id"]
    query: Dict[str, Any] = {}
    if employee_id:
        query["employee_id"] = employee_id
    if date_from or date_to:
        query["attendance_date"] = {key: value for key, value in (("$gte", date_from), ("$lte", date_to)) if value}
    records = await database.list_hrms_attendance(query)
    visible = []
    for record in records:
        employee = await employee_for_record(record)
        if department and employee.get("department") != department:
            continue
        if await can_view_record(session, employee):
            item = record_view(record)
            item["employee_name"] = f'{employee.get("first_name", "")} {employee.get("last_name", "")}'.strip()
            item["department"] = employee.get("department")
            visible.append(item)
    return {"success": True, "data": visible}


@attendance_router.get("/summary")
async def attendance_summary(date_from: Optional[str] = None, date_to: Optional[str] = None, session: dict = Depends(require_hrms_permission("attendance.view"))):
    records = (await list_attendance(date_from, date_to, None, None, session))["data"]
    summary = {state: 0 for state in ["PRESENT", "ABSENT", "HALF_DAY", "LATE", "EARLY_EXIT", "ON_LEAVE", "WFH", "HOLIDAY", "WEEKLY_OFF", "OVERTIME"]}
    total_hours = 0.0
    for record in records:
        summary[record.get("status", "PRESENT")] = summary.get(record.get("status", "PRESENT"), 0) + 1
        total_hours += record.get("total_working_hours", 0) or 0
    return {"success": True, "data": {"counts": summary, "total_hours": round(total_hours, 2), "days": len(records)}}


@attendance_router.post("/check-in")
async def check_in(payload: AttendanceCheckRequest, session: dict = Depends(require_hrms_permission("attendance.view"))):
    employee = await own_employee(session)
    attendance_date = (payload.occurred_at or now_iso())[:10]
    existing = await database.get_hrms_attendance(employee["id"], attendance_date)
    if existing and existing.get("check_in"):
        raise HTTPException(status_code=409, detail="You are already checked in for this date")
    return {"success": True, "data": await save_attendance(employee["id"], attendance_date, {"check_in": payload.occurred_at or now_iso(), "status": "PRESENT", "source": payload.source, "device_id": payload.device_id, "note": payload.note}, session, "check_in")}


@attendance_router.post("/check-out")
async def check_out(payload: AttendanceCheckRequest, session: dict = Depends(require_hrms_permission("attendance.view"))):
    employee = await own_employee(session)
    attendance_date = (payload.occurred_at or now_iso())[:10]
    existing = await database.get_hrms_attendance(employee["id"], attendance_date)
    if not existing or not existing.get("check_in"):
        raise HTTPException(status_code=400, detail="Check in before checking out")
    if existing.get("check_out"):
        raise HTTPException(status_code=409, detail="You are already checked out for this date")
    return {"success": True, "data": await save_attendance(employee["id"], attendance_date, {"check_out": payload.occurred_at or now_iso(), "source": payload.source, "device_id": payload.device_id}, session, "check_out")}


@attendance_router.put("/{attendance_id}")
async def manage_attendance(attendance_id: str, payload: AttendanceManualUpdate, session: dict = Depends(require_hrms_permission("attendance.manage"))):
    record = await database.db.hrms_attendance.find_one({"id": attendance_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    employee = await employee_for_record(record)
    if not await can_view_record(session, employee):
        raise HTTPException(status_code=403, detail="Attendance record is outside your scope")
    return {"success": True, "data": await save_attendance(record["employee_id"], record["attendance_date"], payload.model_dump(exclude_none=True), session, "managed_update")}


@attendance_router.post("/corrections")
async def request_correction(payload: AttendanceCorrectionCreate, session: dict = Depends(require_hrms_permission("attendance.regularize"))):
    employee = await own_employee(session)
    data = payload.model_dump(exclude_none=True)
    data.update({"id": str(uuid.uuid4()), "employee_id": employee["id"], "status": "pending", "created_at": now_iso(), "correction_history": []})
    created = await database.create_hrms_correction(data)
    await audit(session, "correction_requested", created["id"], {"attendance_date": payload.attendance_date})
    return {"success": True, "data": created}


@attendance_router.get("/corrections")
async def list_corrections(session: dict = Depends(require_hrms_permission("attendance.view"))):
    roles = set(session.get("roles", []))
    query = {} if roles & {"super_admin", "hr_admin"} else {"employee_id": (await own_employee(session))["id"]}
    return {"success": True, "data": await database.list_hrms_corrections(query)}


@attendance_router.post("/corrections/{correction_id}/decision")
async def decide_correction(correction_id: str, payload: AttendanceCorrectionDecision, session: dict = Depends(require_hrms_permission("attendance.approve"))):
    correction = await database.db.hrms_attendance_corrections.find_one({"id": correction_id}, {"_id": 0})
    if not correction or correction.get("status") != "pending":
        raise HTTPException(status_code=404, detail="Pending correction not found")
    employee = await employee_for_record({"employee_id": correction["employee_id"]})
    if "manager" in session.get("roles", []) and employee.get("manager_user_id") != session["user_id"]:
        raise HTTPException(status_code=403, detail="Correction is outside your team scope")
    timestamp = now_iso()
    update = {"status": payload.decision, "decided_by": session["user_id"], "decided_at": timestamp, "decision_comment": payload.comment}
    if payload.decision == "approved":
        attendance = await save_attendance(correction["employee_id"], correction["attendance_date"], {"check_in": correction.get("requested_check_in"), "check_out": correction.get("requested_check_out"), "status": correction.get("requested_status") or "PRESENT", "approved_by": session["user_id"], "source": "correction"}, session, "correction_approved")
        update["attendance_id"] = attendance["id"]
    decided = await database.update_hrms_correction(correction_id, update)
    await audit(session, f"correction_{payload.decision}", correction_id, {"employee_id": correction["employee_id"]})
    return {"success": True, "data": decided}


@attendance_router.get("/policies")
async def list_policies(session: dict = Depends(require_hrms_permission("attendance.view"))):
    return {"success": True, "data": await database.list_hrms_policies()}


@attendance_router.post("/policies")
async def create_policy(payload: AttendancePolicy, session: dict = Depends(require_hrms_permission("attendance.manage"))):
    policy_id = str(uuid.uuid4())
    data = payload.model_dump()
    data.update({"id": policy_id, "created_at": now_iso(), "updated_at": now_iso()})
    return {"success": True, "data": await database.upsert_hrms_policy(policy_id, data)}
