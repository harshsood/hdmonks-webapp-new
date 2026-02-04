# Pre-Deployment Verification Checklist

## Backend Code Verification

### ✅ Database Startup Hook
- [ ] File: `backend/server.py` line 432
- [ ] Check: `@app.on_event("startup")` exists
- [ ] Check: `await database.connect()` is called
- [ ] Check: Logging statements present

### ✅ Service Model Fields
- [ ] File: `backend/models.py` line 11
- [ ] Check: `name: str` (not `title`)
- [ ] Check: `icon: Optional[str]` exists
- [ ] Check: `details: Optional[str]` exists
- [ ] Check: `relevant_for: List[str]` exists

### ✅ Service Creation Endpoint
- [ ] File: `backend/server.py` line 256
- [ ] Check: Auto-generates `service_id` if missing
- [ ] Check: Sets `created_at` timestamp
- [ ] Check: Sets `updated_at` timestamp
- [ ] Check: Uses `.isoformat()` for timestamps
- [ ] Check: Returns `data` in response

### ✅ Service Update Endpoint
- [ ] File: `backend/server.py` line 277
- [ ] Check: Uses `.isoformat()` for updated_at
- [ ] Check: Fetches updated service from DB
- [ ] Check: Returns updated data in response

### ✅ Stage Update Endpoint
- [ ] File: `backend/server.py` line 208
- [ ] Check: Returns updated stage data
- [ ] Check: Uses `.isoformat()` for timestamp

### ✅ All Admin Routes PUT Endpoints
- [ ] Blog update (line 201): Returns data
- [ ] FAQ update (line 278): Returns data  
- [ ] Testimonial update (line 358): Returns data
- [ ] Package update (line 441): Returns data
- [ ] Template update (line 521): Returns data
- [ ] Settings update (line 587): Returns data
- [ ] All use `.isoformat()` for timestamps

---

## Frontend Code Verification

### ✅ API Utility File
- [ ] File: `frontend/src/lib/api.js`
- [ ] Check: Imports axios
- [ ] Check: Has token injection interceptor
- [ ] Check: Has 401 error handling
- [ ] Check: Has `api.get()`, `api.post()`, etc.
- [ ] Check: Has logging with "[API]" prefix

### ✅ ServicesManagement Component
- [ ] File: `frontend/src/pages/admin/ServicesManagement.jsx`
- [ ] Check: `fetchStages()` validates token
- [ ] Check: `handleSubmit()` logs operations
- [ ] Check: Error messages extracted from response
- [ ] Check: `console.error()` calls for debugging
- [ ] Check: Response verification before showing success

### ✅ Error Handling Pattern
Check each function has:
- [ ] Try-catch blocks
- [ ] Token validation
- [ ] Response status checking
- [ ] Detailed error logging
- [ ] User-friendly toast messages

---

## Documentation Verification

### ✅ Main Reports
- [ ] `DATA_SYNC_AUDIT_REPORT.md` exists
- [ ] `TROUBLESHOOTING.md` exists
- [ ] `IMPLEMENTATION_SUMMARY.md` exists
- [ ] `deploy-fixes.sh` exists and executable

### ✅ Report Content
- [ ] Issues clearly described
- [ ] Fixes detailed with line numbers
- [ ] Testing instructions provided
- [ ] Troubleshooting steps complete
- [ ] Deployment instructions clear

---

## Syntax Verification

### ✅ Python Files
```bash
python3 -m py_compile backend/server.py
python3 -m py_compile backend/admin_routes.py
python3 -m py_compile backend/database.py
python3 -m py_compile backend/models.py
```

Result: ✅ All should compile without errors

### ✅ JavaScript Files
- [ ] No console errors when loading admin panel
- [ ] React components render without warnings
- [ ] Imports are correct

---

## Data Integrity Verification

### ✅ No Breaking Changes
- [ ] Existing database collections untouched
- [ ] Existing documents unmodified
- [ ] API routes still backward compatible
- [ ] Public endpoints unchanged

### ✅ New Fields Added (Not Removed)
- [ ] `icon` field added to services
- [ ] `details` field added to services
- [ ] `relevant_for` field added to services
- [ ] No existing fields removed

### ✅ Timestamps Properly Formatted
- [ ] All timestamps use `.isoformat()`
- [ ] Format: `2026-02-04T12:34:56.123456`
- [ ] All datetimes converted to strings

---

## Functional Verification

### ✅ Create Operations
- [ ] Service creation works
- [ ] Blog creation works
- [ ] FAQ creation works
- [ ] Returns `data` field

### ✅ Update Operations
- [ ] Service update works
- [ ] Blog update works
- [ ] FAQ update works
- [ ] Returns updated `data`
- [ ] Timestamp updated in DB

### ✅ Delete Operations
- [ ] Service deletion works
- [ ] Blog deletion works
- [ ] FAQ deletion works
- [ ] Data actually removed from DB

### ✅ Error Scenarios
- [ ] Invalid token → 401 error
- [ ] Missing field → 400 error
- [ ] Not found → 404 error
- [ ] Server error → 500 error with detail
- [ ] Error message displays in UI

---

## Environment Verification

### ✅ Render Backend
- [ ] `MONGO_URL` env var exists
- [ ] `DB_NAME` env var exists (value: "hdmonks")
- [ ] `PORT` env var exists (value: 10000)
- [ ] URL: https://hdmonks-api.render.com
- [ ] Health check responds with 200

### ✅ Vercel Frontend
- [ ] `REACT_APP_BACKEND_URL` env var exists
- [ ] Value points to backend URL
- [ ] URL responds properly
- [ ] CORS configured correctly

---

## Pre-Deployment Checklist

### 24 Hours Before
- [ ] Code review complete
- [ ] All files modified listed
- [ ] No unintended changes
- [ ] Tests passed locally

### Just Before Deployment
- [ ] Git status clean
- [ ] All changes committed
- [ ] Backup branch created
- [ ] Documentation reviewed
- [ ] Team notified
- [ ] Render monitoring open
- [ ] MongoDB Atlas console open

### During Deployment
- [ ] Code pushed to GitHub
- [ ] Watch Render logs
- [ ] Watch Vercel deployment
- [ ] Check for errors

### Immediately After
- [ ] API health check: `curl https://hdmonks-api.render.com/api/`
- [ ] Check Render logs: "Database connection initialized"
- [ ] Check Vercel deployment status
- [ ] Browser dev tools: Network + Console
- [ ] Make test change in admin

### 30 Minutes After
- [ ] Admin panel responsive
- [ ] Changes persist after refresh
- [ ] MongoDB shows updates
- [ ] No error emails received
- [ ] Monitoring shows healthy stats

---

## Rollback Checklist (If Needed)

### Quick Rollback
- [ ] Backup branch exists: `git branch -l | grep backup`
- [ ] Note branch name: `backup/data-sync-fixes-XXXX`
- [ ] Checkout backup: `git checkout backup/data-sync-fixes-XXXX`
- [ ] Force push: `git push origin main -f`
- [ ] Wait for redeployment

### Verification After Rollback
- [ ] Render redeploying
- [ ] Vercel redeploying
- [ ] Old code running
- [ ] Services responsive

---

## Sign-Off

- [ ] Backend changes verified
- [ ] Frontend changes verified
- [ ] Documentation complete
- [ ] Code compiles without errors
- [ ] No breaking changes
- [ ] No data loss
- [ ] Ready for production

**Verified By:** _______________  
**Date:** _______________  
**Time:** _______________  

**Status:** ✅ Ready for Deployment

---

## Quick Reference

### Test API Directly
```bash
# Health check
curl https://hdmonks-api.render.com/api/

# List stages
curl https://hdmonks-api.render.com/api/stages

# Update service (needs token)
curl -X PUT https://hdmonks-api.render.com/api/admin/stages/1/services/SERVICE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'
```

### Check Render Logs
1. https://dashboard.render.com
2. Select app
3. Click "Logs" tab
4. Search for "error" or "Database"

### Check MongoDB
1. https://cloud.mongodb.com
2. Select cluster
3. Click "Collections"
4. View documents
5. Sort by `updated_at` DESC

### Browser DevTools
- F12 → Console: Look for "[API]" logs
- F12 → Network: Monitor requests
- F12 → Application: Check localStorage for token

---

**Ready to Deploy? Start here:** `./deploy-fixes.sh`
