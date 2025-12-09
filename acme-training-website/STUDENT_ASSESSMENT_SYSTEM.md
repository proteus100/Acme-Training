# Student Assessment & Portfolio Update System

## Overview
Complete documentation for the individual student assessment logic and automatic portfolio update system in the Exeter Digital Training SaaS platform.

## Individual Student Assessment Fields

### Frontend Interface (`/admin/sessions/[sessionId]/complete/page.tsx`)

Each student row in the session completion interface contains:

| Field | Type | Description | Example Values |
|-------|------|-------------|----------------|
| **Attendance Status** | Dropdown | Student's attendance level | REGISTERED, ATTENDED, PARTIAL, ABSENT |
| **Days Attended** | Number Input | Days present out of total | 3/5, 5/5, 0/5 |
| **Result** | Radio Buttons | Pass/Fail determination | Pass ✓, Fail ✗ |
| **Grade** | Text Input | Letter/text grade (optional) | A, B, C, Distinction, Merit |
| **Notes** | Text Input | Individual assessment notes | "Excellent practical skills", "Late Day 2" |

### Frontend State Management

```javascript
// Individual student state tracking
const updateAttendance = (customerId, field, value) => {
  setAttendanceData(prev => prev.map(record => 
    record.customerId === customerId 
      ? { ...record, [field]: value }  // Only update this student
      : record
  ))
}
```

## Backend Processing Logic

### API Route: `/api/admin/sessions/[sessionId]/complete/route.ts`

When session is completed, for each student:

1. **Create SessionAttendance Record**
```javascript
const attendanceRecord = await tx.sessionAttendance.create({
  data: {
    sessionId,
    customerId,               // Individual student ID
    status,                   // Their attendance status
    attendedDays,            // Days they attended
    totalDays,               // Total session days
    passed,                  // Their pass/fail result
    grade,                   // Their individual grade
    notes,                   // Individual notes about them
    certificateIssued: passed || false
  }
})
```

2. **Generate Certificate (Only for Passing Students)**
```javascript
if (passed) {
  // Generate unique certificate number
  const certificateNumber = `${session.course.category}-${Date.now()}-${customerId.slice(-4)}`
  
  // Create Achievement record
  const achievement = await tx.achievement.upsert({
    where: {
      customerId_courseId: { customerId, courseId: session.courseId }
    },
    create: {
      customerId,
      courseId: session.courseId,
      sessionId,
      level: 'BRONZE',
      category: session.course.category,
      certificationDate: new Date(),
      expiryDate,
      certificateNumber
    }
  })
}
```

## Automatic Portfolio Update System

### How It Works

1. **Session Completion → Database Update**
   - Training center completes session
   - Student passes → `Achievement` record created automatically
   - Certificate number generated with expiry date

2. **Student Portfolio → Real-time Reflection**
   - Student logs into `/student/dashboard`
   - `/api/student/certifications` fetches latest achievements
   - New certificates appear immediately in portfolio

### Student Certifications API (`/api/student/certifications/route.ts`)

```javascript
// Fetch all achievements for logged-in student
const achievements = await prisma.achievement.findMany({
  where: { customerId: customer.id },
  include: {
    course: {
      select: { title: true, description: true, category: true }
    }
  },
  orderBy: { certificationDate: 'desc' }
})

// Transform to certification format with status
const certifications = achievements.map(achievement => {
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
  )
  
  let status = 'active'
  if (achievement.isExpired || daysUntilExpiry < 0) {
    status = 'expired'
  } else if (daysUntilExpiry <= 90) {
    status = 'expiring'
  }
  
  return {
    id: achievement.id,
    name: achievement.course?.title,
    issuedDate: issuedDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
    status,
    certificateUrl: `/certificates/${achievement.certificateNumber}.pdf`
  }
})
```

## Example Assessment Workflow

### Session: "Gas Safe Register Training" (5 days)

| Student | Attendance | Days | Result | Grade | Notes |
|---------|------------|------|--------|-------|-------|
| John Smith | ATTENDED | 5/5 | Pass ✓ | A | Excellent practical work |
| Sarah Jones | PARTIAL | 4/5 | Pass ✓ | B | Missed Day 3, caught up well |
| Mike Brown | ATTENDED | 5/5 | Fail ✗ | D | Theory exam failed, needs retake |
| Lisa Wilson | ABSENT | 0/5 | Fail ✗ | - | Family emergency, will reschedule |

### Results
- **John & Sarah**: Certificates auto-generated and appear in their portfolios immediately
- **Mike & Lisa**: No certificates issued, can rebook future sessions
- **Individual notes**: Stored for instructor reference and student records

## Database Schema

### SessionAttendance Model
```prisma
model SessionAttendance {
  id             String   @id @default(cuid())
  sessionId      String
  customerId     String
  status         String   // REGISTERED, ATTENDED, PARTIAL, ABSENT
  attendedDays   Int
  totalDays      Int
  passed         Boolean
  grade          String?
  notes          String?
  certificateIssued Boolean @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### Achievement Model
```prisma
model Achievement {
  id                String    @id @default(cuid())
  customerId        String
  courseId          String
  sessionId         String?
  level             String    // BRONZE, SILVER, GOLD
  category          String    // GAS_SAFE, HEAT_PUMP, etc.
  certificationDate DateTime
  expiryDate        DateTime?
  isExpired         Boolean   @default(false)
  certificateNumber String?
  remindersSent     Int       @default(0)
  nextReminderDate  DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

## Student Dashboard Features

### Real-time Portfolio Updates
- **Active Certifications Count** updates immediately after session completion
- **New Certificate Cards** appear with status indicators
- **Tier Progress** recalculates based on new qualifications
- **Certificate Downloads** available via generated URLs

### Status Indicators
- 🟢 **Active**: Certificate valid and current
- 🟡 **Expiring**: Within 90 days of expiry 
- 🔴 **Expired**: Past expiry date, needs renewal

## Notification System

### Current Implementation
```javascript
// Console logging for certificate issuance
console.log(`📧 Certificate notification sent to ${customer.email}`)

// Ready for email notifications (future enhancement)
// await sendCertificateNotification(customer, achievement)
```

### Future Enhancements
- Email notifications when certificates are issued
- SMS alerts for expiring certifications
- In-app notification badges
- Certificate reminder system

## Key Benefits

1. **Individual Tracking**: Each student assessed separately with custom notes
2. **Flexible Grading**: Training centers can use their own grading systems
3. **Automatic Certificates**: Only issued to passing students
4. **Real-time Updates**: Portfolios reflect changes immediately
5. **Audit Trail**: Complete record of attendance and assessment
6. **Status Management**: Tracks certificate validity and expiry

## Technical Flow Summary

```
Training Center Completes Session
           ↓
Individual Student Assessment (Pass/Fail + Notes)
           ↓
SessionAttendance Records Created (All Students)
           ↓
Achievement Records Created (Passing Students Only)
           ↓
Certificate Numbers Generated
           ↓
Student Logs Into Dashboard
           ↓
/api/student/certifications Fetches Latest Data
           ↓
Portfolio Updates Automatically
           ↓
New Certificates Visible Immediately
```

## Files Reference

### Frontend Components
- `/src/app/admin/sessions/[sessionId]/complete/page.tsx` - Session completion interface
- `/src/app/student/dashboard/page.tsx` - Student portfolio dashboard

### API Routes
- `/src/app/api/admin/sessions/[sessionId]/complete/route.ts` - Session completion logic
- `/src/app/api/student/certifications/route.ts` - Student certification fetching

### Database
- `/prisma/schema.prisma` - Database models and relationships

---

*This system provides a complete end-to-end solution for individual student assessment and automatic portfolio management in the multi-tenant training SaaS platform.*