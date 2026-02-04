# Quick Troubleshooting Guide

## Problem: Service/Blog changes not saving

### Step 1: Check Browser Console
- Open DevTools (F12)
- Go to Console tab
- Make a change in admin panel
- Look for "[API]" logs
- Look for any red errors

### Step 2: Check Network Tab
- Open DevTools (F12)
- Go to Network tab
- Make a change
- Find the PUT/POST request
- Check Response tab:
  - Should show `"success": true`
  - Should contain `"data": {...updated fields...}`
  - Status should be 200

### Step 3: Verify Backend Connection
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select the backend app
3. Check Logs tab
4. Should see "Database connection initialized on startup"
5. If error: check MONGO_URL environment variable

### Step 4: Check MongoDB Data
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select cluster → Collections
3. Select collection (e.g., `stages`)
4. View documents
5. Search for your changed service
6. Should see updated_at timestamp recently changed

### Step 5: Hard Refresh Frontend
- Ctrl + Shift + Delete (Windows/Linux)
- Cmd + Shift + Delete (Mac)
- Clear browsing data
- Go back to admin panel

---

## Problem: 401 Unauthorized Error

**Cause:** Authentication token expired or not found

**Solution:**
1. Logout from admin panel
2. Clear localStorage:
   - F12 → Application → Local Storage → Clear All
3. Login again
4. Try operation again

---

## Problem: "No update data provided" Error

**Cause:** Frontend sending null/undefined values

**Solution:**
1. Check all fields in form
2. Ensure you changed at least one field
3. Submit form again

---

## Problem: Timestamps showing as strange format

**Cause:** Frontend trying to parse datetime object instead of string

**This has been fixed!** Backend now sends ISO format strings

---

## Problem: "Service not found" Error

**Cause:** Mismatch between service_id in URL and database

**Solution:**
1. Refresh admin page
2. Check if service still exists in table
3. Try deleting and recreating service

---

## Important: MongoDB Direct Query

To check what's actually in MongoDB:

```javascript
// In MongoDB Atlas Console
db.stages.findOne({ "services.service_id": "your-service-id" })

// Should return structure like:
{
  id: 1,
  title: "Stage Name",
  services: [
    {
      service_id: "your-service-id",
      name: "Service Name",
      description: "Description",
      updated_at: "2026-02-04T12:34:56.789123"
    }
  ]
}
```

---

## Environment Variable Verification

### Check Render Backend Variables:
1. Render Dashboard → App → Environment
2. Verify these exist:
   - `MONGO_URL` (should contain mongodb+srv://)
   - `DB_NAME` (should be "hdmonks")
   - `PORT` (should be 10000)

### Check Vercel Frontend Variables:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Verify:
   - `REACT_APP_BACKEND_URL` (should be backend URL)

---

## Enable Verbose Logging

### Backend (in Render Logs):
Already enabled - you'll see all operations logged

### Frontend (in Browser Console):
Enable by checking for "[API]" prefix messages:
- "[API] PUT: ..." = successful API call
- "[API Error] PUT: ..." = failed API call

---

## Advanced Debugging

### Test API Directly (using curl):

```bash
# Get all stages (public)
curl https://hdmonks-api.render.com/api/stages

# Update service (requires token)
curl -X PUT https://hdmonks-api.render.com/api/admin/stages/1/services/service-id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name", "description": "New Desc"}'
```

### Check Backend is Running:
```bash
curl https://hdmonks-api.render.com/api/
# Should return: {"message": "HD MONKS API is running", "status": "healthy"}
```

---

## Last Resort: Restart Backend

1. Go to Render Dashboard
2. Select app
3. Click "Manual Deploy" or restart

This will:
- Reinitialize database connection
- Reload all code changes
- Take ~1-2 minutes

---

## Get More Help

### Check Logs:
1. **Render Backend Logs:** Dashboard → App → Logs
2. **Vercel Frontend Logs:** Dashboard → Project → Deployments → Logs
3. **Browser Console:** F12 → Console tab
4. **MongoDB Logs:** Atlas → Project → Activity

### Verify Changes Are Real:
1. Don't just check frontend display
2. Query MongoDB directly to confirm data changed
3. Check timestamp to confirm when it changed
