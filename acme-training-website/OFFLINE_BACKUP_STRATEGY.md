# 🔌 Offline Backup & Power Failure Protection

## Overview
This guide provides robust backup strategies for training centers that handle power cuts, internet outages, and system failures. Ensures data safety even when connectivity is lost.

## 🚨 Scenarios We Need to Handle

### Power Failures
- **Sudden power loss** during data entry
- **Extended outages** preventing normal operations
- **UPS battery depletion** during long outages
- **System corruption** from improper shutdown

### Internet Connectivity Issues
- **Temporary internet loss** preventing cloud backups
- **Slow/unreliable connections** causing failed uploads
- **ISP outages** lasting hours or days
- **Network equipment failures**

### Hardware Failures
- **Hard drive corruption** or failure
- **Server/computer crashes** during operations
- **Memory corruption** causing data loss
- **Storage device failures**

---

## 🛡️ Multi-Tier Offline Protection Strategy

### Tier 1: Real-Time Local Protection
**Immediate protection against power failures and crashes**

#### Auto-Save Database Changes
```javascript
// Enhanced database operations with auto-backup
class SafeDatabaseOperations {
  async safeCreate(model, data) {
    // Create local backup before changes
    await this.createInstantBackup()
    
    try {
      const result = await prisma[model].create({ data })
      
      // Backup after successful change
      await this.createChangeBackup(model, 'CREATE', result)
      
      return result
    } catch (error) {
      console.error('Database operation failed:', error)
      throw error
    }
  }
  
  async createInstantBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `/var/backups/acme-training/instant/db_${timestamp}.db`
    
    // Copy database file immediately
    fs.copyFileSync(process.env.DATABASE_URL.replace('file:', ''), backupPath)
  }
}
```

#### Power Failure Auto-Recovery
```bash
#!/bin/bash
# /etc/systemd/system/acme-backup-on-shutdown.service
# Automatic backup before system shutdown

[Unit]
Description=ACME Training Emergency Backup on Shutdown
DefaultDependencies=false
Before=shutdown.target reboot.target halt.target

[Service]
Type=oneshot
RemainAfterExit=true
ExecStart=/bin/true
ExecStop=/path/to/project/scripts/emergency-backup.sh
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

### Tier 2: Scheduled Local Backups
**Regular local backups independent of internet**

#### Every 15 Minutes - Incremental Backup
```bash
#!/bin/bash
# scripts/incremental-backup.sh
BACKUP_DIR="/var/backups/acme-training/incremental"
DB_FILE="/path/to/project/prisma/dev.db"
TIMESTAMP=$(date +%Y%m%d_%H%M)

# Create timestamped backup
mkdir -p $BACKUP_DIR
cp $DB_FILE $BACKUP_DIR/db_backup_$TIMESTAMP.db

# Keep only last 100 incremental backups (25 hours)
cd $BACKUP_DIR
ls -t db_backup_*.db | tail -n +101 | xargs rm -f

echo "✅ Incremental backup completed: $TIMESTAMP"
```

#### Hourly - Compressed Backups
```bash
#!/bin/bash
# scripts/hourly-backup.sh
BACKUP_DIR="/var/backups/acme-training/hourly"
DB_FILE="/path/to/project/prisma/dev.db"
TIMESTAMP=$(date +%Y%m%d_%H00)

mkdir -p $BACKUP_DIR
cp $DB_FILE $BACKUP_DIR/hourly_backup_$TIMESTAMP.db
gzip $BACKUP_DIR/hourly_backup_$TIMESTAMP.db

# Keep 48 hours of backups
find $BACKUP_DIR -name "*.gz" -mtime +2 -delete

echo "✅ Hourly backup completed: $TIMESTAMP"
```

### Tier 3: External Drive Backups
**Physical backup to external drives for ultimate protection**

#### USB Drive Auto-Backup
```bash
#!/bin/bash
# scripts/usb-backup.sh
# Detects USB drives and creates backups

# Check for mounted USB drives
USB_DRIVES=$(lsblk -rpo "name,type,size,mountpoint" | awk '$2=="part"&&$4!=""&&$4~/\/media/{print $4}')

if [ -z "$USB_DRIVES" ]; then
    echo "⚠️  No USB drives detected"
    exit 1
fi

for USB_DRIVE in $USB_DRIVES; do
    BACKUP_DEST="$USB_DRIVE/acme-training-backups"
    mkdir -p "$BACKUP_DEST"
    
    # Copy database
    cp /path/to/project/prisma/dev.db "$BACKUP_DEST/database_$(date +%Y%m%d_%H%M%S).db"
    
    # Copy recent backups
    rsync -av /var/backups/acme-training/ "$BACKUP_DEST/"
    
    echo "✅ USB backup completed to: $BACKUP_DEST"
done
```

#### Network Attached Storage (NAS) Backup
```bash
#!/bin/bash
# scripts/nas-backup.sh
# Backup to local network storage

NAS_PATH="/mnt/nas/acme-training-backups"
SOURCE_DIR="/var/backups/acme-training"

# Check if NAS is accessible
if mount | grep -q "$NAS_PATH"; then
    rsync -av --delete $SOURCE_DIR/ $NAS_PATH/
    echo "✅ NAS backup completed"
else
    echo "⚠️  NAS not accessible, skipping backup"
fi
```

---

## 🌐 Internet Connectivity Recovery

### Connectivity Monitor & Auto-Sync
```javascript
// scripts/connectivity-monitor.js
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

class ConnectivityMonitor {
  constructor() {
    this.isOnline = false
    this.pendingUploads = []
    this.checkInterval = 30000 // 30 seconds
  }

  async checkConnectivity() {
    return new Promise((resolve) => {
      exec('ping -c 1 8.8.8.8', (error) => {
        resolve(!error)
      })
    })
  }

  async startMonitoring() {
    console.log('🌐 Starting connectivity monitoring...')
    
    setInterval(async () => {
      const wasOnline = this.isOnline
      this.isOnline = await this.checkConnectivity()
      
      if (!wasOnline && this.isOnline) {
        console.log('✅ Internet connection restored!')
        await this.syncPendingBackups()
      } else if (wasOnline && !this.isOnline) {
        console.log('⚠️  Internet connection lost!')
      }
    }, this.checkInterval)
  }

  async syncPendingBackups() {
    console.log('🔄 Syncing pending backups to cloud...')
    
    try {
      // Sync to Google Drive
      await this.syncToGoogleDrive()
      
      // Sync to other cloud providers
      await this.syncToDropbox()
      
      // Send notification email about restored connectivity
      await this.sendConnectivityAlert()
      
    } catch (error) {
      console.error('❌ Cloud sync failed:', error)
    }
  }

  async syncToGoogleDrive() {
    exec('rclone sync /var/backups/acme-training GoogleDrive:acme-training-backups', 
      (error, stdout, stderr) => {
        if (error) {
          console.error('Google Drive sync failed:', error)
        } else {
          console.log('✅ Google Drive sync completed')
        }
      })
  }

  async syncToDropbox() {
    exec('rclone sync /var/backups/acme-training Dropbox:acme-training-backups', 
      (error, stdout, stderr) => {
        if (error) {
          console.error('Dropbox sync failed:', error)
        } else {
          console.log('✅ Dropbox sync completed')
        }
      })
  }
}

// Start monitoring if run directly
if (require.main === module) {
  const monitor = new ConnectivityMonitor()
  monitor.startMonitoring()
}

module.exports = ConnectivityMonitor
```

### Offline Queue System
```javascript
// lib/offline-queue.js
class OfflineQueue {
  constructor() {
    this.queueFile = '/var/backups/acme-training/offline-queue.json'
    this.queue = this.loadQueue()
  }

  loadQueue() {
    try {
      if (fs.existsSync(this.queueFile)) {
        return JSON.parse(fs.readFileSync(this.queueFile, 'utf8'))
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error)
    }
    return []
  }

  saveQueue() {
    try {
      fs.writeFileSync(this.queueFile, JSON.stringify(this.queue, null, 2))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  addToQueue(operation, data) {
    this.queue.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      operation,
      data,
      retries: 0
    })
    this.saveQueue()
  }

  async processQueue() {
    for (const item of this.queue) {
      try {
        await this.executeOperation(item)
        this.removeFromQueue(item.id)
      } catch (error) {
        item.retries++
        if (item.retries >= 3) {
          console.error(`Queue item ${item.id} failed after 3 retries:`, error)
          this.removeFromQueue(item.id)
        }
      }
    }
    this.saveQueue()
  }

  async executeOperation(item) {
    switch (item.operation) {
      case 'EMAIL_REMINDER':
        await this.sendQueuedEmail(item.data)
        break
      case 'CLOUD_BACKUP':
        await this.uploadToCloud(item.data)
        break
      case 'SYNC_CHANGES':
        await this.syncDatabaseChanges(item.data)
        break
    }
  }

  removeFromQueue(id) {
    this.queue = this.queue.filter(item => item.id !== id)
  }
}
```

---

## 🔧 Emergency Backup Scripts

### Power Loss Emergency Backup
```bash
#!/bin/bash
# scripts/emergency-backup.sh
# Run this script on UPS power warning or system shutdown

echo "🚨 EMERGENCY BACKUP INITIATED"
echo "Timestamp: $(date)"

EMERGENCY_DIR="/var/backups/acme-training/emergency"
mkdir -p $EMERGENCY_DIR

# Immediate database backup
cp /path/to/project/prisma/dev.db $EMERGENCY_DIR/emergency_$(date +%Y%m%d_%H%M%S).db

# Backup recent files
tar -czf $EMERGENCY_DIR/emergency_files_$(date +%Y%m%d_%H%M%S).tar.gz \
  /path/to/project/uploads \
  /path/to/project/.env \
  /var/backups/acme-training/daily

# Copy to multiple locations if available
for BACKUP_LOC in "/media/usb" "/mnt/nas" "/tmp"; do
  if [ -d "$BACKUP_LOC" ] && [ -w "$BACKUP_LOC" ]; then
    cp -r $EMERGENCY_DIR $BACKUP_LOC/
    echo "✅ Emergency backup copied to: $BACKUP_LOC"
  fi
done

echo "🎉 Emergency backup completed"
```

### Data Recovery Script
```bash
#!/bin/bash
# scripts/recover-data.sh
# Recover data from backups after system failure

echo "🔄 ACME Training Data Recovery"
echo "=============================="

# List available backups
echo "Available backups:"
echo "1. Daily backups: $(ls -la /var/backups/acme-training/daily/ | wc -l) files"
echo "2. Hourly backups: $(ls -la /var/backups/acme-training/hourly/ | wc -l) files"
echo "3. Incremental backups: $(ls -la /var/backups/acme-training/incremental/ | wc -l) files"
echo "4. Emergency backups: $(ls -la /var/backups/acme-training/emergency/ | wc -l) files"

# Find most recent backup
LATEST_BACKUP=$(find /var/backups/acme-training -name "*.db" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

echo ""
echo "Most recent backup: $LATEST_BACKUP"
echo "Backup date: $(stat -c %y "$LATEST_BACKUP")"
echo ""

read -p "Restore from this backup? (y/N): " confirm
if [[ $confirm == [yY] ]]; then
    # Stop application
    echo "Stopping application..."
    pm2 stop acme-training 2>/dev/null || true
    
    # Backup current database (if exists)
    if [ -f "/path/to/project/prisma/dev.db" ]; then
        cp /path/to/project/prisma/dev.db /path/to/project/prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
        echo "Current database backed up"
    fi
    
    # Restore from backup
    cp "$LATEST_BACKUP" /path/to/project/prisma/dev.db
    echo "✅ Database restored from backup"
    
    # Start application
    echo "Starting application..."
    cd /path/to/project
    pm2 start ecosystem.config.js
    
    echo "🎉 Data recovery completed!"
else
    echo "Recovery cancelled"
fi
```

---

## 📅 Automated Backup Schedule

### Comprehensive Cron Setup
```bash
# Add to crontab: crontab -e

# Every 15 minutes - Incremental backup
*/15 * * * * /path/to/project/scripts/incremental-backup.sh >> /var/log/backup.log 2>&1

# Every hour - Compressed backup
0 * * * * /path/to/project/scripts/hourly-backup.sh >> /var/log/backup.log 2>&1

# Every 4 hours - USB backup (if available)
0 */4 * * * /path/to/project/scripts/usb-backup.sh >> /var/log/backup.log 2>&1

# Daily at 2 AM - Full backup
0 2 * * * /path/to/project/scripts/backup-database.js >> /var/log/backup.log 2>&1

# Daily at 3 AM - Data export
0 3 * * * /path/to/project/scripts/export-training-data.js >> /var/log/backup.log 2>&1

# Every 30 seconds - Connectivity check (during business hours)
* 8-18 * * 1-5 /usr/bin/node /path/to/project/scripts/connectivity-monitor.js

# Weekly - NAS sync
0 4 * * 0 /path/to/project/scripts/nas-backup.sh >> /var/log/backup.log 2>&1
```

---

## 🔋 UPS Integration

### UPS Monitoring Script
```bash
#!/bin/bash
# scripts/ups-monitor.sh
# Monitor UPS status and trigger emergency backup on power loss

# Check if UPS software is available (apcupsd, nut, etc.)
if command -v apcaccess &> /dev/null; then
    UPS_STATUS=$(apcaccess status | grep STATUS | awk '{print $3}')
    
    if [ "$UPS_STATUS" = "ONBATT" ]; then
        echo "⚡ UPS ON BATTERY - Starting emergency backup"
        /path/to/project/scripts/emergency-backup.sh
        
        # Send alert email if internet available
        if ping -c 1 8.8.8.8 &> /dev/null; then
            echo "UPS power failure detected at $(date)" | mail -s "ACME Training - Power Failure Alert" admin@acme-training.co.uk
        fi
    fi
fi
```

---

## 💾 Storage Recommendations

### Primary Storage
- **SSD drives** for faster backup operations
- **RAID 1** for drive redundancy
- **Regular drive health monitoring**

### Backup Storage
- **Multiple USB drives** rotated weekly
- **Network Attached Storage (NAS)** for local redundancy
- **Cloud storage** for offsite protection

### Emergency Storage
- **Portable SSD** kept offsite
- **Encrypted external drives**
- **Regular backup verification**

---

## 🎯 Implementation Checklist

### Immediate Setup (Do Today)
- [ ] Set up 15-minute incremental backups
- [ ] Configure emergency shutdown backup
- [ ] Test USB drive backup script
- [ ] Install UPS monitoring (if UPS available)
- [ ] Create recovery documentation

### Weekly Tasks
- [ ] Test data recovery procedure
- [ ] Verify all backup locations
- [ ] Check backup file integrity
- [ ] Update recovery documentation

### Monthly Tasks
- [ ] Full disaster recovery test
- [ ] Review storage capacity
- [ ] Update emergency contacts
- [ ] Audit backup security

---

## 🚨 Emergency Procedures

### Power Failure
1. **UPS kicks in** → Emergency backup starts automatically
2. **Battery low warning** → Manual emergency backup
3. **Power restored** → Verify data integrity
4. **Resume normal operations**

### Internet Outage
1. **Local backups continue** automatically
2. **Queue cloud operations** for later sync
3. **Monitor connectivity** every 30 seconds
4. **Auto-sync when restored**

### Hardware Failure
1. **Stop application** immediately
2. **Run recovery script** to find latest backup
3. **Restore to new hardware**
4. **Verify data integrity**
5. **Resume operations**

---

## 📧 Monitoring & Alerts

### Backup Health Monitoring
```bash
#!/bin/bash
# scripts/backup-health.sh
# Monitor backup system health

ALERT_EMAIL="admin@acme-training.co.uk"

# Check recent backups exist
if [ ! -f $(find /var/backups/acme-training/incremental -name "*.db" -mmin -20) ]; then
    echo "❌ No recent incremental backup found!" | mail -s "Backup Alert" $ALERT_EMAIL
fi

# Check disk space
DISK_USAGE=$(df /var/backups | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo "⚠️  Backup disk usage: ${DISK_USAGE}%" | mail -s "Disk Space Alert" $ALERT_EMAIL
fi

# Check cloud sync status
if [ -f /tmp/last_cloud_sync ]; then
    LAST_SYNC=$(cat /tmp/last_cloud_sync)
    HOURS_AGO=$(( ($(date +%s) - $LAST_SYNC) / 3600 ))
    
    if [ $HOURS_AGO -gt 24 ]; then
        echo "⚠️  Cloud sync last ran $HOURS_AGO hours ago" | mail -s "Cloud Sync Alert" $ALERT_EMAIL
    fi
fi
```

---

This offline backup strategy ensures your training center data is protected even during power cuts, internet outages, and hardware failures. The multi-tier approach provides redundancy at every level! 🛡️

**Key Benefits:**
- ✅ **15-minute data recovery point** maximum loss
- ✅ **Automatic power failure protection**
- ✅ **Offline operation capability**
- ✅ **Multiple backup locations**
- ✅ **Automatic cloud sync when restored**

**Last Updated**: September 2025  
**Priority**: 🚨 CRITICAL - IMPLEMENT IMMEDIATELY