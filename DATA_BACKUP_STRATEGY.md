# 🔒 Data Backup & Recovery Strategy

## Overview
This guide provides a comprehensive backup strategy to protect student records, certifications, and training data from loss due to hardware failure, human error, or system resets.

## 🚨 Critical Data to Protect

### Essential Database Tables
- **Students/Customers** - Personal details, contact info, company data
- **Certifications/Achievements** - Certificate numbers, expiry dates, qualification status
- **Training Sessions** - Course completions, attendance records, grades
- **Bookings** - Enrollment history, payment records
- **Courses** - Training programs, categories, validity periods
- **System Settings** - SMTP config, company details, certification rules

### File Assets
- **Uploaded Documents** - Student certificates, ID documents
- **System Configuration** - Environment variables, database schema
- **Email Templates** - Custom reminder templates

---

## 🛡️ Multi-Layer Backup Strategy

### Layer 1: Automated Daily Database Backups
```bash
# Automated SQLite backup script
#!/bin/bash
BACKUP_DIR="/var/backups/acme-training"
DB_FILE="/path/to/your/project/prisma/dev.db"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR/daily

# Create database backup
cp $DB_FILE $BACKUP_DIR/daily/database_backup_$DATE.db

# Compress backup
gzip $BACKUP_DIR/daily/database_backup_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR/daily -name "*.gz" -mtime +30 -delete

echo "✅ Database backup completed: database_backup_$DATE.db.gz"
```

### Layer 2: Weekly Full System Backups
```bash
#!/bin/bash
# Full system backup including files and database
BACKUP_DIR="/var/backups/acme-training"
PROJECT_DIR="/path/to/your/project"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR/weekly

# Create full project backup (excluding node_modules and .next)
tar -czf $BACKUP_DIR/weekly/full_backup_$DATE.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  $PROJECT_DIR

# Keep only last 12 weeks
find $BACKUP_DIR/weekly -name "*.tar.gz" -mtime +84 -delete

echo "✅ Full system backup completed: full_backup_$DATE.tar.gz"
```

### Layer 3: Cloud Storage Backups

#### Option A: Google Drive Backup
```bash
# Install rclone for cloud sync
curl https://rclone.org/install.sh | sudo bash

# Configure Google Drive (run once)
rclone config

# Automated cloud backup script
#!/bin/bash
BACKUP_DIR="/var/backups/acme-training"

# Sync to Google Drive
rclone sync $BACKUP_DIR GoogleDrive:acme-training-backups

echo "✅ Cloud backup completed to Google Drive"
```

#### Option B: Fasthosts Backup Service
```bash
# If using Fasthosts hosting with backup service
# Configure automatic backups in cPanel:
# 1. Login to cPanel
# 2. Go to "Backup Wizard"
# 3. Set up automated daily backups
# 4. Include database and files
```

### Layer 4: Remote Server Backup
```bash
#!/bin/bash
# Backup to remote server via SCP/SFTP
BACKUP_DIR="/var/backups/acme-training"
REMOTE_USER="backup_user"
REMOTE_HOST="backup.yourserver.com"
REMOTE_PATH="/backups/acme-training"

# Transfer latest backups to remote server
rsync -avz --delete $BACKUP_DIR/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

echo "✅ Remote backup completed"
```

---

## 📅 Backup Schedule Recommendations

### Production Schedule
```bash
# Add to crontab: crontab -e

# Daily database backup at 2 AM
0 2 * * * /path/to/scripts/daily-db-backup.sh >> /var/log/backup.log 2>&1

# Weekly full backup at 3 AM on Sundays
0 3 * * 0 /path/to/scripts/weekly-full-backup.sh >> /var/log/backup.log 2>&1

# Cloud sync at 4 AM daily
0 4 * * * /path/to/scripts/cloud-backup.sh >> /var/log/backup.log 2>&1

# Monthly archive backup (1st of month at 5 AM)
0 5 1 * * /path/to/scripts/monthly-archive.sh >> /var/log/backup.log 2>&1
```

---

## 🔧 Backup Scripts for ACME Training

### 1. Database Export Script
```javascript
// scripts/backup-database.js
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = '/var/backups/acme-training/database'
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db')
  const backupPath = `${backupDir}/backup_${timestamp}.db`

  // Ensure backup directory exists
  fs.mkdirSync(backupDir, { recursive: true })

  // Copy database file
  fs.copyFileSync(dbPath, backupPath)

  // Compress backup
  execSync(`gzip ${backupPath}`)

  console.log(`✅ Database backup created: ${backupPath}.gz`)
  return `${backupPath}.gz`
}

if (require.main === module) {
  backupDatabase()
}

module.exports = { backupDatabase }
```

### 2. Data Export Script (JSON Format)
```javascript
// scripts/export-data.js
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportAllData() {
  try {
    console.log('📤 Exporting all training center data...')
    
    const data = {
      timestamp: new Date().toISOString(),
      customers: await prisma.customer.findMany(),
      courses: await prisma.course.findMany(),
      courseSessions: await prisma.courseSession.findMany(),
      bookings: await prisma.booking.findMany(),
      achievements: await prisma.achievement.findMany(),
      sessionAttendance: await prisma.sessionAttendance.findMany(),
      certificationReminders: await prisma.certificationReminder.findMany(),
      systemSettings: await prisma.systemSettings.findMany(),
      certificationRules: await prisma.certificationRule.findMany()
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const exportPath = `/var/backups/acme-training/exports/data_export_${timestamp}.json`
    
    // Ensure export directory exists
    fs.mkdirSync(path.dirname(exportPath), { recursive: true })
    
    // Write data to JSON file
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2))
    
    console.log(`✅ Data export completed: ${exportPath}`)
    console.log(`📊 Exported records:`)
    console.log(`   - ${data.customers.length} customers`)
    console.log(`   - ${data.achievements.length} certifications`)
    console.log(`   - ${data.bookings.length} bookings`)
    console.log(`   - ${data.courseSessions.length} sessions`)

    return exportPath
  } catch (error) {
    console.error('❌ Export failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  exportAllData()
}

module.exports = { exportAllData }
```

---

## 🔄 Recovery Procedures

### Database Recovery
```bash
# 1. Stop the application
pm2 stop acme-training

# 2. Restore database from backup
cp /var/backups/acme-training/database/backup_YYYY-MM-DD.db.gz /tmp/
gunzip /tmp/backup_YYYY-MM-DD.db.gz
cp /tmp/backup_YYYY-MM-DD.db /path/to/project/prisma/dev.db

# 3. Run database migrations (if needed)
cd /path/to/project
npx prisma migrate deploy

# 4. Restart application
pm2 start acme-training
```

### Full System Recovery
```bash
# 1. Extract full backup
tar -xzf /var/backups/acme-training/weekly/full_backup_YYYY-MM-DD.tar.gz -C /

# 2. Reinstall dependencies
cd /path/to/project
npm install

# 3. Rebuild application
npm run build

# 4. Restart services
pm2 restart all
```

---

## ☁️ Cloud Backup Options

### 1. Google Drive (Free 15GB)
- **Pros**: Free storage, reliable, easy setup
- **Cons**: Manual setup, limited free space
- **Best for**: Small training centers

### 2. Fasthosts Backup Service
- **Pros**: Integrated with hosting, automated
- **Cons**: Additional cost, vendor lock-in
- **Best for**: Existing Fasthosts customers

### 3. AWS S3 (Pay per use)
- **Pros**: Highly reliable, scalable, versioning
- **Cons**: Technical setup required
- **Best for**: Large training centers

### 4. Dropbox Business
- **Pros**: Easy sync, file versioning
- **Cons**: Monthly cost
- **Best for**: Medium training centers

---

## 📋 Backup Monitoring & Alerts

### Health Check Script
```bash
#!/bin/bash
# scripts/backup-health-check.sh

BACKUP_DIR="/var/backups/acme-training"
EMAIL="admin@acme-training.co.uk"

# Check if recent backup exists (within 24 hours)
if [ ! -f $(find $BACKUP_DIR/daily -name "*.gz" -mtime -1) ]; then
    echo "❌ WARNING: No recent database backup found!" | mail -s "Backup Alert" $EMAIL
else
    echo "✅ Backup system healthy"
fi
```

---

## 🎯 Quick Setup Checklist

### Immediate Actions (Do Now)
- [ ] Create backup directories: `/var/backups/acme-training/{daily,weekly,exports}`
- [ ] Set up daily database backup cron job
- [ ] Test backup and restore procedures
- [ ] Choose cloud backup provider
- [ ] Document recovery procedures

### Weekly Tasks
- [ ] Verify backup files are being created
- [ ] Test cloud sync is working
- [ ] Check backup file sizes (growth monitoring)
- [ ] Clean up old backup files

### Monthly Tasks
- [ ] Perform test restoration on staging server
- [ ] Review backup storage usage
- [ ] Update recovery documentation
- [ ] Audit backup security

---

## 🚨 Emergency Contact Information

### Data Recovery Services
- **Local IT Support**: [Your local IT company]
- **Database Recovery**: Professional data recovery services
- **Cloud Provider Support**: Google Drive, AWS, etc.

### Backup Locations
- **Local**: `/var/backups/acme-training/`
- **Cloud**: [Your cloud provider path]
- **Remote**: [Your remote server details]

---

## 💡 Best Practices

### Security
- Encrypt backup files containing personal data
- Use secure transfer protocols (SFTP, HTTPS)
- Limit backup file access permissions
- Regular security audits of backup systems

### Testing
- Monthly restore tests on non-production systems
- Document recovery times and procedures
- Train staff on basic recovery procedures
- Verify backup integrity regularly

### Compliance
- GDPR compliance for EU customer data
- Data retention policies (how long to keep backups)
- Secure deletion of old backup files
- Documentation for audit purposes

---

**Remember**: The best backup is the one you've tested and know works! 🛡️

**Last Updated**: September 2025  
**Version**: 1.0  
**Critical Priority**: ⚠️ IMPLEMENT IMMEDIATELY ⚠️