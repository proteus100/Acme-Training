#!/usr/bin/env node

/**
 * Test Email Reminder Script
 * 
 * Use this script to test the email reminder system manually
 * before setting up the automated cron job.
 * 
 * Usage:
 *   node scripts/test-email-reminders.js
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🧪 Testing Email Reminder System')
console.log('================================')

async function runTest() {
  try {
    console.log('📧 Running email reminder test...\n')
    
    // Use ts-node to run TypeScript directly
    const command = `npx ts-node --project tsconfig.json -e "
      import { sendBulkCertificationReminders } from './src/lib/email-service';
      
      async function test() {
        console.log('🔄 Starting email reminder test...');
        await sendBulkCertificationReminders();
        console.log('✅ Test completed successfully!');
      }
      
      test().catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
      });
    "`
    
    execSync(command, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      timeout: 60000 // 1 minute timeout
    })
    
    console.log('\n✅ Email reminder test completed successfully!')
    console.log('\n📋 Next Steps:')
    console.log('1. Check your SMTP settings in the admin panel')
    console.log('2. Verify test emails were sent (if any certifications are due)')
    console.log('3. Set up the daily cron job using the EMAIL_AUTOMATION_SETUP.md guide')
    
  } catch (error) {
    console.error('\n❌ Email reminder test failed!')
    console.error('Error:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check your SMTP settings in http://localhost:3000/admin/settings')
    console.log('2. Ensure database has some test certifications')
    console.log('3. Verify email service configuration')
    process.exit(1)
  }
}

runTest()