#!/bin/bash

# Emergency Backup Script for ACME Training Centre
# 
# Triggered during power failures, system shutdown, or emergency situations
# Creates immediate backups to multiple locations for maximum data protection
#
# Usage: ./scripts/emergency-backup.sh
# SystemD: Called automatically on system shutdown
# UPS: Triggered by UPS low battery warning

set -euo pipefail  # Exit on any error

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_FILE="$PROJECT_ROOT/prisma/dev.db"
EMERGENCY_BASE_DIR="/var/backups/acme-training/emergency"
LOG_FILE="/var/log/emergency-backup.log"
MAX_EXECUTION_TIME=60  # Maximum 60 seconds for emergency backup

# Emergency backup locations (in order of preference)
BACKUP_LOCATIONS=(
    "/var/backups/acme-training/emergency"
    "/tmp/acme-emergency-backup"
    "/media/usb"
    "/mnt/nas"
    "/home/backup"
)

# Logging function
log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] EMERGENCY: $message" | tee -a "$LOG_FILE" 2>/dev/null || echo "[$timestamp] EMERGENCY: $message"
}

# Error handling with timeout protection
error_exit() {
    log "ERROR: $1"
    # Don't exit in emergency mode - try to continue with partial backup
    return 1
}

# Timeout handler
timeout_handler() {
    log "⏰ Emergency backup timeout reached - completing with available backups"
    exit 0
}

# Set up timeout protection
trap timeout_handler ALRM
(sleep $MAX_EXECUTION_TIME && kill -ALRM $$ 2>/dev/null) &
TIMEOUT_PID=$!

# Cleanup function
cleanup() {
    # Kill timeout process if still running
    kill $TIMEOUT_PID 2>/dev/null || true
    log "Emergency backup process completed"
}

trap cleanup EXIT

# Create timestamp for this emergency
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Main emergency backup function
emergency_backup() {
    log "🚨 EMERGENCY BACKUP INITIATED"
    log "Timestamp: $(date)"
    log "Process ID: $$"
    log "Max execution time: ${MAX_EXECUTION_TIME}s"
    log "Database: $DB_FILE"
    
    # Quick validation
    if [ ! -f "$DB_FILE" ]; then
        log "❌ Database file not found: $DB_FILE"
        return 1
    fi
    
    local db_size=$(du -h "$DB_FILE" 2>/dev/null | cut -f1 || echo "unknown")
    log "Database size: $db_size"
    
    local successful_backups=0
    local backup_attempts=0
    
    # Try to backup to multiple locations
    for location in "${BACKUP_LOCATIONS[@]}"; do
        backup_attempts=$((backup_attempts + 1))
        
        if create_emergency_backup_at_location "$location"; then
            successful_backups=$((successful_backups + 1))
            log "✅ Emergency backup #$successful_backups created at: $location"
        else
            log "❌ Failed to create backup at: $location"
        fi
        
        # If we have at least one successful backup and are running short on time, exit
        if [ $successful_backups -ge 1 ] && [ $backup_attempts -ge 2 ]; then
            log "⚡ Fast emergency backup mode - stopping with $successful_backups successful backups"
            break
        fi
    done
    
    # Additional quick actions
    create_quick_data_snapshot
    
    # Summary
    if [ $successful_backups -gt 0 ]; then
        log "🎉 Emergency backup completed: $successful_backups/$backup_attempts locations successful"
        return 0
    else
        log "💥 Emergency backup FAILED: No successful backups created"
        return 1
    fi
}

# Create backup at specific location
create_emergency_backup_at_location() {
    local location="$1"
    local backup_dir="$location/acme-emergency-$(date +%Y%m%d)"
    
    # Quick directory check/creation (with timeout)
    if ! timeout 5 mkdir -p "$backup_dir" 2>/dev/null; then
        return 1
    fi
    
    # Quick write test
    if ! timeout 2 touch "$backup_dir/.test" 2>/dev/null; then
        return 1
    fi
    rm -f "$backup_dir/.test" 2>/dev/null || true
    
    local backup_file="$backup_dir/emergency_db_$TIMESTAMP.db"
    
    # Fast copy with timeout
    if timeout 15 cp "$DB_FILE" "$backup_file" 2>/dev/null; then
        # Quick integrity check
        if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
            # Create emergency info file
            cat > "$backup_dir/emergency_info_$TIMESTAMP.txt" << EOF
ACME Training Centre - Emergency Backup
======================================
Backup Type: Emergency
Creation Time: $(date)
Emergency Trigger: ${EMERGENCY_TRIGGER:-Unknown}
Original Database: $DB_FILE
Original Size: $(du -h "$DB_FILE" 2>/dev/null | cut -f1 || echo "unknown")
Backup Size: $(du -h "$backup_file" 2>/dev/null | cut -f1 || echo "unknown")
System: $(uname -a 2>/dev/null || echo "unknown")
Process ID: $$

Recovery Instructions:
1. Stop the application: pm2 stop acme-training
2. Backup current database: cp prisma/dev.db prisma/dev.db.backup
3. Restore from this backup: cp $backup_file prisma/dev.db
4. Start application: pm2 start acme-training

Contact: admin@acme-training.co.uk
EOF
            return 0
        fi
    fi
    
    return 1
}

# Create quick data snapshot in JSON format
create_quick_data_snapshot() {
    log "📸 Creating quick data snapshot"
    
    # Only attempt if we have database tools and time
    if command -v sqlite3 >/dev/null 2>&1; then
        local snapshot_file="/tmp/acme_emergency_snapshot_$TIMESTAMP.txt"
        
        timeout 10 sqlite3 "$DB_FILE" << 'EOF' > "$snapshot_file" 2>/dev/null || true
.headers on
.mode column

SELECT 'CUSTOMERS' as table_name, COUNT(*) as count FROM Customer
UNION ALL
SELECT 'ACHIEVEMENTS' as table_name, COUNT(*) as count FROM Achievement
UNION ALL
SELECT 'SESSIONS' as table_name, COUNT(*) as count FROM CourseSession
UNION ALL
SELECT 'BOOKINGS' as table_name, COUNT(*) as count FROM Booking;

SELECT '=== RECENT ACHIEVEMENTS ===' as info;
SELECT 
    c.firstName || ' ' || c.lastName as customer,
    co.title as course,
    a.certificationDate,
    a.expiryDate
FROM Achievement a
JOIN Customer c ON a.customerId = c.id
JOIN Course co ON a.courseId = co.id
ORDER BY a.certificationDate DESC
LIMIT 10;

SELECT '=== RECENT SESSIONS ===' as info;
SELECT 
    co.title as course,
    cs.startDate,
    cs.endDate,
    cs.isCompleted,
    COUNT(b.id) as bookings
FROM CourseSession cs
JOIN Course co ON cs.courseId = co.id
LEFT JOIN Booking b ON b.sessionId = cs.id
GROUP BY cs.id
ORDER BY cs.startDate DESC
LIMIT 10;
EOF
        
        if [ -f "$snapshot_file" ] && [ -s "$snapshot_file" ]; then
            log "✅ Quick data snapshot created: $snapshot_file"
            
            # Try to copy snapshot to backup locations
            for location in "${BACKUP_LOCATIONS[@]:0:2}"; do  # Only first 2 locations for speed
                if [ -d "$location" ] && [ -w "$location" ]; then
                    cp "$snapshot_file" "$location/" 2>/dev/null && break
                fi
            done
        fi
    fi
}

# Quick system information gathering
gather_emergency_info() {
    local info_file="/tmp/acme_emergency_system_info_$TIMESTAMP.txt"
    
    {
        echo "ACME Training Centre - Emergency System Information"
        echo "================================================="
        echo "Time: $(date)"
        echo "Uptime: $(uptime 2>/dev/null || echo 'unknown')"
        echo "Disk Space:"
        df -h 2>/dev/null || echo "df command failed"
        echo ""
        echo "Memory:"
        free -h 2>/dev/null || echo "free command failed"
        echo ""
        echo "Processes:"
        ps aux | grep -E "(node|npm|acme)" | head -5 2>/dev/null || echo "ps command failed"
        echo ""
        echo "Network:"
        ping -c 1 8.8.8.8 2>/dev/null && echo "Internet: Available" || echo "Internet: Not available"
        echo ""
        echo "Database Status:"
        if [ -f "$DB_FILE" ]; then
            echo "Database file exists: Yes"
            echo "Database size: $(du -h "$DB_FILE" 2>/dev/null | cut -f1 || echo 'unknown')"
            echo "Last modified: $(stat -c %y "$DB_FILE" 2>/dev/null || echo 'unknown')"
        else
            echo "Database file exists: No"
        fi
    } > "$info_file" 2>/dev/null
    
    log "📋 System info gathered: $info_file"
}

# Handle different emergency triggers
handle_emergency_trigger() {
    case "${EMERGENCY_TRIGGER:-}" in
        "POWER_FAILURE")
            log "⚡ Emergency trigger: Power failure detected"
            ;;
        "SHUTDOWN")
            log "🔄 Emergency trigger: System shutdown"
            ;;
        "UPS_LOW_BATTERY")
            log "🔋 Emergency trigger: UPS low battery"
            ;;
        "MANUAL")
            log "👤 Emergency trigger: Manual execution"
            ;;
        *)
            log "❓ Emergency trigger: Unknown or unspecified"
            ;;
    esac
}

# Quick connectivity test
quick_connectivity_test() {
    log "🌐 Testing connectivity for potential cloud backup"
    
    if timeout 3 ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        log "✅ Internet connectivity available"
        
        # Quick attempt at cloud sync if tools available
        if command -v rclone >/dev/null 2>&1; then
            log "🔄 Attempting quick cloud sync"
            timeout 30 rclone copy /var/backups/acme-training GoogleDrive:acme-emergency-backups 2>/dev/null && 
            log "✅ Emergency cloud sync completed" || 
            log "⚠️ Emergency cloud sync failed or timed out"
        fi
    else
        log "❌ No internet connectivity - local backups only"
    fi
}

# Main execution
main() {
    # Set emergency trigger from environment or default
    EMERGENCY_TRIGGER="${EMERGENCY_TRIGGER:-MANUAL}"
    
    # Start emergency process
    handle_emergency_trigger
    gather_emergency_info
    
    # Perform emergency backup
    if emergency_backup; then
        log "🎉 Emergency backup process completed successfully"
        
        # Quick connectivity test and potential cloud backup
        quick_connectivity_test
        
        exit 0
    else
        log "💥 Emergency backup process failed"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "ACME Training Centre - Emergency Backup Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h        Show this help message"
        echo "  --test, -t        Test emergency backup system"
        echo "  --power-failure   Simulate power failure emergency"
        echo "  --shutdown        Simulate shutdown emergency"
        echo "  --ups-battery     Simulate UPS low battery emergency"
        echo ""
        echo "Environment variables:"
        echo "  EMERGENCY_TRIGGER   Set emergency trigger type"
        exit 0
        ;;
    --test|-t)
        log "🧪 Testing emergency backup system"
        EMERGENCY_TRIGGER="TEST"
        # Reduce timeout for testing
        MAX_EXECUTION_TIME=30
        main
        ;;
    --power-failure)
        EMERGENCY_TRIGGER="POWER_FAILURE"
        main
        ;;
    --shutdown)
        EMERGENCY_TRIGGER="SHUTDOWN"
        main
        ;;
    --ups-battery)
        EMERGENCY_TRIGGER="UPS_LOW_BATTERY"
        main
        ;;
    "")
        # No arguments - run normal emergency backup
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac