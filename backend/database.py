from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import uuid

logger = logging.getLogger(__name__)


class Database:
    def __init__(self):
        self.client = None
        self.db = None
    
    async def connect(self):
        """Initialize database connection"""
        try:
            mongo_url = os.environ.get('MONGO_URL', 'mongodb+srv://hdmonks_admin:hdmonks123@cluster0.quq6eah.mongodb.net/hdmonks?retryWrites=true&w=majority')
            db_name = os.environ.get('DB_NAME', 'hdmonks')
            
            self.client = AsyncIOMotorClient(mongo_url)
            self.db = self.client[db_name]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info("Connected to MongoDB successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    async def close(self):
        """Close database connection"""
        if self.client is not None:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    # Helper method to serialize datetime
    def _serialize_datetime(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert datetime objects to ISO format strings"""
        if isinstance(data, dict):
            return {k: self._serialize_datetime(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._serialize_datetime(item) for item in data]
        elif isinstance(data, datetime):
            return data.isoformat()
        return data
    
    def _sanitize_service(self, service: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure service has required fields with valid data"""
        # Generate id if missing
        if not service.get('id'):
            service['id'] = service.get('service_id', str(uuid.uuid4()))
        # Ensure service_id exists
        if not service.get('service_id'):
            service['service_id'] = str(uuid.uuid4())
        # Ensure relevant_for is a valid list with default if empty
        if not isinstance(service.get('relevant_for'), list) or len(service.get('relevant_for', [])) == 0:
            service['relevant_for'] = ['startup', 'msme']
        return service
    
    def _sanitize_stage(self, stage: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure all services in stage have required fields"""
        if 'services' in stage and isinstance(stage['services'], list):
            stage['services'] = [self._sanitize_service(s) for s in stage['services']]
        return stage
    
    # ===== STAGE OPERATIONS =====
    
    async def get_all_stages(self) -> List[Dict[str, Any]]:
        """Get all stages with their services"""
        if self.db is None:
            await self.connect()
        
        cursor = self.db.stages.find({}, {"_id": 0}).sort("id", 1)
        stages = await cursor.to_list(length=None)
        
        # Sanitize all stages to ensure services have required fields
        stages = [self._sanitize_stage(stage) for stage in stages]
        
        return stages
    
    async def get_stage_by_id(self, stage_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific stage by ID"""
        if self.db is None:
            await self.connect()
        
        stage = await self.db.stages.find_one({"id": stage_id}, {"_id": 0})
        
        # Sanitize stage to ensure services have required fields
        if stage:
            stage = self._sanitize_stage(stage)
        
        return stage
    
    async def create_stage(self, stage_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new stage"""
        if self.db is None:
            await self.connect()
        
        # Convert datetime objects to ISO strings for MongoDB
        stage_data = self._serialize_datetime(stage_data)
        
        await self.db.stages.insert_one(stage_data)
        return stage_data
    
    async def update_stage(self, stage_id: int, update_data: Dict[str, Any]) -> bool:
        """Update a stage"""
        if self.db is None:
            await self.connect()
        
        update_data = self._serialize_datetime(update_data)
        
        result = await self.db.stages.update_one(
            {"id": stage_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def delete_stage(self, stage_id: int) -> bool:
        """Delete a stage"""
        if self.db is None:
            await self.connect()
        
        result = await self.db.stages.delete_one({"id": stage_id})
        return result.deleted_count > 0
    
    # ===== SERVICE OPERATIONS =====
    
    async def get_service_by_service_id(self, service_id: str) -> Optional[Dict[str, Any]]:
        """Get a service by service_id across all stages"""
        if self.db is None:
            await self.connect()
        
        stage = await self.db.stages.find_one(
            {"services.service_id": service_id},
            {"_id": 0, "services.$": 1}
        )
        
        if stage and "services" in stage and len(stage["services"]) > 0:
            service = stage["services"][0]
            # Sanitize to ensure required fields
            return self._sanitize_service(service)
        return None
    
    async def add_service_to_stage(self, stage_id: int, service_data: Dict[str, Any]) -> bool:
        """Add a service to a stage"""
        if self.db is None:
            await self.connect()
        
        service_data = self._serialize_datetime(service_data)
        
        result = await self.db.stages.update_one(
            {"id": stage_id},
            {"$push": {"services": service_data}}
        )
        return result.modified_count > 0
    
    async def update_service_in_stage(self, stage_id: int, service_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a service within a stage"""
        if self.db is None:
            await self.connect()
        
        update_data = self._serialize_datetime(update_data)
        
        # Create update query for nested service
        update_query = {}
        for key, value in update_data.items():
            update_query[f"services.$.{key}"] = value
        
        result = await self.db.stages.update_one(
            {"id": stage_id, "services.service_id": service_id},
            {"$set": update_query}
        )
        return result.modified_count > 0
    
    async def delete_service_from_stage(self, stage_id: int, service_id: str) -> bool:
        """Delete a service from a stage"""
        if self.db is None:
            await self.connect()
        
        result = await self.db.stages.update_one(
            {"id": stage_id},
            {"$pull": {"services": {"service_id": service_id}}}
        )
        return result.modified_count > 0
    
    # ===== CONTACT INQUIRY OPERATIONS =====
    
    async def create_contact_inquiry(self, inquiry_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new contact inquiry"""
        if self.db is None:
            await self.connect()
        
        inquiry_data = self._serialize_datetime(inquiry_data)
        
        await self.db.contact_inquiries.insert_one(inquiry_data)
        return inquiry_data
    
    async def get_all_inquiries(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all contact inquiries"""
        if self.db is None:
            await self.connect()
        
        cursor = self.db.contact_inquiries.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
        inquiries = await cursor.to_list(length=None)
        return inquiries
    
    async def update_inquiry_status(self, inquiry_id: str, status: str) -> bool:
        """Update inquiry status"""
        if self.db is None:
            await self.connect()
        
        result = await self.db.contact_inquiries.update_one(
            {"id": inquiry_id},
            {"$set": {"status": status, "updated_at": datetime.utcnow().isoformat()}}
        )
        return result.modified_count > 0
    
    # ===== TIME SLOT OPERATIONS =====
    
    async def get_available_timeslots(self, date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get available time slots"""
        if self.db is None:
            await self.connect()
        
        query = {"is_available": True}
        if date:
            query["date"] = date
        
        cursor = self.db.timeslots.find(query, {"_id": 0}).sort([("date", 1), ("time", 1)])
        timeslots = await cursor.to_list(length=None)
        return timeslots
    
    async def get_timeslot_by_id(self, timeslot_id: str) -> Optional[Dict[str, Any]]:
        """Get a timeslot by ID"""
        if self.db is None:
            await self.connect()
        
        timeslot = await self.db.timeslots.find_one({"id": timeslot_id}, {"_id": 0})
        return timeslot
    
    async def create_timeslot(self, timeslot_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new time slot"""
        if self.db is None:
            await self.connect()
        
        timeslot_data = self._serialize_datetime(timeslot_data)
        
        await self.db.timeslots.insert_one(timeslot_data)
        return timeslot_data
    
    async def mark_timeslot_unavailable(self, timeslot_id: str) -> bool:
        """Mark a timeslot as unavailable"""
        if self.db is None:
            await self.connect()
        
        result = await self.db.timeslots.update_one(
            {"id": timeslot_id},
            {"$set": {"is_available": False}}
        )
        return result.modified_count > 0
    
    async def delete_timeslot(self, timeslot_id: str) -> bool:
        """Delete a time slot"""
        if self.db is None:
            await self.connect()
        
        result = await self.db.timeslots.delete_one({"id": timeslot_id})
        return result.deleted_count > 0
    
    async def update_timeslot(self, timeslot_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a time slot"""
        if self.db is None:
            await self.connect()
        
        update_data = self._serialize_datetime(update_data)
        
        result = await self.db.timeslots.update_one(
            {"id": timeslot_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    # ===== BOOKING OPERATIONS =====
    
    async def create_booking(self, booking_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new consultation booking"""
        if self.db is None:
            await self.connect()
        
        booking_data = self._serialize_datetime(booking_data)
        
        await self.db.bookings.insert_one(booking_data)
        return booking_data
    
    async def get_all_bookings(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all consultation bookings"""
        if self.db is None:
            await self.connect()
        
        cursor = self.db.bookings.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
        bookings = await cursor.to_list(length=None)
        return bookings
    
    async def update_booking_status(self, booking_id: str, status: str) -> bool:
        """Update booking status"""
        result = await self.db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"status": status}}
        )
        return result.modified_count > 0

    # ===== ADMIN =====
    async def get_admin_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get admin by username"""
       # return await self.db.admins.find_one({"username": username})
        return await self.db.admins.find_one({"username": username}, {"_id": 0})
    
    async def create_admin(self, admin_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create admin user"""
        result = await self.db.admins.insert_one(admin_data)
        admin_data['_id'] = str(result.inserted_id)
        return admin_data

    # ===== USERS =====
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get a user by normalized email address"""
        if self.db is None:
            await self.connect()
        return await self.db.users.find_one({"email": email.lower()}, {"_id": 0})

    async def get_user_by_identifier(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Get a user by email or an optional legacy username field."""
        if self.db is None:
            await self.connect()
        normalized_identifier = identifier.strip().lower()
        return await self.db.users.find_one(
            {"$or": [{"email": normalized_identifier}, {"username": normalized_identifier}]},
            {"_id": 0},
        )

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by stable application user ID."""
        if self.db is None:
            await self.connect()
        return await self.db.users.find_one({"id": user_id}, {"_id": 0})

    async def update_user_permissions(self, user_id: str, permissions: List[str]) -> bool:
        """Replace the explicit permissions assigned to an application user."""
        if self.db is None:
            await self.connect()
        result = await self.db.users.update_one(
            {"id": user_id},
            {"$set": {"permissions": sorted(set(permissions))}},
        )
        return result.matched_count > 0

    async def ensure_hrms_rbac_catalog(self) -> None:
        """Create or refresh the built-in HRMS roles and permissions idempotently."""
        from hrms_rbac import PERMISSION_DESCRIPTIONS, ROLE_DEFINITIONS

        if self.db is None:
            await self.connect()

        for key, description in PERMISSION_DESCRIPTIONS.items():
            module, action = key.split(".", 1)
            await self.db.hrms_permissions.update_one(
                {"key": key},
                {"$set": {"key": key, "module": module, "action": action, "description": description}},
                upsert=True,
            )

        for key, definition in ROLE_DEFINITIONS.items():
            await self.db.hrms_roles.update_one(
                {"key": key},
                {"$set": {"key": key, **definition}},
                upsert=True,
            )
            await self.db.hrms_role_permissions.update_one(
                {"role_key": key},
                {"$set": {"role_key": key, "permission_keys": definition["permissions"]}},
                upsert=True,
            )
            await self.db.hrms_employees.create_index("employee_code", unique=True)
            await self.db.hrms_employees.create_index("user_id", unique=True, sparse=True)
            await self.db.hrms_employees.create_index([("employment_status", 1), ("department", 1), ("location", 1)])
            await self.db.hrms_employee_documents.create_index([("employee_id", 1), ("created_at", -1)])
            await self.db.hrms_employee_activity.create_index([("employee_id", 1), ("created_at", -1)])
            await self.db.hrms_audit_logs.create_index([("entity_type", 1), ("entity_id", 1), ("created_at", -1)])
            await self.db.hrms_attendance.create_index([("employee_id", 1), ("attendance_date", 1)], unique=True)
            await self.db.hrms_attendance_corrections.create_index([("employee_id", 1), ("status", 1), ("created_at", -1)])
            await self.db.hrms_attendance_policies.create_index("name", unique=True)
            await self.db.hrms_leave_types.create_index("code", unique=True)
            await self.db.hrms_leave_applications.create_index([("employee_id", 1), ("start_date", 1), ("end_date", 1)])
            await self.db.hrms_leave_balances.create_index([("employee_id", 1), ("leave_type", 1)], unique=True)
            await self.db.hrms_leave_transactions.create_index([("employee_id", 1), ("created_at", -1)])
            await self.db.hrms_holidays.create_index("holiday_date")
            await self.db.hrms_salary_templates.create_index("name", unique=True)
            await self.db.hrms_salary_assignments.create_index([("employee_id", 1), ("effective_date", -1)])

    async def get_user_hrms_authorization(self, user_id: str) -> Dict[str, Any]:
        """Resolve direct compatibility permissions plus mapped HRMS role permissions."""
        if self.db is None:
            await self.connect()
        await self.ensure_hrms_rbac_catalog()

        user = await self.get_user_by_id(user_id)
        if not user:
            return {"roles": [], "permissions": []}

        mapping = await self.db.hrms_user_roles.find_one({"user_id": user_id}, {"_id": 0})
        role_keys = mapping.get("role_keys", []) if mapping else []
        roles = await self.db.hrms_roles.find({"key": {"$in": role_keys}}, {"_id": 0}).to_list(length=None)
        role_permissions = await self.db.hrms_role_permissions.find(
            {"role_key": {"$in": role_keys}}, {"_id": 0}
        ).to_list(length=None)

        permissions = set(permission for permission in user.get("permissions", []) if permission.startswith(("hrms.", "employees.", "departments.", "attendance.", "leave.", "payroll.", "salary.", "payslip.", "expenses.", "performance.", "recruitment.", "onboarding.", "training.", "assets.", "documents.", "helpdesk.", "reports.", "analytics.", "settings.", "audit_logs.")))
        for role in role_permissions:
            permissions.update(role.get("permission_keys", []))

        return {"roles": sorted(role_keys), "permissions": sorted(permissions)}

    async def list_hrms_users(self, search: Optional[str] = None) -> List[Dict[str, Any]]:
        """List non-sensitive user fields for the HRMS access-management screen."""
        if self.db is None:
            await self.connect()
        query = {}
        if search:
            query = {"$or": [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
            ]}
        return await self.db.users.find(
            query,
            {"_id": 0, "id": 1, "full_name": 1, "email": 1, "created_at": 1},
        ).sort("full_name", 1).to_list(length=500)

    async def get_hrms_roles(self) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        await self.ensure_hrms_rbac_catalog()
        roles = await self.db.hrms_roles.find({}, {"_id": 0}).sort("name", 1).to_list(length=None)
        mappings = await self.db.hrms_role_permissions.find({}, {"_id": 0}).to_list(length=None)
        permissions_by_role = {mapping["role_key"]: mapping.get("permission_keys", []) for mapping in mappings}
        for role in roles:
            role["permissions"] = permissions_by_role.get(role["key"], [])
        return roles

    async def assign_hrms_roles(self, user_id: str, role_keys: List[str]) -> bool:
        if self.db is None:
            await self.connect()
        await self.ensure_hrms_rbac_catalog()
        valid_roles = await self.db.hrms_roles.count_documents({"key": {"$in": role_keys}})
        if valid_roles != len(set(role_keys)):
            return False
        result = await self.db.hrms_user_roles.update_one(
            {"user_id": user_id},
            {"$set": {"user_id": user_id, "role_keys": sorted(set(role_keys))}},
            upsert=True,
        )
        return result.matched_count > 0 or result.upserted_id is not None

    # ===== HRMS EMPLOYEES =====
    async def create_hrms_employee(self, employee_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        employee_data = self._serialize_datetime(employee_data)
        await self.db.hrms_employees.insert_one(employee_data)
        return await self.db.hrms_employees.find_one({"id": employee_data["id"]}, {"_id": 0})

    async def get_hrms_employee(self, employee_id: str) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_employees.find_one({"id": employee_id}, {"_id": 0})

    async def list_hrms_employees(self, query: Dict[str, Any], sort_by: str, sort_order: int, skip: int, limit: int) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        allowed_sort_fields = {"employee_code", "first_name", "last_name", "date_of_joining", "department", "designation", "location", "employment_status", "created_at"}
        sort_field = sort_by if sort_by in allowed_sort_fields else "created_at"
        cursor = self.db.hrms_employees.find(query, {"_id": 0}).sort(sort_field, sort_order).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count_hrms_employees(self, query: Dict[str, Any]) -> int:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_employees.count_documents(query)

    async def get_hrms_employee_filter_options(self, query: Dict[str, Any]) -> Dict[str, List[str]]:
        if self.db is None:
            await self.connect()
        return {
            "departments": sorted(value for value in await self.db.hrms_employees.distinct("department", query) if value),
            "designations": sorted(value for value in await self.db.hrms_employees.distinct("designation", query) if value),
            "locations": sorted(value for value in await self.db.hrms_employees.distinct("location", query) if value),
        }

    async def update_hrms_employee(self, employee_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        update_data = self._serialize_datetime(update_data)
        await self.db.hrms_employees.update_one({"id": employee_id}, {"$set": update_data})
        return await self.get_hrms_employee(employee_id)

    async def create_hrms_document(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        document_data = self._serialize_datetime(document_data)
        await self.db.hrms_employee_documents.insert_one(document_data)
        return {key: value for key, value in document_data.items() if key != "file_data"}

    async def list_hrms_documents(self, employee_id: str) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_employee_documents.find(
            {"employee_id": employee_id}, {"_id": 0, "file_data": 0}
        ).sort("created_at", -1).to_list(length=200)

    async def create_hrms_activity(self, activity_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        activity_data = self._serialize_datetime(activity_data)
        await self.db.hrms_employee_activity.insert_one(activity_data)
        return activity_data

    async def list_hrms_activity(self, employee_id: str) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_employee_activity.find(
            {"employee_id": employee_id}, {"_id": 0}
        ).sort("created_at", -1).to_list(length=500)

    async def create_hrms_audit_log(self, audit_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        audit_data = self._serialize_datetime(audit_data)
        await self.db.hrms_audit_logs.insert_one(audit_data)
        return audit_data

    # ===== HRMS ATTENDANCE =====
    async def get_hrms_attendance(self, employee_id: str, attendance_date: str) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_attendance.find_one({"employee_id": employee_id, "attendance_date": attendance_date}, {"_id": 0})

    async def upsert_hrms_attendance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        query = {"employee_id": data["employee_id"], "attendance_date": data["attendance_date"]}
        await self.db.hrms_attendance.update_one(query, {"$set": self._serialize_datetime(data)}, upsert=True)
        return await self.db.hrms_attendance.find_one(query, {"_id": 0})

    async def list_hrms_attendance(self, query: Dict[str, Any], skip: int = 0, limit: int = 1000) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_attendance.find(query, {"_id": 0}).sort("attendance_date", -1).skip(skip).limit(limit).to_list(length=limit)

    async def create_hrms_correction(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        await self.db.hrms_attendance_corrections.insert_one(self._serialize_datetime(data))
        return await self.db.hrms_attendance_corrections.find_one({"id": data["id"]}, {"_id": 0})

    async def list_hrms_corrections(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_attendance_corrections.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=1000)

    async def update_hrms_correction(self, correction_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        await self.db.hrms_attendance_corrections.update_one({"id": correction_id}, {"$set": self._serialize_datetime(data)})
        return await self.db.hrms_attendance_corrections.find_one({"id": correction_id}, {"_id": 0})

    async def list_hrms_policies(self) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_attendance_policies.find({}, {"_id": 0}).sort("name", 1).to_list(length=100)

    async def upsert_hrms_policy(self, policy_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        await self.db.hrms_attendance_policies.update_one({"id": policy_id}, {"$set": self._serialize_datetime(data)}, upsert=True)
        return await self.db.hrms_attendance_policies.find_one({"id": policy_id}, {"_id": 0})

    # ===== HRMS LEAVE =====
    async def list_hrms_leave_types(self, active_only: bool = False) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        query = {"is_active": True} if active_only else {}
        return await self.db.hrms_leave_types.find(query, {"_id": 0}).sort("name", 1).to_list(length=100)

    async def upsert_hrms_leave_type(self, code: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        await self.db.hrms_leave_types.update_one({"code": code}, {"$set": self._serialize_datetime(data)}, upsert=True)
        return await self.db.hrms_leave_types.find_one({"code": code}, {"_id": 0})

    async def get_hrms_leave_balance(self, employee_id: str, leave_type: str) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_leave_balances.find_one({"employee_id": employee_id, "leave_type": leave_type}, {"_id": 0})

    async def list_hrms_leave_balances(self, employee_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        query = {"employee_id": employee_id} if employee_id else {}
        return await self.db.hrms_leave_balances.find(query, {"_id": 0}).sort("leave_type", 1).to_list(length=500)

    async def list_hrms_leave_applications(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_leave_applications.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=1000)

    async def get_hrms_leave_application(self, application_id: str) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_leave_applications.find_one({"id": application_id}, {"_id": 0})

    async def create_hrms_leave_transaction(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        await self.db.hrms_leave_transactions.insert_one(self._serialize_datetime(data))
        return data

    async def create_leave_application_transaction(self, application: Dict[str, Any], balance_query: Dict[str, Any], days: float) -> Dict[str, Any]:
        """Atomically reserve balance and create a pending leave application."""
        if self.db is None:
            await self.connect()
        session = await self.client.start_session()
        try:
            async with session.start_transaction():
                balance = await self.db.hrms_leave_balances.find_one(balance_query, session=session)
                if balance and balance.get("available", 0) < days and not balance.get("allow_overdraft", False):
                    raise ValueError("Insufficient leave balance")
                if not balance:
                    raise ValueError("Leave balance is not configured")
                await self.db.hrms_leave_balances.update_one(balance_query, {"$inc": {"reserved": days, "available": -days}}, session=session)
                await self.db.hrms_leave_applications.insert_one(self._serialize_datetime(application), session=session)
                await self.db.hrms_leave_transactions.insert_one(self._serialize_datetime({
                    "id": str(uuid.uuid4()), "employee_id": application["employee_id"], "leave_type": application["leave_type"], "application_id": application["id"], "transaction_type": "reserved", "amount": days, "created_at": datetime.utcnow().isoformat()
                }), session=session)
            return application
        finally:
            await session.end_session()

    async def decide_leave_transaction(self, application: Dict[str, Any], decision_data: Dict[str, Any], restore_balance: bool = False, finalize_balance: bool = False) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        session = await self.client.start_session()
        try:
            async with session.start_transaction():
                await self.db.hrms_leave_applications.update_one({"id": application["id"]}, {"$set": self._serialize_datetime(decision_data)}, session=session)
                if restore_balance:
                    await self.db.hrms_leave_balances.update_one({"employee_id": application["employee_id"], "leave_type": application["leave_type"]}, {"$inc": {"reserved": -application["days"], "available": application["days"]}}, session=session)
                    await self.db.hrms_leave_transactions.insert_one(self._serialize_datetime({"id": str(uuid.uuid4()), "employee_id": application["employee_id"], "leave_type": application["leave_type"], "application_id": application["id"], "transaction_type": "restored", "amount": application["days"], "created_at": datetime.utcnow().isoformat()}), session=session)
                if finalize_balance:
                    await self.db.hrms_leave_balances.update_one({"employee_id": application["employee_id"], "leave_type": application["leave_type"]}, {"$inc": {"reserved": -application["days"], "used": application["days"]}}, session=session)
                    await self.db.hrms_leave_transactions.insert_one(self._serialize_datetime({"id": str(uuid.uuid4()), "employee_id": application["employee_id"], "leave_type": application["leave_type"], "application_id": application["id"], "transaction_type": "used", "amount": application["days"], "created_at": datetime.utcnow().isoformat()}), session=session)
            return await self.get_hrms_leave_application(application["id"])
        finally:
            await session.end_session()

    async def list_hrms_holidays(self, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        query = {}
        if date_from or date_to:
            query["holiday_date"] = {key: value for key, value in (("$gte", date_from), ("$lte", date_to)) if value}
        return await self.db.hrms_holidays.find(query, {"_id": 0}).sort("holiday_date", 1).to_list(length=500)

    # ===== HRMS SALARY =====
    async def list_hrms_salary_templates(self, active_only: bool = False) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        query = {"is_active": True} if active_only else {}
        return await self.db.hrms_salary_templates.find(query, {"_id": 0}).sort("name", 1).to_list(length=500)

    async def create_hrms_salary_template(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        await self.db.hrms_salary_templates.insert_one(self._serialize_datetime(data))
        return await self.db.hrms_salary_templates.find_one({"id": data["id"]}, {"_id": 0})

    async def get_hrms_salary_assignment(self, employee_id: str, assignment_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        query = {"employee_id": employee_id}
        if assignment_id:
            query["id"] = assignment_id
        return await self.db.hrms_salary_assignments.find_one(query, {"_id": 0}, sort=[("effective_date", -1), ("created_at", -1)])

    async def list_hrms_salary_history(self, employee_id: str) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.hrms_salary_assignments.find({"employee_id": employee_id}, {"_id": 0}).sort("effective_date", -1).to_list(length=500)

    async def create_hrms_salary_assignment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        await self.db.hrms_salary_assignments.insert_one(self._serialize_datetime(data))
        return await self.db.hrms_salary_assignments.find_one({"id": data["id"]}, {"_id": 0})

    # ===== HRMS ORGANIZATION HIERARCHY =====
    async def list_hrms_resources(self, resource: str, query: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db[f"hrms_{resource}"].find(query or {}, {"_id": 0}).sort("name", 1).to_list(length=1000)

    async def get_hrms_resource(self, resource: str, resource_id: str) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db[f"hrms_{resource}"].find_one({"id": resource_id}, {"_id": 0})

    async def create_hrms_resource(self, resource: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        await self.db[f"hrms_{resource}"].insert_one(self._serialize_datetime(data))
        return await self.get_hrms_resource(resource, data["id"])

    async def update_hrms_resource(self, resource: str, resource_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        await self.db[f"hrms_{resource}"].update_one({"id": resource_id}, {"$set": self._serialize_datetime(data)})
        return await self.get_hrms_resource(resource, resource_id)

    async def get_employee_manager_chain(self, employee_id: str) -> List[str]:
        chain = []
        current_id = employee_id
        while current_id:
            if current_id in chain:
                return chain
            chain.append(current_id)
            employee = await self.get_hrms_employee(current_id)
            current_id = employee.get("manager_employee_id") if employee else None
        return chain

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a user account"""
        if self.db is None:
            await self.connect()
        user_data = self._serialize_datetime(user_data)
        await self.db.users.insert_one(user_data)
        return {key: value for key, value in user_data.items() if key != "password_hash"}

    # ===== USER COMPANY DOCUMENTS =====
    async def get_user_company_documents(self, user_id: str, service_id: str) -> List[Dict[str, Any]]:
        """Get all saved company documents for a user and service."""
        if self.db is None:
            await self.connect()

        return await self.db.company_documents.find(
            {"user_id": user_id, "service_id": service_id},
            {"_id": 0, "user_id": 0, "service_id": 0}
        ).to_list(length=None)

    async def upsert_user_company_document(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update one saved company document for a user."""
        if self.db is None:
            await self.connect()

        document_data = self._serialize_datetime(document_data)
        query = {
            "user_id": document_data["user_id"],
            "service_id": document_data["service_id"],
            "company_type": document_data["company_type"],
            "document_name": document_data["document_name"],
        }
        await self.db.company_documents.update_one(query, {"$set": document_data}, upsert=True)
        return await self.db.company_documents.find_one(query, {"_id": 0, "user_id": 0, "service_id": 0})

    # ===== BLOGS =====
    async def get_all_blogs(self, published_only: bool = False, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all blogs"""
        query = {"published": True} if published_only else {}
       # blogs = await self.db.blogs.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
       # return blogs
        return await self.db.blogs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    async def get_blog_by_id(self, blog_id: str) -> Optional[Dict[str, Any]]:
        """Get blog by ID"""
        #return await self.db.blogs.find_one({"id": blog_id})
        return await self.db.blogs.find_one({"id": blog_id}, {"_id": 0})
    
    async def get_blog_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Get blog by slug"""
       # return await self.db.blogs.find_one({"slug": slug})
        return await self.db.blogs.find_one({"slug": slug}, {"_id": 0})
        
    
    async def create_blog(self, blog_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new blog"""
        result = await self.db.blogs.insert_one(blog_data)
        blog_data['_id'] = str(result.inserted_id)
        return blog_data
    
    async def update_blog(self, blog_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a blog"""
        result = await self.db.blogs.update_one(
            {"id": blog_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def delete_blog(self, blog_id: str) -> bool:
        """Delete a blog"""
        result = await self.db.blogs.delete_one({"id": blog_id})
        return result.deleted_count > 0
    
    async def increment_blog_views(self, blog_id: str) -> bool:
        """Increment blog view count"""
        result = await self.db.blogs.update_one(
            {"id": blog_id},
            {"$inc": {"views": 1}}
        )
        return result.modified_count > 0

    # ===== FAQs =====
    async def get_all_faqs(self, published_only: bool = False) -> List[Dict[str, Any]]:
        """Get all FAQs"""
        query = {"published": True} if published_only else {}
       # faqs = await self.db.faqs.find(query).sort("order", 1).to_list(1000)
       # return faqs
        return await self.db.faqs.find(query, {"_id": 0}).sort("order", 1).to_list(1000)
    
    async def get_faq_by_id(self, faq_id: str) -> Optional[Dict[str, Any]]:
        """Get FAQ by ID"""
       # return await self.db.faqs.find_one({"id": faq_id})
        return await self.db.faqs.find_one({"id": faq_id}, {"_id": 0})
    
    async def create_faq(self, faq_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new FAQ"""
        result = await self.db.faqs.insert_one(faq_data)
        faq_data['_id'] = str(result.inserted_id)
        return faq_data
    
    async def update_faq(self, faq_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a FAQ"""
        result = await self.db.faqs.update_one(
            {"id": faq_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def delete_faq(self, faq_id: str) -> bool:
        """Delete a FAQ"""
        result = await self.db.faqs.delete_one({"id": faq_id})
        return result.deleted_count > 0

    # ===== TESTIMONIALS =====
    async def get_all_testimonials(self, published_only: bool = False) -> List[Dict[str, Any]]:
        """Get all testimonials"""
        query = {"published": True} if published_only else {}
       # testimonials = await self.db.testimonials.find(query).sort("created_at", -1).to_list(1000)
       # return testimonials
        return await self.db.testimonials.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
     
    async def get_testimonial_by_id(self, testimonial_id: str) -> Optional[Dict[str, Any]]:
        """Get testimonial by ID"""
       # return await self.db.testimonials.find_one({"id": testimonial_id})
        return await self.db.testimonials.find_one({"id": testimonial_id}, {"_id": 0})
    
    async def create_testimonial(self, testimonial_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new testimonial"""
        result = await self.db.testimonials.insert_one(testimonial_data)
        testimonial_data['_id'] = str(result.inserted_id)
        return testimonial_data
    
    async def update_testimonial(self, testimonial_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a testimonial"""
        result = await self.db.testimonials.update_one(
            {"id": testimonial_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def delete_testimonial(self, testimonial_id: str) -> bool:
        """Delete a testimonial"""
        result = await self.db.testimonials.delete_one({"id": testimonial_id})
        return result.deleted_count > 0

    # ===== SERVICE PACKAGES =====
    async def get_all_packages(self, published_only: bool = False) -> List[Dict[str, Any]]:
        """Get all service packages"""
        query = {"published": True} if published_only else {}
        #packages = await self.db.packages.find(query).sort("created_at", -1).to_list(1000)
       # return packages
        return await self.db.packages.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    async def get_package_by_id(self, package_id: str) -> Optional[Dict[str, Any]]:
        """Get package by ID"""
       # return await self.db.packages.find_one({"id": package_id})
        return await self.db.packages.find_one({"id": package_id}, {"_id": 0})
    
    async def create_package(self, package_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new package"""
        result = await self.db.packages.insert_one(package_data)
        package_data['_id'] = str(result.inserted_id)
        return package_data
    
    async def update_package(self, package_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a package"""
        result = await self.db.packages.update_one(
            {"id": package_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def delete_package(self, package_id: str) -> bool:
        """Delete a package"""
        result = await self.db.packages.delete_one({"id": package_id})
        return result.deleted_count > 0

    # ===== EMAIL TEMPLATES =====
    async def get_all_templates(self) -> List[Dict[str, Any]]:
        """Get all email templates"""
        #templates = await self.db.email_templates.find().sort("template_type", 1).to_list(1000)
       # return templates
        return await self.db.email_templates.find({}, {"_id": 0}).sort("template_type", 1).to_list(1000)
    
    async def get_template_by_id(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get template by ID"""
        #return await self.db.email_templates.find_one({"id": template_id})
        return await self.db.email_templates.find_one({"id": template_id}, {"_id": 0})
    
    async def get_template_by_type(self, template_type: str) -> Optional[Dict[str, Any]]:
        """Get template by type"""
        return await self.db.email_templates.find_one({"template_type": template_type}, {"_id": 0})
    
    async def create_template(self, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new template"""
        result = await self.db.email_templates.insert_one(template_data)
        template_data['_id'] = str(result.inserted_id)
        return template_data
    
    async def update_template(self, template_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a template"""
        result = await self.db.email_templates.update_one(
            {"id": template_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def delete_template(self, template_id: str) -> bool:
        """Delete a template"""
        result = await self.db.email_templates.delete_one({"id": template_id})
        return result.deleted_count > 0

    # ===== SETTINGS =====
    async def get_settings(self) -> Optional[Dict[str, Any]]:
        """Get application settings"""
        #return await self.db.settings.find_one({"id": "settings"})
        return await self.db.settings.find_one({"id": "settings"}, {"_id": 0})
    
    async def update_settings(self, settings_data: Dict[str, Any]) -> bool:
        """Update settings"""
        result = await self.db.settings.update_one(
            {"id": "settings"},
            {"$set": settings_data},
            upsert=True
        )
        return result.modified_count > 0 or result.upserted_id is not None

    # ===== ANALYTICS =====
    async def track_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Track an analytics event"""
        result = await self.db.analytics.insert_one(event_data)
        event_data['_id'] = str(result.inserted_id)
        return event_data
    
    async def get_analytics_summary(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Get analytics summary"""
        query = {}
        if start_date or end_date:
            query["created_at"] = {}
            if start_date:
                query["created_at"]["$gte"] = start_date
            if end_date:
                query["created_at"]["$lte"] = end_date
        
        total_events = await self.db.analytics.count_documents(query)
        
        # Group by event type
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$event_type",
                "count": {"$sum": 1}
            }}
        ]
        event_types = await self.db.analytics.aggregate(pipeline).to_list(1000)
        
        return {
            "total_events": total_events,
            "by_type": {item["_id"]: item["count"] for item in event_types}
        }

    # ===== PARTNER / CLIENT OPERATIONS =====
    async def get_partner_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.partners.find_one({"username": username}, {"_id": 0})

    async def create_partner(self, partner_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        result = await self.db.partners.insert_one(partner_data)
        partner_data['_id'] = str(result.inserted_id)
        return partner_data

    async def get_partners_by_category(self, category: str) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.partners.find({"category": category}, {"_id": 0}).sort("created_at", -1).to_list(1000)

    async def get_partner_by_id(self, partner_id: str) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.partners.find_one({"id": partner_id}, {"_id": 0})

    async def update_partner(self, partner_id: str, update_data: Dict[str, Any]) -> bool:
        if self.db is None:
            await self.connect()
        update_data = self._serialize_datetime(update_data)
        result = await self.db.partners.update_one({"id": partner_id}, {"$set": update_data})
        return result.matched_count > 0

    async def delete_partner(self, partner_id: str) -> bool:
        if self.db is None:
            await self.connect()
        result = await self.db.partners.delete_one({"id": partner_id})
        return result.deleted_count > 0

    async def create_client(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        client_data = self._serialize_datetime(client_data)
        await self.db.clients.insert_one(client_data)
        return client_data

    async def get_clients_by_partner(self, partner_id: str) -> List[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        query = {
            "$or": [
                {"partner_id": partner_id},
                {"execution_partner_id": partner_id},
                {"referral_partner_id": partner_id}
            ]
        }
        return await self.db.clients.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

    async def get_client_by_id(self, client_id: str) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        return await self.db.clients.find_one({"id": client_id}, {"_id": 0})

    async def update_client(self, partner_id: str, client_id: str, update_data: Dict[str, Any]) -> bool:
        if self.db is None:
            await self.connect()
        update_data = self._serialize_datetime(update_data)
        query = {
            "id": client_id,
            "$or": [
                {"partner_id": partner_id},
                {"execution_partner_id": partner_id},
                {"referral_partner_id": partner_id}
            ]
        }
        result = await self.db.clients.update_one(query, {"$set": update_data})
        return result.matched_count > 0

    async def delete_client(self, partner_id: str, client_id: str) -> bool:
        if self.db is None:
            await self.connect()
        query = {
            "id": client_id,
            "$or": [
                {"partner_id": partner_id},
                {"execution_partner_id": partner_id},
                {"referral_partner_id": partner_id}
            ]
        }
        result = await self.db.clients.delete_one(query)
        return result.deleted_count > 0

    async def add_service_to_client(self, partner_id: str, client_id: str, service_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.db is None:
            await self.connect()
        service_data = self._serialize_datetime(service_data)
        query = {
            "id": client_id,
            "$or": [
                {"partner_id": partner_id},
                {"execution_partner_id": partner_id},
                {"referral_partner_id": partner_id}
            ]
        }
        result = await self.db.clients.update_one(query, {"$push": {"services": service_data}})
        if result.modified_count > 0:
            return await self.get_client_by_id(client_id)
        return None

    async def update_client_service(self, partner_id: str, client_id: str, service_id: str, update_data: Dict[str, Any]) -> bool:
        if self.db is None:
            await self.connect()
        update_data = self._serialize_datetime(update_data)
        set_query = {f"services.$.{k}": v for k, v in update_data.items()}
        query_base = {
            "id": client_id,
            "$or": [
                {"partner_id": partner_id},
                {"execution_partner_id": partner_id},
                {"referral_partner_id": partner_id}
            ]
        }

        # Normalize the path identifier into a string for fallback matching
        identifier = str(service_id) if service_id is not None else None

        # Try matching by internal service document ID first
        if identifier is not None:
            result = await self.db.clients.update_one({**query_base, "services.id": identifier}, {"$set": set_query})
            if result.modified_count > 0:
                return True

            # Fallback to matching by assigned service_id
            result = await self.db.clients.update_one({**query_base, "services.service_id": identifier}, {"$set": set_query})
            if result.modified_count > 0:
                return True

            # Additional fallback: match by service_name when the provided identifier is a name
            result = await self.db.clients.update_one({**query_base, "services.service_name": identifier}, {"$set": set_query})
            if result.modified_count > 0:
                return True
        
        return False

    async def delete_client_service(self, partner_id: str, client_id: str, service_id: str) -> bool:
        if self.db is None:
            await self.connect()
        query = {
            "id": client_id,
            "$or": [
                {"partner_id": partner_id},
                {"execution_partner_id": partner_id},
                {"referral_partner_id": partner_id}
            ]
        }
        result = await self.db.clients.update_one(query, {"$pull": {"services": {"id": service_id}}})
        return result.modified_count > 0

    async def update_service_breakdown_by_identifier(self, partner_id: str, client_id: str, service_name: str, price: float, breakdown_percentages: Dict[str, Any]) -> bool:
        """Update breakdown percentages for a specific service using composite identifier (service_name and price)"""
        if self.db is None:
            await self.connect()
        logger.info(f"Updating breakdown for service {service_name} (price: {price}) in client {client_id}")
        
        # Normalize price if it was passed as a string
        normalized_price = None
        if price is not None:
            try:
                normalized_price = float(price)
            except (TypeError, ValueError):
                normalized_price = None

        # Use positional operator to match the service by name and price when available
        set_query = {f"services.$.breakdown_percentages": breakdown_percentages}
        query = {
            "id": client_id,
            "$or": [
                {"partner_id": partner_id},
                {"execution_partner_id": partner_id},
                {"referral_partner_id": partner_id}
            ],
            "services.service_name": service_name
        }
        if normalized_price is not None:
            query["services.price"] = normalized_price

        logger.info(f"Query: {query}")
        logger.info(f"Update: {set_query}")
        
        result = await self.db.clients.update_one(query, {"$set": set_query})
        logger.info(f"Update result - matched: {result.matched_count}, modified: {result.modified_count}")
        return result.modified_count > 0

    async def get_revenue_by_partner(self, partner_id: str) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        
        # Get full client data where partner is execution/referral or owner
        partner = await self.get_partner_by_id(partner_id)
        partner_category = (partner.get("category") or "").lower() if partner else ""
        clients = await self.db.clients.find({
            "$or": [
                {"partner_id": partner_id},
                {"execution_partner_id": partner_id},
                {"referral_partner_id": partner_id}
            ]
        }).to_list(None)
        
        total_revenue = 0
        total_partner_revenue = 0
        total_referral_revenue = 0
        total_execution_revenue = 0
        by_client = []
        
        for client in clients:
            client_total = 0
            client_referral = 0
            client_execution = 0
            services_data = []

            if client.get("services"):
                for service in client["services"]:
                    price = float(service.get("price", 0))
                    client_total += price
                    breakdown = service.get("breakdown_percentages") or {
                        "referral_percent": 10,
                        "execution_percent": 80,
                        "admin_percent": 10
                    }
                    referral_share = (price * breakdown.get("referral_percent", 10)) / 100
                    execution_share = (price * breakdown.get("execution_percent", 80)) / 100

                    role_referral = (
                        partner_id == client.get("referral_partner_id") or
                        (partner_id == client.get("execution_partner_id") == client.get("referral_partner_id")) or
                        (partner_id == client.get("partner_id") and partner_category in ["referral", "both"] and not client.get("referral_partner_id"))
                    )
                    role_execution = (
                        partner_id == client.get("execution_partner_id") or
                        (partner_id == client.get("execution_partner_id") == client.get("referral_partner_id")) or
                        (partner_id == client.get("partner_id") and partner_category in ["execution", "both"] and not client.get("execution_partner_id"))
                    )

                    service_referral = referral_share if role_referral else 0
                    service_execution = execution_share if role_execution else 0

                    client_referral += service_referral
                    client_execution += service_execution
                    services_data.append({
                        "service_id": service.get("service_id"),
                        "service_name": service.get("service_name"),
                        "price": price,
                        "referral_share": service_referral,
                        "execution_share": service_execution,
                        "breakdown_percentages": breakdown
                    })

            closed_cost = float(client.get("closed_cost", 0))
            if (not client.get("services")) and closed_cost > 0:
                client_total = max(client_total, closed_cost)
                breakdown = {
                    "referral_percent": 10,
                    "execution_percent": 80,
                    "admin_percent": 10
                }
                referral_share = (closed_cost * breakdown["referral_percent"]) / 100
                execution_share = (closed_cost * breakdown["execution_percent"]) / 100
                role_referral = (
                    partner_id == client.get("referral_partner_id") or
                    (partner_id == client.get("execution_partner_id") == client.get("referral_partner_id")) or
                    (partner_id == client.get("partner_id") and partner_category in ["referral", "both"] and not client.get("referral_partner_id"))
                )
                role_execution = (
                    partner_id == client.get("execution_partner_id") or
                    (partner_id == client.get("execution_partner_id") == client.get("referral_partner_id")) or
                    (partner_id == client.get("partner_id") and partner_category in ["execution", "both"] and not client.get("execution_partner_id"))
                )

            total_revenue += client_total
            total_referral_revenue += client_referral
            total_execution_revenue += client_execution
            total_partner_revenue += client_referral + client_execution

            by_client.append({
                "client_id": client["id"],
                "client_name": client.get("full_name", ""),
                "amount": client_total,
                "referral_share": client_referral,
                "execution_share": client_execution,
                "services": services_data,
                "referral_partner_id": client.get("referral_partner_id"),
                "execution_partner_id": client.get("execution_partner_id"),
                "role": (
                    "both" if partner_id == client.get("execution_partner_id") == client.get("referral_partner_id") else
                    "execution" if partner_id == client.get("execution_partner_id") else
                    "referral" if partner_id == client.get("referral_partner_id") else
                    "unknown"
                )
            })
        
        return {
            "total_revenue": total_revenue,
            "partner_total_revenue": total_partner_revenue,
            "referral_revenue": total_referral_revenue,
            "execution_revenue": total_execution_revenue,
            "by_client": by_client
        }
    async def get_closed_cost_revenue_by_partner(self, partner_id: str) -> Dict[str, Any]:
        if self.db is None:
            await self.connect()
        pipeline = [
            {"$match": {"partner_id": partner_id}},
            {"$group": {"_id": "$id", "client_name": {"$first": "$full_name"}, "client_total": {"$sum": {"$ifNull": ["$closed_cost", 0]}}}},
            {"$group": {"_id": None, "total_revenue": {"$sum": "$client_total"}, "by_client": {"$push": {"client_id": "$_id", "client_name": "$client_name", "amount": "$client_total"}}}}
        ]
        res = await self.db.clients.aggregate(pipeline).to_list(1)
        if not res:
            return {"total_revenue": 0, "by_client": []}
        item = res[0]
        return {"total_revenue": item.get("total_revenue", 0), "by_client": item.get("by_client", [])}

# Import here to avoid circular import
from typing import Dict, Any

# Singleton instance
database = Database()
