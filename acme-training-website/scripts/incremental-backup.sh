#!/bin/bash

# Incremental Backup Script for ACME Training Centre
# 
# Creates quick incremental backups every 15 minutes to protect against
# power failures and system crashes. Keeps local copies independent of internet.
#
# Usage: ./scripts/incremental-backup.sh
# Cron: */15 * * * * /path/to/project/scripts/incremental-backup.sh >> /var/log/backup.log 2>&1

set -euo pipefail  # Exit on any error

# Configuration
BACKUP_RETENTION_COUNT=100  # Keep last 100 incremental backups (25 hours)
BACKUP_BASE_DIR="${BACKUP_DIR:-/var/backups/acme-training}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_FILE="$PROJECT_ROOT/prisma/dev.db"
LOG_FILE="/var/log/backup.log"

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M)
BACKUP_DIR="$BACKUP_BASE_DIR/incremental"

# Logging function
log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] INCREMENTAL: $message" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    # Add cleanup code here if needed
}

# Set up signal handlers
trap cleanup EXIT
trap 'error_exit "Script interrupted"' INT TERM

# Main backup function
main() {
    log "🔄 Starting incremental backup process"
    log "Database: $DB_FILE"
    log "Backup destination: $BACKUP_DIR"
    
    # Create backup directory
    if ! mkdir -p "$BACKUP_DIR"; then
        error_exit "Failed to create backup directory: $BACKUP_DIR"
    fi
    
    # Check if database file exists
    if [ ! -f "$DB_FILE" ]; then
        error_exit "Database file not found: $DB_FILE"
    fi
    
    # Get database file size for logging
    DB_SIZE=$(du -h "$DB_FILE" | cut -f1)
    log "Database size: $DB_SIZE"
    
    # Create backup filename
    BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.db"
    
    # Create backup
    log "Creating backup: $(basename "$BACKUP_FILE")"
    if ! cp "$DB_FILE" "$BACKUP_FILE"; then
        error_exit "Failed to create backup file"
    fi
    
    # Verify backup was created successfully
    if [ ! -f "$BACKUP_FILE" ]; then
        error_exit "Backup file was not created successfully"
    fi
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup created successfully: $BACKUP_SIZE"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Report backup status
    report_backup_status
    
    log "✅ Incremental backup completed successfully"
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "🧹 Cleaning up old incremental backups (keeping last $BACKUP_RETENTION_COUNT)"
    
    cd "$BACKUP_DIR" || error_exit "Cannot access backup directory"
    
    # Count existing backups
    BACKUP_COUNT=$(find . -name "db_backup_*.db" -type f | wc -l)
    log "Current backup count: $BACKUP_COUNT"
    
    if [ "$BACKUP_COUNT" -gt "$BACKUP_RETENTION_COUNT" ]; then
        # Calculate how many to delete
        DELETE_COUNT=$((BACKUP_COUNT - BACKUP_RETENTION_COUNT))
        log "Deleting $DELETE_COUNT old backups"
        
        # Delete oldest backups
        find . -name "db_backup_*.db" -type f -printf '%T@ %p\n' | \
            sort -n | \
            head -n "$DELETE_COUNT" | \
            cut -d' ' -f2- | \
            while read -r file; do
                if rm "$file"; then
                    log "🗑️  Deleted old backup: $(basename "$file")"
                else
                    log "⚠️  Failed to delete: $(basename "$file")"
                fi
            done
    else
        log "No cleanup needed (backup count: $BACKUP_COUNT)"
    fi
}

# Function to report backup status
report_backup_status() {
    local total_backups=$(find "$BACKUP_DIR" -name "db_backup_*.db" -type f | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "unknown")
    local oldest_backup=$(find "$BACKUP_DIR" -name "db_backup_*.db" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | head -n1 | cut -d' ' -f2- | xargs basename 2>/dev/null || echo "none")
    local newest_backup=$(find "$BACKUP_DIR" -name "db_backup_*.db" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -n1 | cut -d' ' -f2- | xargs basename 2>/dev/null || echo "none")
    
    log "📊 Backup Status Report:"
    log "   Total incremental backups: $total_backups"
    log "   Total backup directory size: $total_size"
    log "   Oldest backup: $oldest_backup"
    log "   Newest backup: $newest_backup"
}

# Check for required commands
check_dependencies() {
    local missing_deps=()
    
    for cmd in cp du find; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error_exit "Missing required commands: ${missing_deps[*]}"
    fi
}

# Health check function
health_check() {
    log "🏥 Performing backup system health check"
    
    # Check disk space
    local backup_disk_usage
    backup_disk_usage=$(df "$BACKUP_BASE_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$backup_disk_usage" -gt 90 ]; then
        log "⚠️  WARNING: Backup disk usage is ${backup_disk_usage}%"
        # Optionally send alert or take action
    else
        log "✅ Backup disk usage: ${backup_disk_usage}%"
    fi
    
    # Check backup directory permissions
    if [ ! -w "$BACKUP_DIR" ]; then
        error_exit "Backup directory is not writable: $BACKUP_DIR"
    fi
    
    # Check if database is locked (SQLite specific)
    if command -v sqlite3 >/dev/null 2>&1; then
        if ! sqlite3 "$DB_FILE" "SELECT 1;" >/dev/null 2>&1; then
            log "⚠️  WARNING: Database appears to be locked or corrupted"
        fi
    fi
}

# Function to create backup verification checksum
create_checksum() {
    local backup_file="$1"
    local checksum_file="${backup_file}.sha256"
    
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$backup_file" > "$checksum_file"
        log "📝 Created checksum: $(basename "$checksum_file")"
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$backup_file" > "$checksum_file"
        log "📝 Created checksum: $(basename "$checksum_file")"
    else
        log "⚠️  No checksum tool available (sha256sum or shasum)"
    fi
}

# Enhanced main function with additional checks
enhanced_main() {
    log "🚀 ACME Training Centre - Incremental Backup"
    log "Started at: $(date)"
    log "Process ID: $$"
    
    # Check dependencies
    check_dependencies
    
    # Health check
    health_check
    
    # Run main backup process
    main
    
    # Create verification checksum for the latest backup
    if [ -f "$BACKUP_FILE" ]; then
        create_checksum "$BACKUP_FILE"
    fi
    
    # Update status file for monitoring
    echo "{\"lastBackup\":\"$(date -Iseconds)\",\"status\":\"success\",\"backupFile\":\"$(basename "$BACKUP_FILE")\"}" > "/tmp/acme_incremental_backup_status"
    
    log "🎉 Incremental backup process completed successfully"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "ACME Training Centre - Incremental Backup Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --status, -s   Show backup status"
        echo "  --test, -t     Test backup system"
        echo "  --cleanup, -c  Clean up old backups only"
        echo ""
        echo "Environment variables:"
        echo "  BACKUP_DIR     Base backup directory (default: /var/backups/acme-training)"
        exit 0
        ;;
    --status|-s)
        if [ -d "$BACKUP_DIR" ]; then
            echo "📊 Incremental Backup Status:"
            echo "   Backup directory: $BACKUP_DIR"
            echo "   Total backups: $(find "$BACKUP_DIR" -name "db_backup_*.db" 2>/dev/null | wc -l)"
            echo "   Directory size: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)"
            echo "   Latest backup: $(find "$BACKUP_DIR" -name "db_backup_*.db" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2- | xargs basename 2>/dev/null || echo "none")"
        else
            echo "❌ Backup directory does not exist: $BACKUP_DIR"
        fi
        exit 0
        ;;
    --test|-t)
        log "🧪 Testing incremental backup system"
        check_dependencies
        health_check
        log "✅ Backup system test completed"
        exit 0
        ;;
    --cleanup|-c)
        log "🧹 Running cleanup only"
        mkdir -p "$BACKUP_DIR"
        cleanup_old_backups
        exit 0
        ;;
    "")
        # No arguments - run normal backup
        enhanced_main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac