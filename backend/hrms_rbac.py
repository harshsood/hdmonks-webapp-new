"""Central HRMS roles, permissions, and reusable authorization helpers."""

from typing import Iterable

from fastapi import Depends, HTTPException


PERMISSION_DESCRIPTIONS = {
    "hrms.access": "Access the HRMS application",
    "employees.view": "View employee records",
    "employees.create": "Create employee records",
    "employees.update": "Update employee records",
    "employees.delete": "Delete employee records",
    "employees.export": "Export employee records",
    "departments.view": "View departments",
    "departments.manage": "Manage departments",
    "attendance.view": "View attendance",
    "attendance.manage": "Manage attendance",
    "attendance.regularize": "Regularize attendance",
    "attendance.approve": "Approve attendance changes",
    "leave.view": "View leave records",
    "leave.apply": "Apply for leave",
    "leave.cancel": "Cancel leave requests",
    "leave.approve": "Approve leave requests",
    "payroll.view": "View payroll records",
    "payroll.create": "Create payroll runs",
    "payroll.calculate": "Calculate payroll",
    "payroll.process": "Process payroll",
    "payroll.approve": "Approve payroll",
    "payroll.export": "Export payroll data",
    "salary.view": "View salary information",
    "salary.create": "Create salary structures",
    "salary.update": "Update salary structures",
    "payslip.view": "View payslips",
    "payslip.generate": "Generate payslips",
    "payslip.download": "Download payslips",
    "expenses.view": "View expenses",
    "expenses.create": "Create expenses",
    "expenses.approve": "Approve expenses",
    "performance.view": "View performance records",
    "performance.manage": "Manage performance records",
    "performance.review": "Review performance records",
    "recruitment.view": "View recruitment records",
    "recruitment.manage": "Manage recruitment records",
    "onboarding.view": "View onboarding records",
    "onboarding.manage": "Manage onboarding records",
    "training.view": "View training records",
    "training.manage": "Manage training records",
    "assets.view": "View assigned assets",
    "assets.manage": "Manage assets",
    "documents.view": "View HR documents",
    "documents.upload": "Upload HR documents",
    "documents.manage": "Manage HR documents",
    "helpdesk.view": "View HR helpdesk tickets",
    "helpdesk.create": "Create HR helpdesk tickets",
    "helpdesk.assign": "Assign HR helpdesk tickets",
    "helpdesk.resolve": "Resolve HR helpdesk tickets",
    "reports.view": "View HR reports",
    "reports.export": "Export HR reports",
    "analytics.view": "View HR analytics",
    "settings.view": "View HRMS settings",
    "settings.manage": "Manage HRMS settings and access",
    "audit_logs.view": "View HRMS audit logs",
}

ALL_PERMISSIONS = frozenset(PERMISSION_DESCRIPTIONS)


def _permissions(*keys: str) -> list[str]:
    return list(keys)


ROLE_DEFINITIONS = {
    "super_admin": {
        "name": "Super Admin",
        "description": "Complete HRMS access",
        "permissions": sorted(ALL_PERMISSIONS),
        "system": True,
    },
    "hr_admin": {
        "name": "HR Admin",
        "description": "Manage employee HR operations without payroll salary administration",
        "permissions": _permissions(
            "hrms.access", "employees.view", "employees.create", "employees.update", "employees.delete", "employees.export",
            "departments.view", "departments.manage", "attendance.view", "attendance.manage", "attendance.regularize", "attendance.approve",
            "leave.view", "leave.apply", "leave.cancel", "leave.approve", "performance.view", "performance.manage", "performance.review",
            "recruitment.view", "recruitment.manage", "onboarding.view", "onboarding.manage", "training.view", "training.manage",
            "assets.view", "assets.manage", "documents.view", "documents.upload", "documents.manage", "helpdesk.view", "helpdesk.create",
            "helpdesk.assign", "helpdesk.resolve", "reports.view", "reports.export", "analytics.view", "settings.view", "audit_logs.view",
        ),
        "system": True,
    },
    "payroll_admin": {
        "name": "Payroll Admin",
        "description": "Manage payroll and salary operations",
        "permissions": _permissions(
            "hrms.access", "employees.view", "departments.view", "attendance.view", "leave.view", "payroll.view", "payroll.create",
            "payroll.calculate", "payroll.process", "payroll.approve", "payroll.export", "salary.view", "salary.create", "salary.update",
            "payslip.view", "payslip.generate", "payslip.download", "expenses.view", "expenses.create", "expenses.approve",
            "reports.view", "reports.export", "settings.view", "audit_logs.view",
        ),
        "system": True,
    },
    "finance": {
        "name": "Finance",
        "description": "View and approve financial payroll information",
        "permissions": _permissions(
            "hrms.access", "employees.view", "departments.view", "payroll.view", "payroll.export", "payroll.approve", "salary.view",
            "payslip.view", "payslip.download", "expenses.view", "expenses.approve", "reports.view", "reports.export", "settings.view",
        ),
        "system": True,
    },
    "manager": {
        "name": "Manager",
        "description": "Manage assigned team workflows",
        "permissions": _permissions(
            "hrms.access", "employees.view", "departments.view", "attendance.view", "attendance.approve", "leave.view", "leave.approve",
            "performance.view", "performance.review", "training.view", "assets.view", "documents.view", "helpdesk.view", "helpdesk.create",
            "reports.view",
        ),
        "system": True,
    },
    "employee": {
        "name": "Employee",
        "description": "Access personal HRMS records and self-service workflows",
        "permissions": _permissions(
            "hrms.access", "employees.view", "attendance.view", "attendance.manage", "leave.view", "leave.apply", "leave.cancel",
            "payslip.view", "payslip.download", "expenses.view", "expenses.create", "performance.view", "performance.review",
            "documents.view", "documents.upload", "helpdesk.view", "helpdesk.create", "assets.view",
        ),
        "system": True,
    },
    "recruiter": {
        "name": "Recruiter",
        "description": "Manage recruitment and onboarding workflows",
        "permissions": _permissions(
            "hrms.access", "employees.view", "employees.create", "employees.update", "departments.view", "recruitment.view",
            "recruitment.manage", "onboarding.view", "onboarding.manage", "documents.view", "documents.upload", "reports.view",
        ),
        "system": True,
    },
    "hr_viewer": {
        "name": "HR Viewer",
        "description": "Read-only HR operational access",
        "permissions": _permissions(
            "hrms.access", "employees.view", "departments.view", "attendance.view", "leave.view", "performance.view", "training.view",
            "assets.view", "documents.view", "helpdesk.view", "reports.view", "analytics.view", "audit_logs.view",
        ),
        "system": True,
    },
}


def has_permission(authorization: dict, permission: str) -> bool:
    return permission in authorization.get("permissions", [])


def require_hrms_permission(permission: str):
    """Return a FastAPI dependency enforcing one effective HRMS permission."""
    from user_routes import verify_hrms_token

    async def dependency(session: dict = Depends(verify_hrms_token)):
        if not has_permission(session, permission):
            raise HTTPException(status_code=403, detail=f"Missing HRMS permission: {permission}")
        return session

    return dependency


def can_access_employee(authorization: dict, employee: dict, sensitive: bool = False) -> bool:
    """Apply reusable record-level HRMS scope rules after permission checks."""
    permissions = authorization.get("permissions", [])
    roles = authorization.get("roles", [])
    user_id = authorization.get("user_id")

    if "super_admin" in roles or (sensitive and ("salary.view" in permissions or "payroll.view" in permissions)):
        return True
    if {"hr_admin", "hr_viewer", "recruiter"} & set(roles) and not sensitive:
        return True
    if "manager" in roles:
        return (
            employee.get("user_id") == user_id
            or employee.get("manager_user_id") == user_id
            or user_id in employee.get("manager_user_ids", [])
        )
    return employee.get("user_id") == user_id
