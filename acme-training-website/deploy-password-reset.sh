#!/bin/bash

# TrainKit Password Reset System Deployment Script
# This script deploys the automated admin account creation and password reset system

set -e  # Exit on any error

echo "================================================"
echo "TrainKit Admin Password Reset System Deployment"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/trainkit"
PM2_APP_NAME="trainkit"

echo -e "${BLUE}1. Checking current directory...${NC}"
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: Application directory not found at $APP_DIR${NC}"
    echo "Please update APP_DIR variable in this script"
    exit 1
fi
cd "$APP_DIR"
echo -e "${GREEN}✓ Found application directory${NC}"
echo ""

echo -e "${BLUE}2. Creating backup...${NC}"
BACKUP_DIR="/var/www/trainkit-backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" \
    prisma/schema.prisma \
    src/app/api/onboarding/route.ts \
    src/app/api/admin/ \
    2>/dev/null || echo "Some files don't exist yet (this is normal for first deployment)"
echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
echo ""

echo -e "${BLUE}3. Copying updated files...${NC}"
# Note: Files should be extracted from the tarball first
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✓ Schema file found${NC}"
else
    echo -e "${RED}✗ Schema file not found - make sure to extract the deployment tarball first!${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}4. Running database migration...${NC}"
echo "This will create the PasswordResetToken table in your database"
export DATABASE_URL="postgresql://trainkit_user:lWYG7Ti7vZW6UU4v6Ts04g==@localhost:5432/trainkit"
npx prisma migrate deploy
echo -e "${GREEN}✓ Migration applied${NC}"
echo ""

echo -e "${BLUE}5. Regenerating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

echo -e "${BLUE}6. Installing dependencies (if needed)...${NC}"
npm install --production
echo -e "${GREEN}✓ Dependencies checked${NC}"
echo ""

echo -e "${BLUE}7. Building application...${NC}"
npm run build
echo -e "${GREEN}✓ Application built${NC}"
echo ""

echo -e "${BLUE}8. Restarting PM2 application...${NC}"
pm2 restart "$PM2_APP_NAME"
sleep 2
pm2 status "$PM2_APP_NAME"
echo -e "${GREEN}✓ Application restarted${NC}"
echo ""

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Deployment Complete! ✓${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "New Features Deployed:"
echo "  ✓ Automated tenant admin account creation"
echo "  ✓ Password reset token system"
echo "  ✓ Welcome email with password setup link"
echo "  ✓ Password reset page at /admin/reset-password"
echo ""
echo "API Endpoints Added:"
echo "  • POST /api/admin/reset-password/request"
echo "  • POST /api/admin/reset-password/confirm"
echo ""
echo "Database Changes:"
echo "  • New table: PasswordResetToken"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test the password reset flow at https://trainkit.co.uk/admin/reset-password"
echo "2. Test admin account creation during onboarding"
echo "3. Check PM2 logs for any issues: pm2 logs $PM2_APP_NAME"
echo ""
echo "For troubleshooting, check:"
echo "  • Application logs: pm2 logs $PM2_APP_NAME"
echo "  • Database connection: psql -U trainkit_user -d trainkit"
echo "  • Backup location: $BACKUP_FILE"
echo ""
