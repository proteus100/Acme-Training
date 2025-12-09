#!/usr/bin/env node

/**
 * Daily Certification Reminder Script
 * 
 * This script is designed to be run daily via cron job to send
 * automated certification renewal reminders to customers.
 * 
 * Usage:
 *   node scripts/send-daily-reminders.js
 * 
 * Cron Examples:
 *   # Daily at 9 AM
 *   0 9 * * * cd /path/to/project && /usr/bin/node scripts/send-daily-reminders.js >> /var/log/acme-reminders.log 2>&1
 *   
 *   # Twice daily (9 AM and 2 PM)
 *   0 9,14 * * * cd /path/to/project && /usr/bin/node scripts/send-daily-reminders.js >> /var/log/acme-reminders.log 2>&1
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🚀 Starting daily certification reminder job...')
console.log('📅 Date:', new Date().toISOString())
console.log('📂 Working directory:', process.cwd())

async function runReminderJob() {
  try {
    console.log('📧 Running bulk certification reminders...')
    
    // Use ts-node to run TypeScript directly without building
    const command = `npx ts-node --project tsconfig.json -e "
      import { sendBulkCertificationReminders } from './src/lib/email-service';
      
      async function runJob() {
        console.log('🔄 Starting bulk reminder process...');
        await sendBulkCertificationReminders();
        console.log('✅ Bulk reminder process completed successfully');
      }
      
      runJob().catch((error) => {
        console.error('❌ Reminder job failed:', error);
        process.exit(1);
      });
    "`
    
    execSync(command, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      timeout: 300000 // 5 minute timeout
    })
    
    console.log('🎉 Daily certification reminder job completed successfully!')
    
  } catch (error) {
    console.error('❌ Daily certification reminder job failed!')
    console.error('Error details:', error.message)
    console.error('🔧 Troubleshooting:')
    console.error('1. Check SMTP settings in admin panel')
    console.error('2. Verify database connectivity')
    console.error('3. Check email service configuration')
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

// Run the reminder job
runReminderJob()