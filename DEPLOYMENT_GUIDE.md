# HD Monks Web App - Deployment Guide

## Frontend Deployment (Vercel)

### ✅ Completed Setup
- **Frontend**: Deployed on Vercel
- **Backend API**: Running on Render (https://hd-monks-web-app.onrender.com)
- **Environment Variable**: `REACT_APP_BACKEND_URL` configured in Vercel
- **Routing**: SPA routing configured via `vercel.json`

### 📋 Vercel Configuration

The `vercel.json` file at the root includes:
- **Build Command**: Installs dependencies with `--legacy-peer-deps` and builds the React app
- **Output Directory**: `frontend/build`
- **Rewrites**: All routes redirect to `/index.html` for React Router SPA
- **Headers**: Security headers and caching policies for static assets

### 🔧 Final Vercel Setup Steps

1. **Open Vercel Dashboard**
   - Navigate to: https://vercel.com/harshsood/hd-monks-web-app

2. **Verify Project Settings**
   - **General**: Root Directory should be auto-detected from `vercel.json`
   - **Build & Development**:
     - Build Command: (auto from `vercel.json`)
     - Output Directory: `frontend/build` (auto from `vercel.json`)

3. **Environment Variables**
   - Add `REACT_APP_BACKEND_URL`: `https://hd-monks-web-app.onrender.com`
   - Apply to: **Production** and **Preview**

4. **Redeploy**
   - Go to **Deployments** tab
   - Click the latest deployment → **Redeploy**

### 🌐 Live URLs
- **Frontend Home**: https://hd-monks-web-app-git-copilot-vscode-f0e44d-harshsoods-projects.vercel.app
- **Admin Login**: https://hd-monks-web-app-git-copilot-vscode-f0e44d-harshsoods-projects.vercel.app/admin/login

---

## Backend Issues to Address

### ⚠️ Issue 1: Admin Login "Invalid Credentials"

**Possible Causes:**
1. Backend is not running or not accessible
2. Admin credentials in database don't match the login form (default: `admin`/`admin123`)
3. Network/CORS issue between frontend and backend

**Fix:**
```bash
# Check backend is running
curl https://hd-monks-web-app.onrender.com/api/

# Verify admin user exists in MongoDB
# Navigate to MongoDB Atlas → Your cluster → admin collection
# Confirm username: "admin" and password hash matches
```

### ⚠️ Issue 2: Missing Services Data (Stages 4 & 5)

**Probable Cause:**
- Seed data was not run on the backend database, or was only partially seeded

**Fix:**
1. **Option A: Re-run Seed Script**
   ```bash
   cd backend
   python seed_data.py
   ```

2. **Option B: Verify Data in MongoDB**
   - Check MongoDB Atlas for `hdmonks.stages` collection
   - Confirm documents with `id: 4` and `id: 5` exist
   - If missing, run the seed script

### ✅ Data Check
The frontend fetches from `GET /api/stages` and expects:
```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "...", "services": [...] },
    { "id": 2, "title": "...", "services": [...] },
    { "id": 3, "title": "...", "services": [...] },
    { "id": 4, "title": "...", "services": [...] },
    { "id": 5, "title": "...", "services": [...] }
  ]
}
```

---

## Frontend API Integration

All API calls use the environment variable `REACT_APP_BACKEND_URL`:

### Files Using Backend:
- `src/pages/Home.jsx` - Fetches stages and contact submissions
- `src/pages/ServiceDetail.jsx` - Fetches single service details
- `src/components/BookingCalendar.jsx` - Fetches timeslots and creates bookings
- `src/contexts/AdminAuthContext.jsx` - Admin login and token verification
- `src/pages/admin/*` - Admin management pages

### API Endpoints Used:
```
GET  /api/stages
GET  /api/services/{serviceId}
GET  /api/timeslots
POST /api/contact
POST /api/booking
POST /api/admin/login
GET  /api/admin/verify
```

---

## Testing & Validation

### 1. Test Homepage
```bash
# Visit and verify:
# - Stages load correctly (all 5 stages visible)
# - Services display under each stage
# - Booking modal functions
# - Contact form works
curl https://hd-monks-web-app-git-copilot-vscode-f0e44d-harshsoods-projects.vercel.app
```

### 2. Check Browser Console
- **F12** → **Console** tab
- Verify no 404 errors for API calls
- Confirm `REACT_APP_BACKEND_URL` is correctly set

### 3. Network Tab
- **F12** → **Network** tab
- Click a service detail link
- Verify `GET /api/services/{id}` returns 200 status

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **404 on home page** | Vercel routing not working → redeploy with `vercel.json` |
| **Services data missing** | Backend seed data not run → run `python seed_data.py` |
| **Admin login fails** | Backend down or credentials wrong → check backend at Render |
| **API calls 404** | `REACT_APP_BACKEND_URL` not set in Vercel → add env var |

---

## Notes

- ✅ React downgraded to 18.2.0 for compatibility
- ✅ All eslint warnings fixed (useEffect dependencies)
- ✅ Production build passes without errors
- ✅ SPA routing properly configured
- ⏳ Backend data seeding may be required
