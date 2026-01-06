#!/usr/bin/env node

/**
 * Database Backup Script for ACME Training Centre
 * 
 * Creates compressed backups of the SQLite database with timestamps
 * Automatically cleans up old backups based on retention policy
 * 
 * Usage:
 *   node scripts/backup-database.js
 * 
 * Cron Example (daily at 2 AM):
 *   0 2 * * * cd /path/to/project && /usr/bin/node scripts/backup-database.js >> /var/log/backup.log 2>&1
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Configuration
const BACKUP_RETENTION_DAYS = 30 // Keep backups for 30 days
const BACKUP_BASE_DIR = process.env.BACKUP_DIR || '/var/backups/acme-training'
const PROJECT_ROOT = path.join(__dirname, '..')
const DB_PATH = path.join(PROJECT_ROOT, 'prisma', 'dev.db')

function createTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5) // YYYY-MM-DDTHH-MM-SS
}

function ensureBackupDirectory() {
  const backupDir = path.join(BACKUP_BASE_DIR, 'database')
  
  try {
    fs.mkdirSync(backupDir, { recursive: true })
    console.log(`📁 Backup directory ready: ${backupDir}`)
    return backupDir
  } catch (error) {
    console.error(`❌ Failed to create backup directory: ${error.message}`)
    throw error
  }
}

function backupDatabase() {
  const timestamp = createTimestamp()
  const backupDir = ensureBackupDirectory()
  const backupFileName = `acme_database_${timestamp}.db`
  const backupPath = path.join(backupDir, backupFileName)
  
  try {
    console.log(`🔄 Starting database backup...`)
    console.log(`📂 Source: ${DB_PATH}`)
    console.log(`💾 Destination: ${backupPath}`)
    
    // Check if source database exists
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Database file not found: ${DB_PATH}`)
    }
    
    // Copy database file
    fs.copyFileSync(DB_PATH, backupPath)
    
    // Get file size for verification
    const stats = fs.statSync(backupPath)
    const fileSizeKB = Math.round(stats.size / 1024)
    
    console.log(`✅ Database copied successfully (${fileSizeKB} KB)`)
    
    // Compress the backup
    console.log(`🗜️  Compressing backup...`)
    execSync(`gzip "${backupPath}"`, { stdio: 'inherit' })
    
    const compressedPath = `${backupPath}.gz`
    const compressedStats = fs.statSync(compressedPath)
    const compressedSizeKB = Math.round(compressedStats.size / 1024)
    
    console.log(`✅ Backup compressed successfully (${compressedSizeKB} KB)`)
    console.log(`🎉 Backup completed: ${path.basename(compressedPath)}`)
    
    return compressedPath
    
  } catch (error) {
    console.error(`❌ Database backup failed: ${error.message}`)
    throw error
  }
}

function cleanupOldBackups() {
  const backupDir = path.join(BACKUP_BASE_DIR, 'database')
  
  try {
    console.log(`🧹 Cleaning up old backups (keeping last ${BACKUP_RETENTION_DAYS} days)...`)
    
    if (!fs.existsSync(backupDir)) {
      console.log(`📁 No backup directory found, skipping cleanup`)
      return
    }
    
    const files = fs.readdirSync(backupDir)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS)
    
    let deletedCount = 0
    
    files.forEach(file => {
      if (file.endsWith('.db.gz')) {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
          deletedCount++
          console.log(`🗑️  Deleted old backup: ${file}`)
        }
      }
    })
    
    console.log(`✅ Cleanup completed: ${deletedCount} old backups removed`)
    
  } catch (error) {
    console.error(`⚠️  Cleanup failed: ${error.message}`)
    // Don't throw error for cleanup failures - backup is still successful
  }
}

function generateBackupReport() {
  const backupDir = path.join(BACKUP_BASE_DIR, 'database')
  
  try {
    if (!fs.existsSync(backupDir)) {
      return
    }
    
    const files = fs.readdirSync(backupDir)
    const backupFiles = files.filter(f => f.endsWith('.db.gz'))
    
    console.log(`\n📊 Backup Status Report:`)
    console.log(`   📁 Backup Directory: ${backupDir}`)
    console.log(`   📦 Total Backups: ${backupFiles.length}`)
    
    if (backupFiles.length > 0) {
      const latestFile = backupFiles.sort().pop()
      const latestPath = path.join(backupDir, latestFile)
      const stats = fs.statSync(latestPath)
      
      console.log(`   📅 Latest Backup: ${latestFile}`)
      console.log(`   ⏰ Created: ${stats.mtime.toLocaleString()}`)
      console.log(`   💾 Size: ${Math.round(stats.size / 1024)} KB`)
    }
    
  } catch (error) {
    console.error(`⚠️  Could not generate backup report: ${error.message}`)
  }
}

function main() {
  console.log(`🚀 ACME Training Centre - Database Backup`)
  console.log(`🕐 Started at: ${new Date().toLocaleString()}`)
  console.log(`===============================================`)
  
  try {
    // Perform backup
    const backupPath = backupDatabase()
    
    // Cleanup old backups
    cleanupOldBackups()
    
    // Generate status report
    generateBackupReport()
    
    console.log(`\n🎉 Database backup process completed successfully!`)
    console.log(`📧 You may want to sync this backup to cloud storage`)
    
  } catch (error) {
    console.error(`\n💥 Database backup process failed!`)
    console.error(`Error: ${error.message}`)
    console.error(`\n🔧 Troubleshooting:`)
    console.error(`1. Check database file exists: ${DB_PATH}`)
    console.error(`2. Verify backup directory permissions: ${BACKUP_BASE_DIR}`)
    console.error(`3. Ensure sufficient disk space`)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Backup interrupted by user')
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Backup terminated')
  process.exit(1)
})

// Run the backup if this script is executed directly
if (require.main === module) {
  main()
}

module.exports = {
  backupDatabase,
  cleanupOldBackups,
  generateBackupReport
}