"""HRMS leave types, balances, applications, approvals, and holiday calendar APIs."""

import uuid
from datetime import date, datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from database import database
from hrms_rbac import has_permission, require_hrms_permission
from models import HolidayCreate, LeaveApplicationCreate, LeaveDecision, LeaveTypeCreate

leave_router = APIRouter(prefix="/api/hrms/leave", tags=["HRMS Leave"])


def now_iso():
    return datetime.utcnow().isoformat()


async def own_employee(session):
    employee = await database.db.hrms_employees.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="No HRMS employee profile is linked to this account")
    return employee


async def employee_for_application(application):
    employee = await database.get_hrms_employee(application["employee_id"])
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return employee


def requested_days(payload: LeaveApplicationCreate) -> float:
    try:
        start = date.fromisoformat(payload.start_date)
        end = date.fromisoformat(payload.end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Dates must use YYYY-MM-DD format")
    if end < start:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")
    if payload.duration == "hours":
        if not payload.hours:
            raise HTTPException(status_code=400, detail="Hours are required for hourly leave")
        return round(payload.hours / 8, 2)
    total = 0
    current = start
    while current <= end:
        if current.weekday() < 5:
            total += 0.5 if payload.duration == "half_day" else 1
        current += timedelta(days=1)
    if total <= 0:
        raise HTTPException(status_code=400, detail="Leave must include at least one working day")
    return total


async def audit(session, action, entity_id, details):
    await database.create_hrms_audit_log({"id": str(uuid.uuid4()), "actor_user_id": session["user_id"], "action": action, "entity_type": "leave", "entity_id": entity_id, "details": details, "created_at": now_iso()})


async def visible_application_query(session):
    roles = set(session.get("roles", []))
    if roles & {"super_admin", "hr_admin", "hr_viewer"}:
        return {}
    employee = await own_employee(session)
    if "manager" in roles:
        team = await database.list_hrms_employees({"$or": [{"manager_employee_id": employee["id"]}, {"manager_user_id": session["user_id"]}]}, "employee_code", 1, 0, 1000)
        return {"employee_id": {"$in": [employee["id"]] + [item["id"] for item in team]}}
    return {"employee_id": employee["id"]}


@leave_router.get("")
async def list_leave_applications(session: dict = Depends(require_hrms_permission("leave.view"))):
    applications = await database.list_hrms_leave_applications(await visible_application_query(session))
    return {"success": True, "data": applications}


@leave_router.get("/types")
async def list_leave_types(session: dict = Depends(require_hrms_permission("leave.view"))):
    return {"success": True, "data": await database.list_hrms_leave_types(active_only=True)}


@leave_router.post("/types")
async def create_leave_type(payload: LeaveTypeCreate, session: dict = Depends(require_hrms_permission("leave.manage"))):
    data = payload.model_dump()
    data.update({"created_at": now_iso(), "updated_at": now_iso()})
    try:
        saved = await database.upsert_hrms_leave_type(payload.code, data)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Leave type already exists")
    await audit(session, "leave_type_saved", payload.code, {"fields": list(data)})
    return {"success": True, "data": saved}


@leave_router.get("/balance")
async def leave_balance(session: dict = Depends(require_hrms_permission("leave.view"))):
    if set(session.get("roles", [])) & {"super_admin", "hr_admin", "hr_viewer"}:
        return {"success": True, "data": []}
    employee = await own_employee(session)
    balances = await database.list_hrms_leave_balances(employee["id"])
    return {"success": True, "data": balances}


@leave_router.get("/calendar")
async def leave_calendar(date_from: Optional[str] = None, date_to: Optional[str] = None, session: dict = Depends(require_hrms_permission("leave.view"))):
    query = await visible_application_query(session)
    applications = await database.list_hrms_leave_applications(query)
    holidays = await database.list_hrms_holidays(date_from, date_to)
    return {"success": True, "data": {"applications": applications, "holidays": holidays}}


@leave_router.post("/apply")
async def apply_leave(payload: LeaveApplicationCreate, session: dict = Depends(require_hrms_permission("leave.apply"))):
    employee = await own_employee(session)
    leave_type = await database.db.hrms_leave_types.find_one({"code": payload.leave_type, "is_active": True}, {"_id": 0})
    if not leave_type:
        raise HTTPException(status_code=400, detail="Leave type is not configured")
    if payload.duration == "half_day" and not leave_type.get("allow_half_day", False):
        raise HTTPException(status_code=400, detail="Half-day leave is not allowed for this leave type")
    if payload.duration == "hours" and not leave_type.get("allow_hourly", False):
        raise HTTPException(status_code=400, detail="Hourly leave is not allowed for this leave type")
    days = requested_days(payload)
    await database.db.hrms_leave_balances.update_one(
        {"employee_id": employee["id"], "leave_type": payload.leave_type},
        {"$setOnInsert": {"employee_id": employee["id"], "leave_type": payload.leave_type, "entitled": leave_type.get("annual_entitlement", 0), "available": leave_type.get("annual_entitlement", 0), "used": 0, "reserved": 0, "carried_forward": 0, "allow_overdraft": payload.leave_type == "UNPAID"}},
        upsert=True,
    )
    overlap = await database.list_hrms_leave_applications({"employee_id": employee["id"], "status": {"$in": ["pending_manager", "pending_hr", "approved"]}})
    if any(item["start_date"] <= payload.end_date and item["end_date"] >= payload.start_date for item in overlap):
        raise HTTPException(status_code=409, detail="Leave overlaps an existing pending or approved application")
    application = payload.model_dump()
    application.update({"id": str(uuid.uuid4()), "employee_id": employee["id"], "days": days, "status": "pending_manager", "created_at": now_iso(), "updated_at": now_iso(), "approval_history": []})
    try:
        created = await database.create_leave_application_transaction(application, {"employee_id": employee["id"], "leave_type": payload.leave_type}, days)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    await audit(session, "leave_applied", created["id"], {"days": days, "leave_type": payload.leave_type})
    return {"success": True, "data": created}


@leave_router.post("/balances/accrue")
async def accrue_leave_balances(session: dict = Depends(require_hrms_permission("leave.manage"))):
    """Apply the configured monthly accrual to employees without changing used history."""
    leave_types = await database.list_hrms_leave_types(active_only=True)
    employees = await database.list_hrms_employees({"employment_status": "active"}, "employee_code", 1, 0, 10000)
    updated = 0
    for leave_type in leave_types:
        frequency = leave_type.get("accrual_frequency")
        if frequency == "none":
            continue
        periods = {"monthly": 12, "quarterly": 4, "yearly": 1}.get(frequency, 1)
        amount = leave_type.get("annual_entitlement", 0) / periods
        for employee in employees:
            await database.db.hrms_leave_balances.update_one(
                {"employee_id": employee["id"], "leave_type": leave_type["code"]},
                {"$inc": {"entitled": amount, "available": amount}, "$setOnInsert": {"used": 0, "reserved": 0, "carried_forward": 0, "employee_id": employee["id"], "leave_type": leave_type["code"]}},
                upsert=True,
            )
            updated += 1
    await audit(session, "leave_balances_accrued", "period", {"updated": updated})
    return {"success": True, "updated": updated}


@leave_router.post("/{application_id}/decision")
async def decide_leave(application_id: str, payload: LeaveDecision, session: dict = Depends(require_hrms_permission("leave.approve"))):
    application = await database.get_hrms_leave_application(application_id)
    if not application or application.get("status") not in ["pending_manager", "pending_hr"]:
        raise HTTPException(status_code=404, detail="Pending leave application not found")
    employee = await employee_for_application(application)
    roles = set(session.get("roles", []))
    if "hr_admin" in roles or "super_admin" in roles:
        pass
    elif "manager" in roles and (employee.get("manager_user_id") == session["user_id"] or employee.get("manager_employee_id") == (await own_employee(session))["id"]):
        if application["status"] == "pending_hr":
            raise HTTPException(status_code=403, detail="HR approval is required for this leave")
    else:
        raise HTTPException(status_code=403, detail="Leave application is outside your approval authority")
    if payload.decision == "approved" and application["status"] == "pending_manager":
        leave_type = await database.db.hrms_leave_types.find_one({"code": application["leave_type"]}, {"_id": 0})
        if leave_type and leave_type.get("requires_hr_approval") and "hr_admin" not in roles and "super_admin" not in roles:
            updated = await database.decide_leave_transaction(application, {"status": "pending_hr", "manager_approved_by": session["user_id"], "updated_at": now_iso()}, False)
        else:
            updated = await database.decide_leave_transaction(application, {"status": "approved", "approved_by": session["user_id"], "updated_at": now_iso()}, False, True)
    elif payload.decision == "rejected":
        updated = await database.decide_leave_transaction(application, {"status": "rejected", "rejected_by": session["user_id"], "decision_comment": payload.comment, "updated_at": now_iso()}, True)
    else:
        updated = await database.decide_leave_transaction(application, {"status": "approved", "approved_by": session["user_id"], "updated_at": now_iso()}, False, True)
    await audit(session, f"leave_{payload.decision}", application_id, {"comment": payload.comment})
    return {"success": True, "data": updated}


@leave_router.post("/{application_id}/cancel")
async def cancel_leave(application_id: str, session: dict = Depends(require_hrms_permission("leave.cancel"))):
    application = await database.get_hrms_leave_application(application_id)
    employee = await own_employee(session)
    if not application or application["employee_id"] != employee["id"]:
        raise HTTPException(status_code=404, detail="Leave application not found")
    if application["status"] not in ["pending_manager", "pending_hr", "approved"]:
        raise HTTPException(status_code=409, detail="Only pending or approved leave can be cancelled")
    updated = await database.decide_leave_transaction(application, {"status": "cancelled", "cancelled_by": session["user_id"], "updated_at": now_iso()}, True)
    await audit(session, "leave_cancelled", application_id, {})
    return {"success": True, "data": updated}


@leave_router.get("/holidays")
async def holidays(date_from: Optional[str] = None, date_to: Optional[str] = None, session: dict = Depends(require_hrms_permission("leave.view"))):
    return {"success": True, "data": await database.list_hrms_holidays(date_from, date_to)}


@leave_router.post("/holidays")
async def create_holiday(payload: HolidayCreate, session: dict = Depends(require_hrms_permission("leave.manage"))):
    data = payload.model_dump()
    data.update({"id": str(uuid.uuid4()), "created_at": now_iso()})
    await database.db.hrms_holidays.insert_one(data)
    await audit(session, "holiday_created", data["id"], {"holiday_date": payload.holiday_date})
    return {"success": True, "data": data}
