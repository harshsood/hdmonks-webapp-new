"""Provision isolated HRMS test users for manual QA.

Usage from the backend directory:
    HRMS_TEST_PASSWORD='use-a-temporary-password' python scripts/provision_hrms_test_users.py

The script is intentionally opt-in and never contains a default password.
"""

import asyncio
import os
import sys
import uuid
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(path):
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

load_dotenv(REPO_ROOT / ".env")

from database import database
from hrms_rbac import ROLE_DEFINITIONS
from user_auth import hash_password


TEST_USERS = [
    ("Super Admin", "super_admin"),
    ("HR Admin", "hr_admin"),
    ("Payroll Admin", "payroll_admin"),
    ("Finance", "finance"),
    ("Manager", "manager"),
    ("Employee", "employee"),
    ("Recruiter", "recruiter"),
    ("HR Viewer", "hr_viewer"),
]


async def provision() -> None:
    password = os.environ.get("HRMS_TEST_PASSWORD")
    if not password or len(password) < 8:
        raise RuntimeError("Set HRMS_TEST_PASSWORD to a temporary password of at least 8 characters")

    await database.connect()
    try:
        await database.ensure_hrms_rbac_catalog()
        for display_name, role_key in TEST_USERS:
            username = role_key.replace("_", ".")
            email = f"hrms.{role_key}@hdmonks.test"
            user = await database.get_user_by_email(email)
            if not user:
                user = await database.create_user({
                    "id": str(uuid.uuid4()),
                    "full_name": f"Test {display_name}",
                    "email": email,
                    "username": username,
                    "password_hash": hash_password(password),
                    "permissions": [],
                })
                user = await database.get_user_by_email(email)
                print(f"Created {display_name}: {email} / username {username}")
            else:
                print(f"Existing {display_name}: {email} / username {username}")
                await database.db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"password_hash": hash_password(password), "username": username}},
                )
            if not await database.assign_hrms_roles(user["id"], [role_key]):
                raise RuntimeError(f"Unable to assign role {role_key} to {email}")
        print("HRMS test users are ready. Use the temporary password supplied in HRMS_TEST_PASSWORD.")
    finally:
        await database.close()


if __name__ == "__main__":
    asyncio.run(provision())