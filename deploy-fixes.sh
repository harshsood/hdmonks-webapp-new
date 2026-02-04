#!/bin/bash

# Deployment Script for HD MONKS Data Sync Fixes
# This script helps deploy the fixes to the live environment

set -e  # Exit on error

echo "🚀 HD MONKS Data Synchronization Fix - Deployment Script"
echo "========================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git is not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment Checklist${NC}"
echo "1. All fixes have been applied locally"
echo "2. Testing completed on local environment"
echo "3. Ready to deploy to production"
echo ""

read -p "Continue with deployment? (yes/no) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}📦 Step 1: Verifying code syntax${NC}"

# Verify Python syntax
if command -v python3 &> /dev/null; then
    echo "Checking backend Python files..."
    python3 -m py_compile backend/server.py 2>/dev/null && echo -e "${GREEN}✓ server.py${NC}" || echo -e "${RED}✗ Syntax error in server.py${NC}"
    python3 -m py_compile backend/admin_routes.py 2>/dev/null && echo -e "${GREEN}✓ admin_routes.py${NC}" || echo -e "${RED}✗ Syntax error in admin_routes.py${NC}"
    python3 -m py_compile backend/database.py 2>/dev/null && echo -e "${GREEN}✓ database.py${NC}" || echo -e "${RED}✗ Syntax error in database.py${NC}"
    python3 -m py_compile backend/models.py 2>/dev/null && echo -e "${GREEN}✓ models.py${NC}" || echo -e "${RED}✗ Syntax error in models.py${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Step 2: Git status${NC}"
git status

echo ""
echo -e "${YELLOW}Step 3: Creating backup branch (optional)${NC}"
read -p "Create backup branch? (yes/no) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    BACKUP_BRANCH="backup/data-sync-fixes-$(date +%Y%m%d-%H%M%S)"
    git branch "$BACKUP_BRANCH"
    echo -e "${GREEN}✓ Backup created: $BACKUP_BRANCH${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Committing changes${NC}"
git add -A
git commit -m "Fix: Data synchronization pipeline

- Add database connection initialization on startup
- Fix Service model field names (name, icon, details, relevant_for)
- Add auto-generation of service_id on creation
- Return updated data from all PUT endpoints
- Use ISO format for all timestamps (isoformat())
- Improve frontend error handling and logging
- Add centralized API utility with token injection

This ensures:
✓ Admin panel changes sync to MongoDB
✓ Frontend displays confirmed updates
✓ Proper error messages and logging
✓ No data loss or corruption
✓ Better user experience

Fixes: #data-sync-critical" || echo -e "${YELLOW}No changes to commit${NC}"

echo ""
echo -e "${YELLOW}Step 5: Pushing to repository${NC}"
read -p "Push to GitHub? (yes/no) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo -e "${GREEN}✓ Changes pushed to GitHub${NC}"
    echo ""
    echo -e "${YELLOW}⏳ Waiting for automatic deployments...${NC}"
    echo "This may take 2-5 minutes:"
    echo "  - Render backend will redeploy automatically"
    echo "  - Vercel frontend will redeploy automatically"
else
    echo -e "${YELLOW}⚠ Not pushing to GitHub. Run this to deploy:${NC}"
    echo "  git push origin main"
fi

echo ""
echo -e "${GREEN}✅ Deployment script completed!${NC}"
echo ""
echo -e "${YELLOW}📊 Post-Deployment Steps:${NC}"
echo ""
echo "1. Wait 2-3 minutes for deployments to complete"
echo ""
echo "2. Verify Backend:"
echo "   curl https://hdmonks-api.render.com/api/"
echo "   Expected: {\"message\": \"HD MONKS API is running\", \"status\": \"healthy\"}"
echo ""
echo "3. Check Render Logs:"
echo "   https://dashboard.render.com → Select app → Logs"
echo "   Should see: 'Database connection initialized on startup'"
echo ""
echo "4. Test Admin Panel:"
echo "   - Login to admin panel"
echo "   - Edit a service/blog/FAQ"
echo "   - Verify change appears in table"
echo "   - Check browser console for '[API]' logs"
echo ""
echo "5. Verify MongoDB:"
echo "   https://cloud.mongodb.com → Collections"
echo "   Check that data was actually updated with recent timestamp"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "  - DATA_SYNC_AUDIT_REPORT.md - Complete audit and fixes"
echo "  - TROUBLESHOOTING.md - Quick troubleshooting guide"
echo ""
echo -e "${GREEN}Deployment ready! 🎉${NC}"
