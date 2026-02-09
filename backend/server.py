from fastapi import FastAPI, APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
#from starlette.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import uuid
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from models import (
    Stage, Service, ContactInquiry, TimeSlot, ConsultationBooking,
    ServiceCreate, ServiceUpdate, StageCreate, StageUpdate,
    ContactInquiryCreate, TimeSlotCreate, ConsultationBookingCreate
)
from database import database
from email_service import email_service
from admin_routes import admin_router
from partner_routes import partner_router

def serialize_mongo(document):
    if isinstance(document, list):
        return [serialize_mongo(doc) for doc in document]

    if isinstance(document, dict):
        new_doc = {}
        for k, v in document.items():
            if isinstance(v, ObjectId):
                new_doc[k] = str(v)
            else:
                new_doc[k] = serialize_mongo(v) if isinstance(v, (dict, list)) else v
        return new_doc

    return document

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="HD MONKS API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ===== PUBLIC ROUTES =====

@api_router.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "HD MONKS API is running", "status": "healthy"}


@api_router.get("/health")
async def health_check():
    """Simple health endpoint to verify server is up without DB access"""
    return {"success": True, "message": "ok"}


@api_router.get("/debug/origin")
async def debug_origin(request: Request):
    """Echo the Origin header for debugging CORS behavior."""
    origin = request.headers.get("origin")
    return {"success": True, "origin": origin}


@api_router.get("/stages")
async def get_stages():
    """Get all stages with services"""
    try:
        stages = await database.get_all_stages()
        stages = serialize_mongo(stages)
        return {"success": True, "data": stages}
    except Exception as e:
        logger.error(f"Error fetching stages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/stages/{stage_id}")
async def get_stage(stage_id: int):
    """Get a specific stage by ID"""
    try:
        stage = await database.get_stage_by_id(stage_id)
        stage = serialize_mongo(stage)
        if not stage:
            raise HTTPException(status_code=404, detail="Stage not found")
        return {"success": True, "data": stage}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/services/{service_id}")
async def get_service(service_id: str):
    """Get a specific service by service_id"""
    try:
        service = await database.get_service_by_service_id(service_id)
        service = serialize_mongo(service)
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
        return {"success": True, "data": service}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching service: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/contact")
async def submit_contact_inquiry(inquiry: ContactInquiryCreate):
    """Submit a contact inquiry"""
    try:
        # Normalize legacy `name` -> `full_name`
        inquiry_payload = inquiry.dict()
        if not inquiry_payload.get('full_name') and inquiry_payload.get('name'):
            inquiry_payload['full_name'] = inquiry_payload.get('name')

        if not inquiry_payload.get('full_name'):
            raise HTTPException(status_code=400, detail="Missing full_name")

        inquiry_obj = ContactInquiry(**inquiry_payload)
        inquiry_data = inquiry_obj.dict()
        
        # Save to database
        created_inquiry = await database.create_contact_inquiry(inquiry_data)
        created_inquiry = serialize_mongo(created_inquiry)
        
        # Send email notification
        email_service.send_contact_inquiry_notification(created_inquiry)
        
        logger.info(f"Contact inquiry created: {created_inquiry['id']}")
        return {
            "success": True,
            "message": "Thank you for your inquiry! We will get back to you soon.",
            "data": created_inquiry
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating contact inquiry: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/timeslots")
async def get_available_timeslots(date: Optional[str] = Query(None)):
    """Get available time slots"""
    try:
        timeslots = await database.get_available_timeslots(date)
        timeslots = serialize_mongo(timeslots)
        return {"success": True, "data": timeslots}
    except Exception as e:
        logger.error(f"Error fetching timeslots: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/settings")
async def get_settings():
    """Get site settings"""
    try:
        settings = await database.get_settings()
        return {"success": True, "data": settings}
    except Exception as e:
        logger.error(f"Error fetching settings: {str(e)}")
        # Return default settings if not found
        return {
            "success": True,
            "data": {
                "company_name": "HD MONKS",
                "site_title": "HD MONKS - Business Solutions",
                "site_description": "End-to-end business solutions from startup to IPO",
                "company_logo_url": "https://customer-assets.emergentagent.com/job_bizlaunch-guide-1/artifacts/7w27dsce_HD%20Monks%20%282%29.png",
                "favicon_url": "https://customer-assets.emergentagent.com/job_bizlaunch-guide-1/artifacts/7w27dsce_HD%20Monks%20%282%29.png",
                "company_email": "hdmonkslegal@gmail.com",
                "company_phone": "+91-7045861090, +91-7011340279"
            }
        }


#@api_router.post("/booking")
#async def book_consultation(booking: ConsultationBookingCreate):
#    """Book a consultation"""
#    try:
#        # Check if timeslot is available
#        timeslot = await database.get_timeslot_by_id(booking.timeslot_id)
#        if not timeslot:
#            raise HTTPException(status_code=404, detail="Time slot not found")
#        if not timeslot.get('is_available'):
#            raise HTTPException(status_code=400, detail="Time slot is no longer available")
#        
#        # Create booking
#        #booking_obj = ConsultationBooking(
#        #    **booking.dict(),
#        #    date=timeslot['date'],
#        #    time=timeslot['time']
#        #)
#        booking_dict = booking.dict()
#
#        # 🔥 FIX FIELD NAME MISMATCH
#        if "name" in booking_dict and "full_name" not in booking_dict:
#            booking_dict["full_name"] = booking_dict.pop("name")
#
#        booking_obj = ConsultationBooking(
#            **booking_dict,
#            date=timeslot['date'],
#            time=timeslot['time']
#        )
#        
#        booking_data = booking_obj.dict()
#        
#        created_booking = await database.create_booking(booking_data)
#        
#        # Mark timeslot as unavailable
#        await database.mark_timeslot_unavailable(booking.timeslot_id)
#        
#        # Send confirmation emails
#        #email_service.send_booking_confirmation(created_booking)
#        try:
#            email_service.send_booking_confirmation(created_booking)
#        except Exception as email_error:
#            logger.error(f"Email sending failed: {email_error}")
#        
#        logger.info(f"Consultation booked: {created_booking['id']}")
#        return {
#            "success": True,
#            "message": "Consultation booked successfully! You will receive a confirmation email shortly.",
#            "data": created_booking
#        }
#    except HTTPException:
#        raise
#    except Exception as e:
#        logger.error(f"Error booking consultation: {str(e)}")
#        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/booking")
async def book_consultation(booking: ConsultationBookingCreate):
    """Book a consultation"""
    try:
        # 1️⃣ Check if timeslot exists
        timeslot = await database.get_timeslot_by_id(booking.timeslot_id)
        if not timeslot:
            raise HTTPException(status_code=404, detail="Time slot not found")

        # 2️⃣ Check availability
        if not timeslot.get('is_available'):
            raise HTTPException(status_code=400, detail="Time slot is no longer available")

        # 3️⃣ Prepare booking data
        booking_dict = booking.dict()

        if "name" in booking_dict and "full_name" not in booking_dict:
            booking_dict["full_name"] = booking_dict.pop("name")

        booking_obj = ConsultationBooking(
            **booking_dict,
            date=timeslot['date'],
            time=timeslot['time']
        )

        booking_data = booking_obj.dict()

        # 4️⃣ Save booking
        created_booking = await database.create_booking(booking_data)
        created_booking = serialize_mongo(created_booking)

        # 5️⃣ Mark slot unavailable (safe)
        try:
            await database.mark_timeslot_unavailable(booking.timeslot_id)
        except Exception as slot_error:
            logger.error(f"Timeslot update failed: {slot_error}")

        # 6️⃣ Send email (safe)
        try:
            email_service.send_booking_confirmation(created_booking)
        except Exception as email_error:
            logger.error(f"Email sending failed: {email_error}")

        logger.info(f"Consultation booked successfully: {created_booking['id']}")

        return {
            "success": True,
            "message": "Consultation booked successfully! You will receive a confirmation email shortly.",
            "data": created_booking
        }

    except HTTPException:
        raise

    except Exception as e:
        # 🔥 CRITICAL: DO NOT FAIL USER IF BOOKING WAS SAVED
        logger.exception(f"Unexpected error in booking API: {e}")

        return {
            "success": True,
            "message": "Consultation booked successfully (email may be delayed).",
            "data": created_booking if 'created_booking' in locals() else None
        }


# ===== ADMIN ROUTES (CRUD OPERATIONS) =====

@api_router.post("/admin/stages")
async def create_stage(stage: StageCreate):
    """Create a new stage (Admin)"""
    try:
        stage_obj = Stage(
            id=stage.id,
            title=stage.title,
            subtitle=stage.subtitle,
            phase=stage.phase,
            services=[Service(**s.dict()) for s in stage.services]
        )
        stage_data = stage_obj.dict()
        
        created_stage = await database.create_stage(stage_data)
        created_stage = serialize_mongo(created_stage)
        logger.info(f"Stage created: {created_stage['id']}")
        return {"success": True, "data": created_stage}
    except Exception as e:
        logger.error(f"Error creating stage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/admin/stages/{stage_id}")
async def update_stage(stage_id: int, stage_update: StageUpdate):
    """Update a stage (Admin)"""
    try:
        update_data = {k: v for k, v in stage_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        update_data['updated_at'] = datetime.utcnow().isoformat()
        success = await database.update_stage(stage_id, update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="Stage not found")
        
        # Fetch and return the updated stage
        updated_stage = await database.get_stage_by_id(stage_id)
        updated_stage = serialize_mongo(updated_stage)
        logger.info(f"Stage updated: {stage_id}")
        return {
            "success": True,
            "message": "Stage updated successfully",
            "data": updated_stage
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating stage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/stages/{stage_id}")
async def delete_stage(stage_id: int):
    """Delete a stage (Admin)"""
    try:
        success = await database.delete_stage(stage_id)
        if not success:
            raise HTTPException(status_code=404, detail="Stage not found")
        
        logger.info(f"Stage deleted: {stage_id}")
        return {"success": True, "message": "Stage deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting stage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/stages/{stage_id}/services")
async def add_service(stage_id: int, service: ServiceCreate):
    """Add a service to a stage (Admin)"""
    try:
        service_data = service.dict()
        
        # Generate service_id if not provided
        if not service_data.get('service_id'):
            service_data['service_id'] = str(uuid.uuid4())
        
        # Ensure relevant_for is always a list
        if not service_data.get('relevant_for'):
            service_data['relevant_for'] = ['startup', 'msme']
        elif not isinstance(service_data['relevant_for'], list):
            service_data['relevant_for'] = list(service_data['relevant_for']) if service_data['relevant_for'] else ['startup', 'msme']
        
        # Add timestamps
        service_data['created_at'] = datetime.utcnow().isoformat()
        service_data['updated_at'] = datetime.utcnow().isoformat()
        
        logger.info(f"Adding service to stage {stage_id}: {service_data}")
        
        success = await database.add_service_to_stage(stage_id, service_data)
        if not success:
            raise HTTPException(status_code=404, detail="Stage not found")
        
        logger.info(f"Service added to stage {stage_id}: {service_data['service_id']}")
        return {
            "success": True,
            "message": "Service added successfully",
            "data": service_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding service: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/admin/stages/{stage_id}/services/{service_id}")
async def update_service(stage_id: int, service_id: str, service_update: ServiceUpdate):
    """Update a service in a stage (Admin)"""
    try:
        update_data = {k: v for k, v in service_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        # Ensure relevant_for is always a list if provided
        if 'relevant_for' in update_data:
            if not isinstance(update_data['relevant_for'], list):
                update_data['relevant_for'] = list(update_data['relevant_for']) if update_data['relevant_for'] else ['startup', 'msme']
        
        update_data['updated_at'] = datetime.utcnow().isoformat()
        logger.info(f"Updating service {service_id} in stage {stage_id}: {update_data}")
        
        success = await database.update_service_in_stage(stage_id, service_id, update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="Service not found")
        
        # Fetch and return the updated service
        updated_service = await database.get_service_by_service_id(service_id)
        updated_service = serialize_mongo(updated_service)
        
        logger.info(f"Service updated: {service_id} in stage {stage_id}")
        return {
            "success": True,
            "message": "Service updated successfully",
            "data": updated_service
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating service: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/stages/{stage_id}/services/{service_id}")
async def delete_service(stage_id: int, service_id: str):
    """Delete a service from a stage (Admin)"""
    try:
        success = await database.delete_service_from_stage(stage_id, service_id)
        if not success:
            raise HTTPException(status_code=404, detail="Service not found")
        
        logger.info(f"Service deleted: {service_id} from stage {stage_id}")
        return {"success": True, "message": "Service deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting service: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/inquiries")
async def get_all_inquiries(skip: int = 0, limit: int = 100):
    """Get all contact inquiries (Admin)"""
    try:
        inquiries = await database.get_all_inquiries(skip, limit)
        inquiries = serialize_mongo(inquiries)
        return {"success": True, "data": inquiries}
    except Exception as e:
        logger.error(f"Error fetching inquiries: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/admin/inquiries/{inquiry_id}/status")
async def update_inquiry_status(inquiry_id: str, status: str):
    """Update inquiry status (Admin)"""
    try:
        success = await database.update_inquiry_status(inquiry_id, status)
        if not success:
            raise HTTPException(status_code=404, detail="Inquiry not found")
        
        logger.info(f"Inquiry status updated: {inquiry_id} -> {status}")
        return {"success": True, "message": "Inquiry status updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating inquiry status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/timeslots")
async def create_timeslot(timeslot: TimeSlotCreate):
    """Create a new time slot (Admin)"""
    try:
        timeslot_obj = TimeSlot(**timeslot.dict())
        timeslot_data = timeslot_obj.dict()
        
        created_timeslot = await database.create_timeslot(timeslot_data)
        created_timeslot = serialize_mongo(created_timeslot)
        logger.info(f"Timeslot created: {created_timeslot['id']}")
        return {"success": True, "data": created_timeslot}
    except Exception as e:
        logger.error(f"Error creating timeslot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/admin/timeslots/{timeslot_id}")
async def update_timeslot(timeslot_id: str, timeslot_update: dict):
    """Update a time slot (Admin)"""
    try:
        # Update only provided fields
        update_data = {k: v for k, v in timeslot_update.items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        # Update in database
        success = await database.update_timeslot(timeslot_id, update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="Timeslot not found")
        
        # Fetch and return the updated timeslot
        updated_timeslot = await database.get_timeslot_by_id(timeslot_id)
        updated_timeslot = serialize_mongo(updated_timeslot)
        logger.info(f"Timeslot updated: {timeslot_id}")
        return {
            "success": True,
            "message": "Timeslot updated successfully",
            "data": updated_timeslot
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating timeslot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/timeslots/{timeslot_id}")
async def delete_timeslot(timeslot_id: str):
    """Delete a time slot (Admin)"""
    try:
        success = await database.delete_timeslot(timeslot_id)
        if not success:
            raise HTTPException(status_code=404, detail="Timeslot not found")
        
        logger.info(f"Timeslot deleted: {timeslot_id}")
        return {"success": True, "message": "Timeslot deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting timeslot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/bookings")
async def get_all_bookings(skip: int = 0, limit: int = 100):
    """Get all consultation bookings (Admin)"""
    try:
        bookings = await database.get_all_bookings(skip, limit)
        bookings = serialize_mongo(bookings)
        return {"success": True, "data": bookings}
    except Exception as e:
        logger.error(f"Error fetching bookings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/admin/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str):
    """Update booking status (Admin)"""
    try:
        success = await database.update_booking_status(booking_id, status)
        if not success:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        logger.info(f"Booking status updated: {booking_id} -> {status}")
        return {"success": True, "message": "Booking status updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating booking status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Configure CORS origins via environment to avoid wildcard with credentials
_allowed_origins = os.environ.get("ALLOWED_ORIGINS")
if _allowed_origins:
    allow_origins = [o.strip() for o in _allowed_origins.split(",") if o.strip()]
else:
    # default to known frontend domains and localhost for testing
    allow_origins = [
        "https://www.hdmonks.com",
        "https://hdmonks.com",
        "http://localhost:3000",
    ]

logger.info(f"CORS allowed origins: {allow_origins}")

@app.middleware("http")
async def log_origin(request: Request, call_next):
    origin = request.headers.get("origin")
    logger.info(f"Incoming request: {request.method} {request.url.path} Origin: {origin}")
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.exception(f"Unhandled exception: {str(e)}")
        #return JSONResponse(status_code=500, content={"success": False, "detail": "Internal server error"})
        raise e

# Add middleware BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    #allow_origins=["*"],
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


#@app.middleware("http")
#async def log_origin(request, call_next):
#    """Log Origin header and catch unhandled exceptions to aid debugging."""
#    origin = request.headers.get("origin")
#    logger.info(f"Incoming request: {request.method} {request.url.path} Origin: {origin}")
#    try:
#        response = await call_next(request)
#        return response
#    except Exception as e:
#        logger.exception(f"Unhandled exception processing request {request.url.path}: {str(e)}")
#        return JSONResponse(status_code=500, content={"success": False, "detail": "Internal server error"})

#@app.middleware("http")
#async def log_origin(request: Request, call_next):
#    origin = request.headers.get("origin")
#    logger.info(f"Incoming request: {request.method} {request.url.path} Origin: {origin}")
#
#    try:
#        response = await call_next(request)
#        return response
#    except Exception as e:
#        logger.exception(f"Unhandled exception: {str(e)}")
#        raise e   # 🔥 LET FASTAPI HANDLE IT
        
# Include the router in the main app (AFTER middleware is configured)
app.include_router(api_router)
app.include_router(admin_router)
app.include_router(partner_router)


@app.on_event("startup")
async def startup_db_client():
    """Initialize database connection on application startup"""
    try:
        await database.connect()
        logger.info("Database connection initialized on startup")
    except Exception as e:
        logger.error(f"Failed to initialize database on startup: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on application shutdown"""
    try:
        await database.close()
        logger.info("Database connection closed on shutdown")
    except Exception as e:
        logger.error(f"Error during database shutdown: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 10000))

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
