#!/usr/bin/env node

/**
 * Data Backup and Migration Script for NextAuth Integration
 * 
 * Exports existing courses, customers, sessions, bookings, and other data
 * before database reset, then imports them into the new schema
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportCurrentData() {
  console.log('📤 Exporting current database data...')
  
  try {
    const data = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      
      // Core data
      courses: await prisma.course.findMany(),
      courseSessions: await prisma.courseSession.findMany(),
      customers: await prisma.customer.findMany(),
      bookings: await prisma.booking.findMany({
        include: {
          payments: true
        }
      }),
      achievements: await prisma.achievement.findMany(),
      sessionAttendance: await prisma.sessionAttendance.findMany(),
      
      // Admin and settings
      adminUsers: await prisma.adminUser.findMany(),
      systemSettings: await prisma.systemSettings.findMany(),
      certificationRules: await prisma.certificationRule.findMany(),
      certificationReminders: await prisma.certificationReminder.findMany(),
      emailTemplates: await prisma.emailTemplate.findMany()
    }

    // Write to backup file
    const backupPath = path.join(__dirname, '..', 'backups', `data_export_${Date.now()}.json`)
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2))
    
    console.log('✅ Data exported successfully:')
    console.log(`   📁 File: ${backupPath}`)
    console.log(`   📚 Courses: ${data.courses.length}`)
    console.log(`   👥 Customers: ${data.customers.length}`)
    console.log(`   📅 Sessions: ${data.courseSessions.length}`)
    console.log(`   📝 Bookings: ${data.bookings.length}`)
    console.log(`   🏆 Achievements: ${data.achievements.length}`)
    console.log(`   👨‍💼 Admin Users: ${data.adminUsers.length}`)
    
    return { data, backupPath }
    
  } catch (error) {
    console.error('❌ Export failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function importDataToNewSchema(backupPath) {
  console.log('📥 Importing data to new schema...')
  
  try {
    // Read backup data
    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
    console.log('📋 Backup data loaded:', Object.keys(data))
    
    // Create new Prisma client for new schema
    const newPrisma = new PrismaClient()
    
    // Import in dependency order
    console.log('🔄 Importing courses...')
    for (const course of data.courses) {
      await newPrisma.course.create({
        data: {
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          duration: course.duration,
          price: course.price,
          maxStudents: course.maxStudents,
          createdAt: new Date(course.createdAt),
          updatedAt: new Date(course.updatedAt)
        }
      })
    }
    
    console.log('🔄 Importing customers...')
    for (const customer of data.customers) {
      await newPrisma.customer.create({
        data: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          company: customer.company,
          address: customer.address,
          city: customer.city,
          postcode: customer.postcode,
          // New fields with defaults
          companySize: null,
          jobTitle: null,
          googleId: null,
          image: null,
          emailVerified: null,
          isActive: true,
          createdAt: new Date(customer.createdAt),
          updatedAt: new Date(customer.updatedAt)
        }
      })
    }
    
    console.log('🔄 Importing course sessions...')
    for (const session of data.courseSessions) {
      await newPrisma.courseSession.create({
        data: {
          id: session.id,
          courseId: session.courseId,
          startDate: new Date(session.startDate),
          endDate: new Date(session.endDate),
          startTime: session.startTime,
          endTime: session.endTime,
          availableSpots: session.availableSpots,
          bookedSpots: session.bookedSpots,
          isActive: session.isActive,
          isCompleted: session.isCompleted,
          completedAt: session.completedAt ? new Date(session.completedAt) : null,
          instructorNotes: session.instructorNotes,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        }
      })
    }
    
    console.log('🔄 Importing bookings...')
    for (const booking of data.bookings) {
      const createdBooking = await newPrisma.booking.create({
        data: {
          id: booking.id,
          customerId: booking.customerId,
          sessionId: booking.sessionId,
          status: booking.status,
          specialRequests: booking.specialRequests,
          totalAmount: booking.totalAmount,
          depositAmount: booking.depositAmount,
          createdAt: new Date(booking.createdAt),
          updatedAt: new Date(booking.updatedAt)
        }
      })
      
      // Import payments for this booking
      if (booking.payments && booking.payments.length > 0) {
        for (const payment of booking.payments) {
          await newPrisma.payment.create({
            data: {
              id: payment.id,
              bookingId: createdBooking.id,
              amount: payment.amount,
              status: payment.status,
              stripePaymentIntentId: payment.stripePaymentIntentId,
              paymentMethod: payment.paymentMethod,
              paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
              createdAt: new Date(payment.createdAt),
              updatedAt: new Date(payment.updatedAt)
            }
          })
        }
      }
    }
    
    console.log('🔄 Importing achievements...')
    for (const achievement of data.achievements) {
      await newPrisma.achievement.create({
        data: {
          id: achievement.id,
          customerId: achievement.customerId,
          courseId: achievement.courseId,
          sessionId: achievement.sessionId,
          achievedAt: new Date(achievement.achievedAt),
          level: achievement.level,
          category: achievement.category,
          certificationDate: new Date(achievement.certificationDate),
          expiryDate: achievement.expiryDate ? new Date(achievement.expiryDate) : null,
          isExpired: achievement.isExpired,
          remindersSent: achievement.remindersSent,
          nextReminderDate: achievement.nextReminderDate ? new Date(achievement.nextReminderDate) : null,
          certificateNumber: achievement.certificateNumber,
          createdAt: new Date(achievement.createdAt),
          updatedAt: new Date(achievement.updatedAt)
        }
      })
    }
    
    console.log('🔄 Importing session attendance...')
    for (const attendance of data.sessionAttendance) {
      await newPrisma.sessionAttendance.create({
        data: {
          id: attendance.id,
          sessionId: attendance.sessionId,
          customerId: attendance.customerId,
          status: attendance.status,
          attendedDays: attendance.attendedDays,
          totalDays: attendance.totalDays,
          passed: attendance.passed,
          grade: attendance.grade,
          notes: attendance.notes,
          certificateIssued: attendance.certificateIssued,
          createdAt: new Date(attendance.createdAt),
          updatedAt: new Date(attendance.updatedAt)
        }
      })
    }
    
    console.log('🔄 Importing admin users...')
    for (const admin of data.adminUsers) {
      await newPrisma.adminUser.create({
        data: {
          id: admin.id,
          email: admin.email,
          passwordHash: admin.passwordHash,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          isActive: admin.isActive,
          lastLoginAt: admin.lastLoginAt ? new Date(admin.lastLoginAt) : null,
          createdAt: new Date(admin.createdAt),
          updatedAt: new Date(admin.updatedAt)
        }
      })
    }
    
    console.log('🔄 Importing system settings...')
    for (const settings of data.systemSettings) {
      await newPrisma.systemSettings.create({
        data: {
          id: settings.id,
          companyName: settings.companyName,
          companyAddress: settings.companyAddress,
          companyPhone: settings.companyPhone,
          companyEmail: settings.companyEmail,
          companyWebsite: settings.companyWebsite,
          defaultMaxStudents: settings.defaultMaxStudents,
          defaultSessionLength: settings.defaultSessionLength,
          bookingWindowDays: settings.bookingWindowDays,
          cancellationHours: settings.cancellationHours,
          depositPercentage: settings.depositPercentage,
          emailNotificationsEnabled: settings.emailNotificationsEnabled,
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPassword: settings.smtpPassword,
          smtpSecure: settings.smtpSecure,
          createdAt: new Date(settings.createdAt),
          updatedAt: new Date(settings.updatedAt)
        }
      })
    }
    
    console.log('🔄 Importing certification rules...')
    for (const rule of data.certificationRules) {
      await newPrisma.certificationRule.create({
        data: {
          id: rule.id,
          category: rule.category,
          validityYears: rule.validityYears,
          reminderMonths: rule.reminderMonths,
          isActive: rule.isActive,
          createdAt: new Date(rule.createdAt),
          updatedAt: new Date(rule.updatedAt)
        }
      })
    }
    
    console.log('🔄 Importing email templates...')
    for (const template of data.emailTemplates) {
      await newPrisma.emailTemplate.create({
        data: {
          id: template.id,
          name: template.name,
          category: template.category,
          reminderType: template.reminderType,
          subject: template.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
          isActive: template.isActive,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt)
        }
      })
    }
    
    console.log('🔄 Importing certification reminders...')
    for (const reminder of data.certificationReminders) {
      await newPrisma.certificationReminder.create({
        data: {
          id: reminder.id,
          achievementId: reminder.achievementId,
          reminderType: reminder.reminderType,
          scheduledFor: new Date(reminder.scheduledFor),
          sentAt: reminder.sentAt ? new Date(reminder.sentAt) : null,
          emailSent: reminder.emailSent,
          smsSent: reminder.smsSent,
          emailSubject: reminder.emailSubject,
          emailContent: reminder.emailContent,
          createdAt: new Date(reminder.createdAt),
          updatedAt: new Date(reminder.updatedAt)
        }
      })
    }
    
    console.log('✅ Data import completed successfully!')
    
    await newPrisma.$disconnect()
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--export')) {
    const { backupPath } = await exportCurrentData()
    console.log(`\n📋 Next steps:`)
    console.log(`1. Reset database: npx prisma migrate reset --force`)
    console.log(`2. Import data: node scripts/backup-data-migration.js --import ${backupPath}`)
    return
  }
  
  if (args.includes('--import')) {
    const backupPath = args[args.indexOf('--import') + 1]
    if (!backupPath) {
      console.error('❌ Please provide backup file path')
      process.exit(1)
    }
    await importDataToNewSchema(backupPath)
    return
  }
  
  console.log('Usage:')
  console.log('  Export: node scripts/backup-data-migration.js --export')
  console.log('  Import: node scripts/backup-data-migration.js --import <backup-file>')
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { exportCurrentData, importDataToNewSchema }