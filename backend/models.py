from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
import uuid


# ===== STAGE AND SERVICE MODELS =====

class Service(BaseModel):
    service_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: Optional[str] = None
    details: Optional[str] = None
    relevant_for: List[str] = []
    price: Optional[str] = None
    duration: Optional[str] = None
    features: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ServiceCreate(BaseModel):
    service_id: Optional[str] = None
    name: str
    description: str
    icon: Optional[str] = None
    details: Optional[str] = None
    relevant_for: List[str] = []
    price: Optional[str] = None
    duration: Optional[str] = None
    features: List[str] = []


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    details: Optional[str] = None
    relevant_for: Optional[List[str]] = None
    price: Optional[str] = None
    duration: Optional[str] = None
    features: Optional[List[str]] = None


class Stage(BaseModel):
    id: int
    title: str
    subtitle: str
    phase: str
    services: List[Service] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class StageCreate(BaseModel):
    id: int
    title: str
    subtitle: str
    phase: str
    services: List[ServiceCreate] = []


class StageUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    phase: Optional[str] = None


# ===== CONTACT INQUIRY MODELS =====

class ContactInquiry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    message: str
    service_interest: Optional[str] = None
    status: str = "new"  # new, contacted, qualified, closed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ContactInquiryCreate(BaseModel):
    full_name: Optional[str] = None
    # legacy support for older clients
    name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    message: str
    service_interest: Optional[str] = None


# ===== TIME SLOT AND BOOKING MODELS =====

class TimeSlot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD format
    time: str  # HH:MM format
    is_available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TimeSlotCreate(BaseModel):
    date: str
    time: str


class ConsultationBooking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: str
    phone: str
    company: Optional[str] = None
    service_interest: str
    message: Optional[str] = None
    date: str
    time: str
    timeslot_id: str
    status: str = "confirmed"  # confirmed, completed, cancelled, no_show
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ConsultationBookingCreate(BaseModel):
    full_name: Optional[str] = None
    # legacy support for older clients
    name: Optional[str] = None
    email: EmailStr
    phone: str
    business_type: str
    service_interest: Optional[str] = None
    timeslot_id: str
    message: Optional[str] = None


# Admin Models
class Admin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    email: EmailStr
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AdminLogin(BaseModel):
    username: str
    password: str


# Blog/Article Models
class Blog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    excerpt: str
    content: str
    author: str
    category: str
    tags: List[str] = []
    featured_image: Optional[str] = None
    published: bool = False
    views: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class BlogCreate(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    author: str
    category: str
    tags: List[str] = []
    featured_image: Optional[str] = None
    published: bool = False


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    featured_image: Optional[str] = None
    published: Optional[bool] = None


# FAQ Models
class FAQ(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    answer: str
    category: str
    order: int = 0
    published: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FAQCreate(BaseModel):
    question: str
    answer: str
    category: str
    order: int = 0
    published: bool = True


class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    order: Optional[int] = None
    published: Optional[bool] = None


# Testimonial Models
class Testimonial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    company: str
    designation: Optional[str] = None
    text: str
    rating: int = 5
    image: Optional[str] = None
    published: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TestimonialCreate(BaseModel):
    name: str
    company: str
    designation: Optional[str] = None
    text: str
    rating: int = 5
    image: Optional[str] = None
    published: bool = True


class TestimonialUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    designation: Optional[str] = None
    text: Optional[str] = None
    rating: Optional[int] = None
    image: Optional[str] = None
    published: Optional[bool] = None


# Service Package Models
class ServicePackage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    services: List[str]  # List of service IDs
    price: float
    duration: str  # e.g., "3 months", "1 year"
    features: List[str]
    popular: bool = False
    published: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PackageCreate(BaseModel):
    name: str
    description: str
    services: List[str]
    price: float
    duration: str
    features: List[str]
    popular: bool = False
    published: bool = True


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    services: Optional[List[str]] = None
    price: Optional[float] = None
    duration: Optional[str] = None
    features: Optional[List[str]] = None
    popular: Optional[bool] = None
    published: Optional[bool] = None


# Email Template Models
class EmailTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    subject: str
    html_content: str
    template_type: str  # contact, booking, newsletter, etc.
    variables: List[str] = []  # List of placeholder variables
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TemplateCreate(BaseModel):
    name: str
    subject: str
    html_content: str
    template_type: str
    variables: List[str] = []


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    variables: Optional[List[str]] = None


# Settings Model
class Settings(BaseModel):
    id: str = "settings"
    company_name: str = "HD MONKS"
    company_email: str = "hdmonkslegal@gmail.com"
    company_phone: str = "+91-7045861090, +91-7011340279"
    company_address: str = "Your Business Address"
    site_title: str = "HD MONKS - Business Solutions"
    site_description: str = "End-to-end business solutions from startup to IPO"
    company_logo_url: Optional[str] = "https://customer-assets.emergentagent.com/job_bizlaunch-guide-1/artifacts/7w27dsce_HD%20Monks%20%282%29.png"
    favicon_url: Optional[str] = "https://customer-assets.emergentagent.com/job_bizlaunch-guide-1/artifacts/7w27dsce_HD%20Monks%20%282%29.png"
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    recipient_email: Optional[str] = None
    social_links: dict = {}
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    company_email: Optional[str] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None
    site_title: Optional[str] = None
    site_description: Optional[str] = None
    company_logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    recipient_email: Optional[str] = None
    social_links: Optional[dict] = None


# ===== PARTNER / CLIENT MODELS =====
class Partner(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password_hash: str
    name: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PartnerLogin(BaseModel):
    username: str
    password: str


class ClientService(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_id: str
    service_name: Optional[str] = None
    price: Optional[float] = 0.0
    purchase_date: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[dict] = {}


class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner_id: str
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    services: List[ClientService] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ClientCreate(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None


class ClientUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None


class ClientServiceCreate(BaseModel):
    service_id: str
    service_name: Optional[str] = None
    price: Optional[float] = 0.0
    metadata: Optional[dict] = {}


class ClientServiceUpdate(BaseModel):
    price: Optional[float] = None
    metadata: Optional[dict] = None


# Analytics Model
class Analytics(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str  # page_view, form_submit, booking, etc.
    page: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    metadata: Optional[dict] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)