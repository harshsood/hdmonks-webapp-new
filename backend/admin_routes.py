"""
Admin panel API routes
"""
from fastapi import APIRouter, HTTPException, Header, Query, Depends, UploadFile, File
from typing import List, Optional
from datetime import datetime
import base64
import io

from models import (
    AdminLogin, Blog, BlogCreate, BlogUpdate,
    FAQ, FAQCreate, FAQUpdate,
    Testimonial, TestimonialCreate, TestimonialUpdate,
    ServicePackage, PackageCreate, PackageUpdate,
    EmailTemplate, TemplateCreate, TemplateUpdate,
    SettingsUpdate
)
from database import database
from admin_auth import verify_password, create_session, verify_session, delete_session
import logging

logger = logging.getLogger(__name__)

# Create admin router
admin_router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Dependency to verify admin session
async def verify_admin_token(authorization: Optional[str] = Header(None)):
    """Verify admin authentication token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token provided")
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.replace("Bearer ", "")
        session = verify_session(token)
        
        if not session:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        return session
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")


# ===== AUTHENTICATION =====

@admin_router.post("/login")
async def admin_login(credentials: AdminLogin):
    """Admin login"""
    try:
        # Ensure database is connected
        if database.db is None:
            await database.connect()
        
        # Get admin by username
        admin = await database.get_admin_by_username(credentials.username)
        
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(credentials.password, admin["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create session
        session = create_session(admin["id"], admin["username"])
        
        logger.info(f"Admin logged in: {credentials.username}")
        return {
            "success": True,
            "token": session["token"],
            "admin": {
                "username": admin["username"],
                "email": admin["email"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/logout")
async def admin_logout(session: dict = Depends(verify_admin_token)):
    """Admin logout"""
    try:
        # Extract token from session (you'll need to modify verify_admin_token to return token)
        # For now, we'll just return success
        return {"success": True, "message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.get("/verify")
async def verify_admin(session: dict = Depends(verify_admin_token)):
    """Verify admin session"""
    return {
        "success": True,
        "admin": {
            "username": session["username"]
        }
    }


# ===== DASHBOARD STATS =====

@admin_router.get("/stats")
async def get_dashboard_stats(session: dict = Depends(verify_admin_token)):
    """Get dashboard statistics"""
    try:
        # Get counts
        all_stages = await database.get_all_stages()
        total_services = sum(len(stage.get('services', [])) for stage in all_stages)
        
        inquiries = await database.get_all_inquiries(limit=1000)
        bookings = await database.get_all_bookings(limit=1000)
        
        # Get recent inquiries and bookings
        recent_inquiries = inquiries[:5]
        recent_bookings = bookings[:5]
        
        # Count by status
        inquiry_stats = {
            "new": len([i for i in inquiries if i.get('status') == 'new']),
            "contacted": len([i for i in inquiries if i.get('status') == 'contacted']),
            "closed": len([i for i in inquiries if i.get('status') == 'closed'])
        }
        
        booking_stats = {
            "confirmed": len([b for b in bookings if b.get('status') == 'confirmed']),
            "completed": len([b for b in bookings if b.get('status') == 'completed']),
            "cancelled": len([b for b in bookings if b.get('status') == 'cancelled'])
        }
        
        return {
            "success": True,
            "stats": {
                "total_services": total_services,
                "total_inquiries": len(inquiries),
                "total_bookings": len(bookings),
                "inquiry_stats": inquiry_stats,
                "booking_stats": booking_stats,
                "recent_inquiries": recent_inquiries,
                "recent_bookings": recent_bookings
            }
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== BLOGS =====

@admin_router.get("/blogs")
async def get_all_blogs_admin(
    published_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    session: dict = Depends(verify_admin_token)
):
    """Get all blogs (admin)"""
    try:
        blogs = await database.get_all_blogs(published_only, skip, limit)
        return {"success": True, "data": blogs}
    except Exception as e:
        logger.error(f"Error fetching blogs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/blogs")
async def create_blog_admin(blog: BlogCreate, session: dict = Depends(verify_admin_token)):
    """Create a new blog"""
    try:
        blog_obj = Blog(**blog.dict())
        blog_data = blog_obj.dict()
        
        created_blog = await database.create_blog(blog_data)
        logger.info(f"Blog created: {created_blog['id']}")
        return {"success": True, "data": created_blog}
    except Exception as e:
        logger.error(f"Error creating blog: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.put("/blogs/{blog_id}")
async def update_blog_admin(
    blog_id: str,
    blog_update: BlogUpdate,
    session: dict = Depends(verify_admin_token)
):
    """Update a blog"""
    try:
        update_data = {k: v for k, v in blog_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        update_data['updated_at'] = datetime.utcnow()
        success = await database.update_blog(blog_id, update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="Blog not found")
        
        logger.info(f"Blog updated: {blog_id}")
        return {"success": True, "message": "Blog updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating blog: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.delete("/blogs/{blog_id}")
async def delete_blog_admin(blog_id: str, session: dict = Depends(verify_admin_token)):
    """Delete a blog"""
    try:
        success = await database.delete_blog(blog_id)
        if not success:
            raise HTTPException(status_code=404, detail="Blog not found")
        
        logger.info(f"Blog deleted: {blog_id}")
        return {"success": True, "message": "Blog deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting blog: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== FAQs =====

@admin_router.get("/faqs")
async def get_all_faqs_admin(
    published_only: bool = False,
    session: dict = Depends(verify_admin_token)
):
    """Get all FAQs (admin)"""
    try:
        faqs = await database.get_all_faqs(published_only)
        return {"success": True, "data": faqs}
    except Exception as e:
        logger.error(f"Error fetching FAQs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/faqs")
async def create_faq_admin(faq: FAQCreate, session: dict = Depends(verify_admin_token)):
    """Create a new FAQ"""
    try:
        faq_obj = FAQ(**faq.dict())
        faq_data = faq_obj.dict()
        
        created_faq = await database.create_faq(faq_data)
        logger.info(f"FAQ created: {created_faq['id']}")
        return {"success": True, "data": created_faq}
    except Exception as e:
        logger.error(f"Error creating FAQ: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.put("/faqs/{faq_id}")
async def update_faq_admin(
    faq_id: str,
    faq_update: FAQUpdate,
    session: dict = Depends(verify_admin_token)
):
    """Update a FAQ"""
    try:
        update_data = {k: v for k, v in faq_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        success = await database.update_faq(faq_id, update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="FAQ not found")
        
        logger.info(f"FAQ updated: {faq_id}")
        return {"success": True, "message": "FAQ updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating FAQ: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.delete("/faqs/{faq_id}")
async def delete_faq_admin(faq_id: str, session: dict = Depends(verify_admin_token)):
    """Delete a FAQ"""
    try:
        success = await database.delete_faq(faq_id)
        if not success:
            raise HTTPException(status_code=404, detail="FAQ not found")
        
        logger.info(f"FAQ deleted: {faq_id}")
        return {"success": True, "message": "FAQ deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting FAQ: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== TESTIMONIALS =====

@admin_router.get("/testimonials")
async def get_all_testimonials_admin(
    published_only: bool = False,
    session: dict = Depends(verify_admin_token)
):
    """Get all testimonials (admin)"""
    try:
        testimonials = await database.get_all_testimonials(published_only)
        return {"success": True, "data": testimonials}
    except Exception as e:
        logger.error(f"Error fetching testimonials: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/testimonials")
async def create_testimonial_admin(
    testimonial: TestimonialCreate,
    session: dict = Depends(verify_admin_token)
):
    """Create a new testimonial"""
    try:
        testimonial_obj = Testimonial(**testimonial.dict())
        testimonial_data = testimonial_obj.dict()
        
        created_testimonial = await database.create_testimonial(testimonial_data)
        logger.info(f"Testimonial created: {created_testimonial['id']}")
        return {"success": True, "data": created_testimonial}
    except Exception as e:
        logger.error(f"Error creating testimonial: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.put("/testimonials/{testimonial_id}")
async def update_testimonial_admin(
    testimonial_id: str,
    testimonial_update: TestimonialUpdate,
    session: dict = Depends(verify_admin_token)
):
    """Update a testimonial"""
    try:
        update_data = {k: v for k, v in testimonial_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        success = await database.update_testimonial(testimonial_id, update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="Testimonial not found")
        
        logger.info(f"Testimonial updated: {testimonial_id}")
        return {"success": True, "message": "Testimonial updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating testimonial: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial_admin(
    testimonial_id: str,
    session: dict = Depends(verify_admin_token)
):
    """Delete a testimonial"""
    try:
        success = await database.delete_testimonial(testimonial_id)
        if not success:
            raise HTTPException(status_code=404, detail="Testimonial not found")
        
        logger.info(f"Testimonial deleted: {testimonial_id}")
        return {"success": True, "message": "Testimonial deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting testimonial: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== SERVICE PACKAGES =====

@admin_router.get("/packages")
async def get_all_packages_admin(
    published_only: bool = False,
    session: dict = Depends(verify_admin_token)
):
    """Get all service packages (admin)"""
    try:
        packages = await database.get_all_packages(published_only)
        return {"success": True, "data": packages}
    except Exception as e:
        logger.error(f"Error fetching packages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/packages")
async def create_package_admin(
    package: PackageCreate,
    session: dict = Depends(verify_admin_token)
):
    """Create a new service package"""
    try:
        package_obj = ServicePackage(**package.dict())
        package_data = package_obj.dict()
        
        created_package = await database.create_package(package_data)
        logger.info(f"Package created: {created_package['id']}")
        return {"success": True, "data": created_package}
    except Exception as e:
        logger.error(f"Error creating package: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.put("/packages/{package_id}")
async def update_package_admin(
    package_id: str,
    package_update: PackageUpdate,
    session: dict = Depends(verify_admin_token)
):
    """Update a service package"""
    try:
        update_data = {k: v for k, v in package_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        success = await database.update_package(package_id, update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="Package not found")
        
        logger.info(f"Package updated: {package_id}")
        return {"success": True, "message": "Package updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating package: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.delete("/packages/{package_id}")
async def delete_package_admin(
    package_id: str,
    session: dict = Depends(verify_admin_token)
):
    """Delete a service package"""
    try:
        success = await database.delete_package(package_id)
        if not success:
            raise HTTPException(status_code=404, detail="Package not found")
        
        logger.info(f"Package deleted: {package_id}")
        return {"success": True, "message": "Package deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting package: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== EMAIL TEMPLATES =====

@admin_router.get("/templates")
async def get_all_templates_admin(session: dict = Depends(verify_admin_token)):
    """Get all email templates (admin)"""
    try:
        templates = await database.get_all_templates()
        return {"success": True, "data": templates}
    except Exception as e:
        logger.error(f"Error fetching templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/templates")
async def create_template_admin(
    template: TemplateCreate,
    session: dict = Depends(verify_admin_token)
):
    """Create a new email template"""
    try:
        template_obj = EmailTemplate(**template.dict())
        template_data = template_obj.dict()
        
        created_template = await database.create_template(template_data)
        logger.info(f"Template created: {created_template['id']}")
        return {"success": True, "data": created_template}
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.put("/templates/{template_id}")
async def update_template_admin(
    template_id: str,
    template_update: TemplateUpdate,
    session: dict = Depends(verify_admin_token)
):
    """Update an email template"""
    try:
        update_data = {k: v for k, v in template_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        update_data['updated_at'] = datetime.utcnow()
        success = await database.update_template(template_id, update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="Template not found")
        
        logger.info(f"Template updated: {template_id}")
        return {"success": True, "message": "Template updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.delete("/templates/{template_id}")
async def delete_template_admin(
    template_id: str,
    session: dict = Depends(verify_admin_token)
):
    """Delete an email template"""
    try:
        success = await database.delete_template(template_id)
        if not success:
            raise HTTPException(status_code=404, detail="Template not found")
        
        logger.info(f"Template deleted: {template_id}")
        return {"success": True, "message": "Template deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== SETTINGS =====

@admin_router.get("/settings")
async def get_settings_admin(session: dict = Depends(verify_admin_token)):
    """Get application settings"""
    try:
        settings = await database.get_settings()
        if not settings:
            # Return default settings
            from models import Settings
            settings = Settings().dict()
        
        return {"success": True, "data": settings}
    except Exception as e:
        logger.error(f"Error fetching settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.put("/settings")
async def update_settings_admin(
    settings_update: SettingsUpdate,
    session: dict = Depends(verify_admin_token)
):
    """Update application settings"""
    try:
        update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        update_data['updated_at'] = datetime.utcnow()
        success = await database.update_settings(update_data)
        
        logger.info("Settings updated")
        return {"success": True, "message": "Settings updated successfully"}
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== ANALYTICS =====

@admin_router.get("/analytics")
async def get_analytics_admin(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    session: dict = Depends(verify_admin_token)
):
    """Get analytics summary"""
    try:
        start = datetime.fromisoformat(start_date) if start_date else None
        end = datetime.fromisoformat(end_date) if end_date else None
        
        analytics = await database.get_analytics_summary(start, end)
        return {"success": True, "data": analytics}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DD)")
    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== IMAGE UPLOAD =====

@admin_router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    session: dict = Depends(verify_admin_token)
):
    """Upload an image and return base64 data URL"""
    try:
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, and WebP images are allowed")
        
        # Validate file size (max 5MB)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Convert to base64 data URL
        base64_str = base64.b64encode(content).decode('utf-8')
        data_url = f"data:{file.content_type};base64,{base64_str}"
        
        logger.info(f"Image uploaded: {file.filename}")
        return {
            "success": True,
            "data_url": data_url,
            "message": f"Image {file.filename} uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
