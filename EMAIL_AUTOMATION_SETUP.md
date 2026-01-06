# 📧 Email Automation Setup Guide

## Overview
This guide shows you how to set up automated email reminders for certification renewals in your ACME Training Centre system.

## 🛠️ Prerequisites
- System running on server/hosting provider
- Access to admin panel
- Email provider account (Gmail, Outlook, or custom SMTP)

---

## 📋 Step 1: Configure SMTP Settings

### Access Admin Settings
1. **Navigate to**: `http://yourdomain.com/admin/settings`
2. **Login with**: `admin@acme-training.co.uk` / `admin123!`
3. **Scroll to**: "Email Configuration" section

### SMTP Configuration Options

#### Option A: Gmail Setup
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP Secure: Yes (TLS)
SMTP User: your-email@gmail.com
SMTP Password: your-app-password
```

**⚠️ Important for Gmail:**
- Use **App Password** (not regular password)
- Enable 2-Factor Authentication first
- Generate App Password: Google Account → Security → 2-Step Verification → App passwords

#### Option B: Outlook/Hotmail Setup
```
SMTP Host: smtp-mail.outlook.com
SMTP Port: 587
SMTP Secure: Yes (TLS)
SMTP User: your-email@outlook.com
SMTP Password: your-password
```

#### Option C: Custom SMTP (cPanel/Hosting Provider)
```
SMTP Host: mail.yourdomain.com
SMTP Port: 587 (or 465 for SSL)
SMTP Secure: Yes
SMTP User: noreply@yourdomain.com
SMTP Password: your-email-password
```

### Test Email Configuration
1. **Save settings** in admin panel
2. **Go to**: Certifications page
3. **Click mail icon** next to any certification
4. **Check**: Test email arrives successfully

---

## ⏰ Step 2: Set Up Daily Cron Job

### On Linux/Ubuntu Server

#### 1. Edit Crontab
```bash
crontab -e
```

#### 2. Add Daily Job (9 AM)
```bash
# Daily certification reminders at 9 AM
0 9 * * * /usr/bin/node /path/to/your/project/scripts/send-daily-reminders.js >> /var/log/acme-reminders.log 2>&1
```

#### 3. Alternative Times
```bash
# 8 AM daily
0 8 * * * /usr/bin/node /path/to/your/project/scripts/send-daily-reminders.js

# Twice daily (9 AM and 2 PM)
0 9,14 * * * /usr/bin/node /path/to/your/project/scripts/send-daily-reminders.js

# Weekdays only at 9 AM
0 9 * * 1-5 /usr/bin/node /path/to/your/project/scripts/send-daily-reminders.js
```

### On Windows Server

#### 1. Create Batch File (`daily-reminders.bat`)
```batch
@echo off
cd /d "C:\path\to\your\project"
node scripts\send-daily-reminders.js >> logs\reminders.log 2>&1
```

#### 2. Schedule with Task Scheduler
1. **Open**: Task Scheduler
2. **Create Basic Task**: "ACME Daily Reminders"
3. **Trigger**: Daily at 9:00 AM
4. **Action**: Start a program
5. **Program**: `C:\path\to\daily-reminders.bat`

### On cPanel/Shared Hosting

#### 1. Access Cron Jobs
- **Login** to cPanel
- **Find**: "Cron Jobs" in Advanced section

#### 2. Add New Cron Job
```
Minute: 0
Hour: 9
Day: *
Month: *
Weekday: *
Command: /usr/bin/node /home/username/public_html/scripts/send-daily-reminders.js
```

---

## 🧪 Step 3: Test the System

### Manual Test
```bash
# Run reminder job manually to test
node scripts/send-daily-reminders.js
```

### Create Test Data
1. **Complete a test session** with passing students
2. **Check certifications** are created with future expiry dates
3. **Manually trigger** reminder for testing
4. **Verify email** arrives at customer email address

### Monitor Logs
```bash
# View cron job logs
tail -f /var/log/acme-reminders.log

# Check system cron logs
tail -f /var/log/cron
```

---

## 📬 Step 4: Customize Email Templates

### Access Template Editor
1. **Navigate to**: `http://yourdomain.com/admin/email-templates`
2. **Edit existing** templates or create new ones

### Available Variables
Use these in your email templates:
- `{{customerName}}` - Full customer name
- `{{courseTitle}}` - Course title
- `{{courseCategory}}` - Course category
- `{{certificationDate}}` - Original cert date
- `{{expiryDate}}` - Expiry date
- `{{certificateNumber}}` - Certificate number
- `{{companyName}}` - Training centre name

### Template Types
- **6 Month Reminder**: Early notice
- **3 Month Reminder**: Standard notice  
- **1 Month Reminder**: Urgent notice
- **Expired Notice**: Post-expiry notification

---

## 📊 Step 5: Monitor System Performance

### Check Reminder Status
- **Admin Dashboard**: View pending reminders
- **Certifications Page**: See reminder counts
- **Email Templates**: Track template usage

### Verify Email Delivery
- **Check customer feedback** for received emails
- **Monitor bounce rates** in your email provider
- **Test with different email providers** (Gmail, Outlook, etc.)

### Database Monitoring
- **Reminder counts** should increment after sending
- **Next reminder dates** should update automatically
- **Expired certifications** should show correct status

---

## ❗ Troubleshooting

### Common Issues

#### Emails Not Sending
1. **Check SMTP settings** in admin panel
2. **Verify email provider** allows SMTP
3. **Test firewall** isn't blocking SMTP ports
4. **Check server logs** for error messages

#### Cron Job Not Running
1. **Verify crontab syntax** with online validators
2. **Check cron service** is running: `systemctl status cron`
3. **Test script manually** first
4. **Check file permissions** on script

#### Wrong Email Content
1. **Review template variables** for typos
2. **Check database data** is complete
3. **Test with sample customer** data
4. **Verify template selection** logic

### Log Locations
```bash
# Application logs
/var/log/acme-reminders.log

# System cron logs  
/var/log/cron
/var/log/syslog

# Email server logs (if self-hosted)
/var/log/mail.log
```

---

## 🔄 Reminder Schedule

### Default Timing
- **6 Months Before**: First gentle reminder
- **3 Months Before**: Standard reminder
- **1 Month Before**: Urgent reminder  
- **After Expiry**: Expired notification

### Certification Validity Periods
- **Gas Safe/OFTEC/Heat Pump**: 5 years
- **Electrical**: 3 years
- **Other**: 5 years (default)

---

## 🎯 Quick Setup Checklist

- [ ] Configure SMTP settings in admin panel
- [ ] Test email sending manually
- [ ] Set up daily cron job
- [ ] Create test certification
- [ ] Run manual reminder test
- [ ] Verify email delivery
- [ ] Monitor logs for errors
- [ ] Customize email templates
- [ ] Document server details for maintenance

---

## 📞 Support

For technical support with email automation:
- **Check logs** first for error messages
- **Test SMTP** settings with email provider
- **Verify cron** job syntax and permissions
- **Monitor database** for correct data

**System Requirements:**
- Node.js runtime environment
- Database access for Prisma
- SMTP server access
- Cron job capability

---

**Last Updated**: September 2025  
**Version**: 1.0  
**Status**: Production Ready ✅