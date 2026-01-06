#!/usr/bin/env node

/**
 * Training Data Export Script for ACME Training Centre
 * 
 * Exports all critical training center data to JSON format
 * Includes students, certifications, bookings, and system settings
 * 
 * Usage:
 *   node scripts/export-training-data.js
 * 
 * Cron Example (weekly export on Sundays at 3 AM):
 *   0 3 * * 0 cd /path/to/project && /usr/bin/node scripts/export-training-data.js >> /var/log/export.log 2>&1
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Configuration
const EXPORT_BASE_DIR = process.env.EXPORT_DIR || '/var/backups/acme-training'
const EXPORT_RETENTION_DAYS = 90 // Keep exports for 90 days

const prisma = new PrismaClient()

function createTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5) // YYYY-MM-DDTHH-MM-SS
}

function ensureExportDirectory() {
  const exportDir = path.join(EXPORT_BASE_DIR, 'exports')
  
  try {
    fs.mkdirSync(exportDir, { recursive: true })
    console.log(`📁 Export directory ready: ${exportDir}`)
    return exportDir
  } catch (error) {
    console.error(`❌ Failed to create export directory: ${error.message}`)
    throw error
  }
}

async function exportAllData() {
  try {
    console.log(`📤 Starting data export process...`)
    
    const exportTimestamp = new Date().toISOString()
    
    console.log(`🔄 Fetching data from database...`)
    
    // Export all critical data tables
    const data = {
      metadata: {
        exportTimestamp,
        exportVersion: '1.0',
        databaseType: 'SQLite',
        systemName: 'ACME Training Centre'
      },
      
      // Core data
      customers: await prisma.customer.findMany({
        include: {
          bookings: true,
          achievements: true,
          attendance: true
        }
      }),
      
      courses: await prisma.course.findMany({
        include: {
          sessions: true,
          achievements: true
        }
      }),
      
      courseSessions: await prisma.courseSession.findMany({
        include: {
          bookings: true,
          attendance: true
        }
      }),
      
      bookings: await prisma.booking.findMany({
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          course: {
            select: {
              title: true,
              category: true
            }
          }
        }
      }),
      
      achievements: await prisma.achievement.findMany({
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              company: true
            }
          },
          course: {
            select: {
              title: true,
              category: true
            }
          }
        }
      }),
      
      sessionAttendance: await prisma.sessionAttendance.findMany({
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          session: {
            select: {
              startDate: true,
              endDate: true,
              course: {
                select: {
                  title: true
                }
              }
            }
          }
        }
      }),
      
      certificationReminders: await prisma.certificationReminder.findMany({
        include: {
          achievement: {
            include: {
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              course: {
                select: {
                  title: true
                }
              }
            }
          }
        }
      }),
      
      // System configuration
      systemSettings: await prisma.systemSettings.findMany(),
      certificationRules: await prisma.certificationRule.findMany()
    }

    // Generate statistics
    const stats = {
      totalCustomers: data.customers.length,
      totalCourses: data.courses.length,
      totalSessions: data.courseSessions.length,
      totalBookings: data.bookings.length,
      totalCertifications: data.achievements.length,
      totalAttendanceRecords: data.sessionAttendance.length,
      totalReminders: data.certificationReminders.length,
      activeCertifications: data.achievements.filter(a => !a.isExpired).length,
      expiredCertifications: data.achievements.filter(a => a.isExpired).length,
      completedSessions: data.courseSessions.filter(s => s.isCompleted).length,
      pendingSessions: data.courseSessions.filter(s => !s.isCompleted).length
    }

    data.statistics = stats

    console.log(`📊 Data collection completed:`)
    console.log(`   👥 Customers: ${stats.totalCustomers}`)
    console.log(`   📚 Courses: ${stats.totalCourses}`)
    console.log(`   🎓 Certifications: ${stats.totalCertifications}`)
    console.log(`   📅 Sessions: ${stats.totalSessions}`)
    console.log(`   📝 Bookings: ${stats.totalBookings}`)

    return data

  } catch (error) {
    console.error(`❌ Data export failed: ${error.message}`)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

function saveExportData(data) {
  const timestamp = createTimestamp()
  const exportDir = ensureExportDirectory()
  const exportFileName = `acme_training_data_${timestamp}.json`
  const exportPath = path.join(exportDir, exportFileName)
  
  try {
    console.log(`💾 Saving export data...`)
    console.log(`📂 Destination: ${exportPath}`)
    
    // Write JSON data with pretty formatting
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), 'utf8')
    
    // Get file size
    const stats = fs.statSync(exportPath)
    const fileSizeMB = Math.round(stats.size / (1024 * 1024) * 100) / 100
    
    console.log(`✅ Export data saved successfully (${fileSizeMB} MB)`)
    
    // Compress the export
    console.log(`🗜️  Compressing export...`)
    execSync(`gzip "${exportPath}"`, { stdio: 'inherit' })
    
    const compressedPath = `${exportPath}.gz`
    const compressedStats = fs.statSync(compressedPath)
    const compressedSizeMB = Math.round(compressedStats.size / (1024 * 1024) * 100) / 100
    
    console.log(`✅ Export compressed successfully (${compressedSizeMB} MB)`)
    console.log(`🎉 Export completed: ${path.basename(compressedPath)}`)
    
    return compressedPath
    
  } catch (error) {
    console.error(`❌ Failed to save export data: ${error.message}`)
    throw error
  }
}

function cleanupOldExports() {
  const exportDir = path.join(EXPORT_BASE_DIR, 'exports')
  
  try {
    console.log(`🧹 Cleaning up old exports (keeping last ${EXPORT_RETENTION_DAYS} days)...`)
    
    if (!fs.existsSync(exportDir)) {
      console.log(`📁 No export directory found, skipping cleanup`)
      return
    }
    
    const files = fs.readdirSync(exportDir)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - EXPORT_RETENTION_DAYS)
    
    let deletedCount = 0
    
    files.forEach(file => {
      if (file.endsWith('.json.gz')) {
        const filePath = path.join(exportDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
          deletedCount++
          console.log(`🗑️  Deleted old export: ${file}`)
        }
      }
    })
    
    console.log(`✅ Cleanup completed: ${deletedCount} old exports removed`)
    
  } catch (error) {
    console.error(`⚠️  Cleanup failed: ${error.message}`)
    // Don't throw error for cleanup failures
  }
}

function generateExportReport() {
  const exportDir = path.join(EXPORT_BASE_DIR, 'exports')
  
  try {
    if (!fs.existsSync(exportDir)) {
      return
    }
    
    const files = fs.readdirSync(exportDir)
    const exportFiles = files.filter(f => f.endsWith('.json.gz'))
    
    console.log(`\n📊 Export Status Report:`)
    console.log(`   📁 Export Directory: ${exportDir}`)
    console.log(`   📦 Total Exports: ${exportFiles.length}`)
    
    if (exportFiles.length > 0) {
      const latestFile = exportFiles.sort().pop()
      const latestPath = path.join(exportDir, latestFile)
      const stats = fs.statSync(latestPath)
      
      console.log(`   📅 Latest Export: ${latestFile}`)
      console.log(`   ⏰ Created: ${stats.mtime.toLocaleString()}`)
      console.log(`   💾 Size: ${Math.round(stats.size / (1024 * 1024) * 100) / 100} MB`)
    }
    
  } catch (error) {
    console.error(`⚠️  Could not generate export report: ${error.message}`)
  }
}

async function main() {
  console.log(`🚀 ACME Training Centre - Data Export`)
  console.log(`🕐 Started at: ${new Date().toLocaleString()}`)
  console.log(`===============================================`)
  
  try {
    // Export all data
    const data = await exportAllData()
    
    // Save to file
    const exportPath = saveExportData(data)
    
    // Cleanup old exports
    cleanupOldExports()
    
    // Generate status report
    generateExportReport()
    
    console.log(`\n🎉 Data export process completed successfully!`)
    console.log(`📧 Consider syncing this export to cloud storage for additional protection`)
    
  } catch (error) {
    console.error(`\n💥 Data export process failed!`)
    console.error(`Error: ${error.message}`)
    console.error(`\n🔧 Troubleshooting:`)
    console.error(`1. Check database connectivity`)
    console.error(`2. Verify export directory permissions: ${EXPORT_BASE_DIR}`)
    console.error(`3. Ensure sufficient disk space`)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Export interrupted by user')
  await prisma.$disconnect()
  process.exit(1)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Export terminated')
  await prisma.$disconnect()
  process.exit(1)
})

// Run the export if this script is executed directly
if (require.main === module) {
  main()
}

module.exports = {
  exportAllData,
  saveExportData,
  cleanupOldExports,
  generateExportReport
}