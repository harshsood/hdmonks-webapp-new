from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

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
        if not isinstance(service.get('relevant_for'), list):
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
        return await self.db.admins.find_one({"username": username})
    
    async def create_admin(self, admin_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create admin user"""
        result = await self.db.admins.insert_one(admin_data)
        admin_data['_id'] = str(result.inserted_id)
        return admin_data

    # ===== BLOGS =====
    async def get_all_blogs(self, published_only: bool = False, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all blogs"""
        query = {"published": True} if published_only else {}
        blogs = await self.db.blogs.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        return blogs
    
    async def get_blog_by_id(self, blog_id: str) -> Optional[Dict[str, Any]]:
        """Get blog by ID"""
        return await self.db.blogs.find_one({"id": blog_id})
    
    async def get_blog_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Get blog by slug"""
        return await self.db.blogs.find_one({"slug": slug})
    
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
        faqs = await self.db.faqs.find(query).sort("order", 1).to_list(1000)
        return faqs
    
    async def get_faq_by_id(self, faq_id: str) -> Optional[Dict[str, Any]]:
        """Get FAQ by ID"""
        return await self.db.faqs.find_one({"id": faq_id})
    
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
        testimonials = await self.db.testimonials.find(query).sort("created_at", -1).to_list(1000)
        return testimonials
    
    async def get_testimonial_by_id(self, testimonial_id: str) -> Optional[Dict[str, Any]]:
        """Get testimonial by ID"""
        return await self.db.testimonials.find_one({"id": testimonial_id})
    
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
        packages = await self.db.packages.find(query).sort("created_at", -1).to_list(1000)
        return packages
    
    async def get_package_by_id(self, package_id: str) -> Optional[Dict[str, Any]]:
        """Get package by ID"""
        return await self.db.packages.find_one({"id": package_id})
    
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
        templates = await self.db.email_templates.find().sort("template_type", 1).to_list(1000)
        return templates
    
    async def get_template_by_id(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get template by ID"""
        return await self.db.email_templates.find_one({"id": template_id})
    
    async def get_template_by_type(self, template_type: str) -> Optional[Dict[str, Any]]:
        """Get template by type"""
        return await self.db.email_templates.find_one({"template_type": template_type})
    
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
        return await self.db.settings.find_one({"id": "settings"})
    
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


# Import here to avoid circular import
from typing import Dict, Any

# Singleton instance
database = Database()
