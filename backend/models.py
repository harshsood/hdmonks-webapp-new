from pydantic import BaseModel, Field, EmailStr
from typing import Dict, List, Literal, Optional
from datetime import datetime
import uuid


# ===== CONTENT SECTION MODEL =====

class ContentSection(BaseModel):
    """SEO-friendly content section with heading and content"""
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    heading: str
    content: str
    order: int = 0


class ContentSectionCreate(BaseModel):
    heading: str
    content: str
    order: int = 0


# ===== STAGE AND SERVICE MODELS =====

class Service(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    service_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: Optional[str] = None
    details: Optional[str] = None
    relevant_for: List[str] = []
    price: Optional[str] = None
    duration: Optional[str] = None
    features: List[str] = []
    content_sections: List[dict] = []  # List of content sections for SEO
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ServiceCreate(BaseModel):
    id: Optional[str] = None
    service_id: Optional[str] = None
    name: str
    description: str
    icon: Optional[str] = None
    details: Optional[str] = None
    relevant_for: List[str] = []
    price: Optional[str] = None
    duration: Optional[str] = None
    features: List[str] = []
    content_sections: Optional[List[dict]] = []


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    details: Optional[str] = None
    relevant_for: Optional[List[str]] = None
    price: Optional[str] = None
    duration: Optional[str] = None
    features: Optional[List[str]] = None
    content_sections: Optional[List[dict]] = None


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


# User account models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: EmailStr
    password_hash: str
    permissions: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class HRMSLogin(BaseModel):
    identifier: str = Field(min_length=1)
    password: str = Field(min_length=1)
    remember_me: bool = False


class EmployeeBase(BaseModel):
    employee_code: str = Field(min_length=1, max_length=50)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    profile_photo_url: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    work_email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=30)
    address: Optional[Dict[str, str]] = None
    emergency_contact: Optional[Dict[str, str]] = None
    date_of_joining: str
    employment_type: Literal["full_time", "part_time", "contract", "intern", "consultant"]
    department: Optional[str] = None
    team_id: Optional[str] = None
    designation: Optional[str] = None
    manager_user_id: Optional[str] = None
    manager_employee_id: Optional[str] = None
    branch: Optional[str] = None
    location: Optional[str] = None
    probation_period_days: Optional[int] = Field(default=None, ge=0, le=365)
    confirmation_date: Optional[str] = None
    notice_period_days: Optional[int] = Field(default=None, ge=0, le=365)
    employment_status: Literal["active", "inactive", "archived"] = "active"


class EmployeeCreate(EmployeeBase):
    user_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    payment_method: Optional[Literal["bank_transfer", "cash", "cheque"]] = None
    tax_information: Optional[Dict[str, str]] = None


class EmployeeUpdate(BaseModel):
    employee_code: Optional[str] = Field(default=None, min_length=1, max_length=50)
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    profile_photo_url: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    work_email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=30)
    address: Optional[Dict[str, str]] = None
    emergency_contact: Optional[Dict[str, str]] = None
    date_of_joining: Optional[str] = None
    employment_type: Optional[Literal["full_time", "part_time", "contract", "intern", "consultant"]] = None
    department: Optional[str] = None
    team_id: Optional[str] = None
    designation: Optional[str] = None
    manager_user_id: Optional[str] = None
    manager_employee_id: Optional[str] = None
    branch: Optional[str] = None
    location: Optional[str] = None
    probation_period_days: Optional[int] = Field(default=None, ge=0, le=365)
    confirmation_date: Optional[str] = None
    notice_period_days: Optional[int] = Field(default=None, ge=0, le=365)
    employment_status: Optional[Literal["active", "inactive", "archived"]] = None
    user_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    payment_method: Optional[Literal["bank_transfer", "cash", "cheque"]] = None
    tax_information: Optional[Dict[str, str]] = None


class EmployeeDocumentCreate(BaseModel):
    document_type: Literal[
        "offer_letter", "appointment_letter", "id_document", "certificate", "contract", "salary_revision"
    ]
    file_name: str = Field(min_length=1, max_length=255)
    file_type: Optional[str] = None
    file_size: Optional[int] = Field(default=None, ge=0, le=10_000_000)
    file_data: Optional[str] = None


class EmployeeStatusUpdate(BaseModel):
    status: Literal["active", "inactive", "archived"]
    reason: Optional[str] = Field(default=None, max_length=500)


class OrganizationResource(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    code: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = Field(default=None, max_length=500)
    company_id: Optional[str] = None
    branch_id: Optional[str] = None
    department_id: Optional[str] = None
    manager_employee_id: Optional[str] = None
    is_active: bool = True


class OrganizationResourceUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    code: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = Field(default=None, max_length=500)
    company_id: Optional[str] = None
    branch_id: Optional[str] = None
    department_id: Optional[str] = None
    manager_employee_id: Optional[str] = None
    is_active: Optional[bool] = None


ATTENDANCE_STATES = Literal[
    "PRESENT", "ABSENT", "HALF_DAY", "LATE", "EARLY_EXIT", "ON_LEAVE",
    "WFH", "HOLIDAY", "WEEKLY_OFF", "OVERTIME"
]


class AttendanceCheckRequest(BaseModel):
    occurred_at: Optional[str] = None
    source: Literal["web", "mobile", "biometric", "device", "import"] = "web"
    device_id: Optional[str] = None
    note: Optional[str] = Field(default=None, max_length=500)


class AttendanceCorrectionCreate(BaseModel):
    attendance_date: str
    requested_check_in: Optional[str] = None
    requested_check_out: Optional[str] = None
    requested_status: Optional[ATTENDANCE_STATES] = None
    reason: str = Field(min_length=5, max_length=1000)


class AttendanceCorrectionDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    comment: Optional[str] = Field(default=None, max_length=1000)


class AttendancePolicy(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    workday_hours: float = Field(default=8, gt=0, le=24)
    late_grace_minutes: int = Field(default=15, ge=0, le=720)
    half_day_hours: float = Field(default=4, ge=0, le=24)
    overtime_after_hours: float = Field(default=8, gt=0, le=24)
    is_active: bool = True


class AttendanceManualUpdate(BaseModel):
    status: Optional[ATTENDANCE_STATES] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    break_duration_minutes: Optional[int] = Field(default=None, ge=0, le=1440)
    note: Optional[str] = Field(default=None, max_length=500)


LEAVE_TYPES = Literal["CASUAL", "SICK", "EARNED", "PRIVILEGE", "MATERNITY", "PATERNITY", "COMP_OFF", "UNPAID", "WFH"]


class LeaveTypeCreate(BaseModel):
    code: LEAVE_TYPES
    name: str = Field(min_length=1, max_length=100)
    annual_entitlement: float = Field(default=0, ge=0, le=366)
    accrual_frequency: Literal["none", "monthly", "quarterly", "yearly"] = "yearly"
    carry_forward_allowed: bool = False
    carry_forward_limit: float = Field(default=0, ge=0, le=366)
    encashment_allowed: bool = False
    encashment_limit: float = Field(default=0, ge=0, le=366)
    allow_half_day: bool = True
    allow_hourly: bool = False
    requires_hr_approval: bool = False
    is_active: bool = True


class LeaveApplicationCreate(BaseModel):
    leave_type: LEAVE_TYPES
    start_date: str
    end_date: str
    duration: Literal["full_day", "half_day", "hours"] = "full_day"
    hours: Optional[float] = Field(default=None, gt=0, le=24)
    reason: str = Field(min_length=3, max_length=1000)


class LeaveDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    comment: Optional[str] = Field(default=None, max_length=1000)


class LeaveTypeUpdate(LeaveTypeCreate):
    pass


class HolidayCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    holiday_date: str
    is_optional: bool = False
    is_active: bool = True


EARNING_TYPES = Literal[
    "BASIC", "HRA", "CONVEYANCE", "SPECIAL_ALLOWANCE", "MEDICAL_ALLOWANCE",
    "OTHER_ALLOWANCE", "BONUS", "INCENTIVE", "OVERTIME"
]
DEDUCTION_TYPES = Literal["PF", "ESI", "PROFESSIONAL_TAX", "TDS", "LOAN", "ADVANCE", "OTHER_DEDUCTION"]


class SalaryComponent(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    component_type: Literal["earning", "deduction"]
    code: str = Field(min_length=1, max_length=50)
    amount: float = Field(default=0, ge=0)
    percentage: Optional[float] = Field(default=None, ge=0, le=100)
    calculation_base: Optional[str] = None
    is_variable: bool = False


class SalaryTemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: Optional[str] = Field(default=None, max_length=500)
    earnings: List[SalaryComponent] = []
    deductions: List[SalaryComponent] = []
    is_active: bool = True


class SalaryAssignmentCreate(BaseModel):
    template_id: Optional[str] = None
    effective_date: str
    ctc: float = Field(ge=0)
    gross_salary: float = Field(ge=0)
    net_salary: float = Field(ge=0)
    earnings: List[SalaryComponent] = []
    deductions: List[SalaryComponent] = []
    change_type: Literal["initial", "revision", "increment", "promotion"] = "initial"
    change_reason: Optional[str] = Field(default=None, max_length=1000)


class SalaryRevisionCreate(SalaryAssignmentCreate):
    change_type: Literal["revision", "increment", "promotion"] = "revision"


class CompanyDocumentUpdate(BaseModel):
    company_type: str
    document_name: str
    created: bool = False
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    file_data: Optional[str] = None


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
    category: str = "execution"  # execution or referral
    company: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PartnerCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    name: Optional[str] = None
    phone: Optional[str] = None
    category: str = "execution"
    company: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None


class PartnerUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    category: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None


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
    # Custom breakdown percentages (defaults: 10% referral, 80% execution, 10% admin)
    breakdown_percentages: Optional[dict] = Field(default_factory=lambda: {
        "referral_percent": 10,
        "execution_percent": 80,
        "admin_percent": 10
    })


class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner_id: str
    execution_partner_id: Optional[str] = None
    referral_partner_id: Optional[str] = None
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    closed_cost: Optional[float] = 0.0
    services: List[ClientService] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ClientCreate(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    closed_cost: Optional[float] = 0.0
    execution_partner_id: Optional[str] = None
    referral_partner_id: Optional[str] = None


class ClientUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    closed_cost: Optional[float] = None
    execution_partner_id: Optional[str] = None
    referral_partner_id: Optional[str] = None


class ClientServiceCreate(BaseModel):
    service_id: str
    service_name: Optional[str] = None
    price: Optional[float] = 0.0
    metadata: Optional[dict] = {}


class ClientServiceUpdate(BaseModel):
    price: Optional[float] = None
    metadata: Optional[dict] = None
    breakdown_percentages: Optional[dict] = None


class AdminClientServiceUpdate(ClientServiceUpdate):
    execution_partner_id: Optional[str] = None
    referral_partner_id: Optional[str] = None


# Analytics Model
class Analytics(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str  # page_view, form_submit, booking, etc.
    page: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    metadata: Optional[dict] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)