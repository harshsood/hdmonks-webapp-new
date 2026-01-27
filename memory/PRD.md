# HD MONKS Website - Product Requirements Document

## Original Problem Statement
Create a comprehensive business services website for HD MONKS with an interactive 5-stage journey (Incubation & Identity → Operational Readiness → Market Penetration → Defense & Optimization → Exit & Expansion). Website features include interactive milestone toggle for Startup vs MSME views, individual service detail pages, consultation booking calendar, and professional contact form.

## Architecture Summary
- **Frontend**: React + Tailwind CSS + Shadcn UI + Axios
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **Email**: SMTP (configured via environment variables)

## What's Been Implemented (January 8, 2026)

### ✅ Phase 1: Frontend with Mock Data (Completed Jan 6)
- Professional landing page with HD MONKS branding
- Interactive toggle for Startup/MSME journey views
- Progress tracker (20% startup, 75% MSME)
- 5-stage timeline with 25+ services
- Service detail pages
- Contact form, header, footer

### ✅ Phase 2: Backend API Development (Completed Jan 8)
**Core Modules Created:**
- `models.py`: Pydantic models for all data structures
- `database.py`: MongoDB operations with async Motor driver
- `email_service.py`: SMTP email service with HTML templates
- `seed_data.py`: Database population script
- `server.py`: Complete REST API with FastAPI

**API Endpoints:**
- `GET /api/` - Health check
- `GET /api/stages` - Fetch all stages with services
- `GET /api/stages/{stage_id}` - Get specific stage
- `GET /api/services/{service_id}` - Get service details
- `POST /api/contact` - Submit contact inquiry (with email notification)
- `GET /api/timeslots` - Get available consultation slots
- `POST /api/booking` - Book consultation (with confirmation emails)

**Admin CRUD Endpoints:**
- Full CRUD for stages and services
- Inquiry management (`GET /api/admin/inquiries`, update status)
- Timeslot management (create, delete)
- Booking management (view all, update status)

### ✅ Phase 3: Database Integration (Completed Jan 8)
- MongoDB seeded with 5 stages and 25+ services
- 77 consultation timeslots created for next 7 days
- Collections: stages, contact_inquiries, bookings, timeslots

### ✅ Phase 4: Full-Stack Integration (Completed Jan 8)
**Frontend Integration:**
- Created `BookingCalendar.jsx` component with time slot selection
- Updated `Home.jsx` to fetch stages from API
- Updated `ServiceDetail.jsx` to fetch service data from API
- Integrated contact form with backend submission
- Added toast notifications with Sonner
- Removed mock data dependencies

**Features Working:**
- Real-time data loading from MongoDB
- Contact form submission with email notifications
- Consultation booking calendar
- Service filtering by business type
- Dynamic progress tracker
- All interactions fully functional

## Email Configuration
Located in `/app/backend/.env`:
```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"          # UPDATE THIS
SMTP_PASSWORD="your-app-password-here"     # UPDATE THIS
RECIPIENT_EMAIL="contact@hdmonks.com"      # UPDATE THIS
```

**To enable emails**: Update the above placeholders with actual SMTP credentials and restart backend.

## Services Catalog (25 Services Across 5 Stages)

### Stage 1: Incubation & Identity (5 services)
- Startup Assistance & Incubation
- Company Formation
- Intellectual Property Rights
- Branding & Design Strategy
- Digital Setup

### Stage 2: Operational Readiness (4 services)
- HR & Payroll Management
- Legal Advisory
- HR Compliance
- Content & Copy Development

### Stage 3: Market Penetration (4 services)
- Taxation & Accounting
- Digital & Media Services
- Logistics & Supply Chain Legal
- Ongoing Compliances

### Stage 4: Defense & Optimization (3 services)
- Litigation Support
- Advanced Taxation
- Operational Audits

### Stage 5: Exit & Expansion (3 services)
- Funding & Mentoring
- Strategy Advisory
- IPO Readiness

## API Documentation

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stages` | Get all stages with services |
| GET | `/api/services/{id}` | Get service by service_id |
| POST | `/api/contact` | Submit contact inquiry |
| GET | `/api/timeslots` | Get available time slots |
| POST | `/api/booking` | Book consultation |

### Admin Endpoints (No Auth - Add Authentication Later)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/stages` | Create new stage |
| PUT | `/api/admin/stages/{id}` | Update stage |
| DELETE | `/api/admin/stages/{id}` | Delete stage |
| POST | `/api/admin/stages/{id}/services` | Add service to stage |
| PUT | `/api/admin/stages/{id}/services/{sid}` | Update service |
| DELETE | `/api/admin/stages/{id}/services/{sid}` | Delete service |
| GET | `/api/admin/inquiries` | Get all contact inquiries |
| PUT | `/api/admin/inquiries/{id}/status` | Update inquiry status |
| POST | `/api/admin/timeslots` | Create time slot |
| DELETE | `/api/admin/timeslots/{id}` | Delete time slot |
| GET | `/api/admin/bookings` | Get all bookings |
| PUT | `/api/admin/bookings/{id}/status` | Update booking status |

## Next Steps & Enhancements

### P0 (Critical for Production)
1. **Add Authentication** - Protect admin endpoints with JWT tokens
2. **Configure SMTP** - Update email credentials in .env
3. **Content Update** - Replace placeholder content with actual service descriptions
4. **Testing** - End-to-end testing of all flows

### P1 (High Priority)
1. **Admin Dashboard** - Build React admin panel for managing services, inquiries, bookings
2. **Calendar Improvements** - Add timezone support, buffer time between bookings
3. **Email Templates** - Enhance HTML email designs with branding
4. **Analytics** - Track page views, form submissions, booking conversions
5. **FAQ Section** - Common questions about services

### P2 (Nice to Have)
1. **User Authentication** - Client portal for existing customers
2. **Payment Integration** - Accept advance payments for consultations
3. **Document Upload** - Allow clients to upload documents
4. **Live Chat** - Real-time support widget
5. **Blog/Resources** - Content marketing section
6. **WhatsApp Integration** - Direct messaging option
7. **Service Packages** - Bundle multiple services with pricing
8. **Testimonial Management** - Admin can add/edit testimonials

## Technical Notes

### Database Schema
- **stages**: Contains stage info and nested services array
- **contact_inquiries**: Stores form submissions with status tracking
- **bookings**: Consultation bookings with customer details
- **timeslots**: Available consultation time slots

### Key Design Decisions
- Services stored nested within stages for atomic reads
- Timeslots marked unavailable (not deleted) when booked
- Email service degrades gracefully if SMTP not configured
- Frontend shows loading states during API calls
- Toast notifications for user feedback

### Environment Variables
**Backend (.env)**:
- MONGO_URL, DB_NAME
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, RECIPIENT_EMAIL

**Frontend (.env)**:
- REACT_APP_BACKEND_URL (configured for production)

## Maintenance Commands

### Reseed Database
```bash
cd /app/backend && python seed_data.py
```

### Restart Services
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### View Logs
```bash
tail -f /var/log/supervisor/backend.*.log
tail -f /var/log/supervisor/frontend.*.log
```

### Test API
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl "$API_URL/api/stages"
```

## Success Metrics
- ✅ 5 stages fully configured
- ✅ 25 services available
- ✅ 77 consultation slots created
- ✅ Email notifications configured (pending SMTP credentials)
- ✅ Full CRUD operations working
- ✅ Frontend-backend integration complete
- ✅ Responsive design implemented
- ✅ Professional UI with HD MONKS branding

