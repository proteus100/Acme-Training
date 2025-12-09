# 📚 Complete Booking Flow Reference

## Overview
This document explains how the complete booking system works in the multi-tenant training center platform, from session creation to payment processing.

## 🏗️ System Architecture

### Database Models
```
Tenant (Training Center)
├── Course (Gas Safe Training, Heat Pump, etc.)
│   ├── CourseSession (Specific dates/times)
│   │   ├── Booking (Student enrollments)
│   │   │   └── Payment (Stripe transactions)
│   │   └── SessionAttendance (Who attended)
│   └── Achievement (Certificates)
└── Customer (Students)
```

## 🔄 Complete Booking Flow

### Phase 1: Admin Setup (Training Center)

**1. Admin creates courses**
- URL: `/bristol-gas-training/admin/courses`
- Creates course templates with pricing, duration, capacity
- Course exists but no bookings possible yet

**2. Admin creates sessions** ✨ *NEW FUNCTIONALITY*
- URL: `/bristol-gas-training/admin/courses/{courseId}/sessions`
- Schedules specific dates, times, and capacity for each course
- Sets instructor notes and availability

**3. Sessions become bookable**
- Public website shows available sessions
- Customers can see dates, times, and available spots

### Phase 2: Customer Booking (Public Website)

**4. Customer browses courses**
- Visits: `/bristol-gas-training` (public site)
- Sees courses with available sessions
- Filters by category, date, location

**5. Customer selects session**
- Chooses specific date/time
- Sees pricing, duration, availability
- Reviews course details and requirements

**6. Customer creates account/signs in**
- Provides personal details
- Company information (if applicable)
- Contact details for certificates

**7. Customer makes booking**
- Creates booking record (status: PENDING)
- Session's `bookedSpots` increases by 1
- Customer receives booking confirmation

### Phase 3: Payment Processing

**8. Stripe payment integration**
- Customer enters payment details
- Supports full payment or deposit options
- Creates Payment record with `stripePaymentIntentId`

**9. Payment confirmation**
- Payment status: PENDING → PAID
- Booking status: PENDING → CONFIRMED
- Customer receives payment receipt
- Admin gets booking notification

### Phase 4: Session Management

**10. Pre-session management**
- Admin can see all bookings for session
- Send reminders to customers
- Update session details if needed
- Handle cancellations/refunds

**11. Session delivery**
- Mark session as completed
- Record attendance
- Add instructor notes
- Update student records

**12. Post-session**
- Issue certificates/achievements
- Process final payments
- Collect feedback
- Update session status to completed

## 🛠️ Technical Implementation

### API Endpoints

#### Session Management
```
GET    /api/tenant/{slug}/courses/{courseId}/sessions
POST   /api/tenant/{slug}/courses/{courseId}/sessions
GET    /api/tenant/{slug}/courses/{courseId}/sessions/{sessionId}
PATCH  /api/tenant/{slug}/courses/{courseId}/sessions/{sessionId}
DELETE /api/tenant/{slug}/courses/{courseId}/sessions/{sessionId}
```

#### Booking Management
```
GET    /api/tenant/{slug}/bookings
POST   /api/tenant/{slug}/bookings
GET    /api/tenant/{slug}/bookings/{bookingId}
PATCH  /api/tenant/{slug}/bookings/{bookingId}
```

#### Customer Management
```
GET    /api/tenant/{slug}/students
POST   /api/tenant/{slug}/students
```

### Key Database Fields

#### CourseSession
- `startDate`, `endDate` - Session dates
- `startTime`, `endTime` - Daily schedule  
- `availableSpots` - Maximum capacity
- `bookedSpots` - Current bookings (auto-calculated)
- `isActive` - Can accept bookings
- `isCompleted` - Session finished
- `instructorNotes` - Internal notes

#### Booking
- `sessionId` - Links to specific session
- `customerId` - Student information
- `status` - PENDING/CONFIRMED/CANCELLED
- `totalAmount` - Full course price
- `depositAmount` - Partial payment option
- `specialRequests` - Student notes

#### Payment
- `bookingId` - Links to booking
- `stripePaymentIntentId` - Stripe integration
- `status` - PENDING/PAID/FAILED/REFUNDED
- `paymentMethod` - Card/bank transfer
- `paidAt` - Completion timestamp

## 📋 Admin Workflows

### Creating a New Session
1. Navigate to course management
2. Click "Manage Sessions" on desired course
3. Click "Create Session"
4. Fill in dates, times, capacity
5. Add instructor notes (optional)
6. Save session

### Managing Bookings
1. View session details
2. See all customer bookings
3. Check payment status
4. Send notifications
5. Handle cancellations

### Session Completion
1. Mark session as completed
2. Record attendance
3. Issue certificates
4. Update customer records

## 🎯 Customer Experience

### Booking a Course
1. Browse available courses
2. Select preferred session date/time
3. Review course details and pricing
4. Create account or sign in
5. Enter booking details
6. Make payment via Stripe
7. Receive confirmation email
8. Attend training session

### Payment Options
- **Full Payment**: Pay complete course fee upfront
- **Deposit**: Pay 30% deposit, remainder before session
- **Company Billing**: Invoice company directly

## 🔐 Security & Validation

### Tenant Isolation
- All data filtered by `tenantId`
- No cross-tenant data access
- Secure API routes with authentication

### Booking Validation
- Check session capacity before booking
- Prevent double-bookings
- Validate payment amounts
- Ensure session is still active

### Payment Security
- Stripe handles all card data
- PCI compliance maintained
- Secure webhook handling
- Fraud prevention

## 📊 Reporting & Analytics

### Admin Dashboard Stats
- Total courses and sessions
- Booking revenue and trends
- Student enrollment numbers
- Session completion rates

### Financial Reporting
- Payment status tracking
- Outstanding amounts
- Refund management
- Revenue by course/period

## 🚀 Testing the Flow

### 1. Create Test Session
```bash
curl -X POST "http://localhost:3000/api/tenant/bristol-gas-training/courses/{courseId}/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-01-15",
    "endDate": "2025-01-17", 
    "startTime": "09:00",
    "endTime": "17:00",
    "availableSpots": 12,
    "instructorNotes": "Bring safety equipment"
  }'
```

### 2. Create Test Booking  
```bash
curl -X POST "http://localhost:3000/api/tenant/bristol-gas-training/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "{customerId}",
    "sessionId": "{sessionId}",
    "specialRequests": "Dietary requirements",
    "depositPercentage": 0.3
  }'
```

### 3. View Session Details
```bash
curl "http://localhost:3000/api/tenant/bristol-gas-training/courses/{courseId}/sessions/{sessionId}"
```

## 🎯 Key URLs for Testing

### Admin URLs
- **Courses**: `http://localhost:3000/bristol-gas-training/admin/courses`
- **Sessions**: `http://localhost:3000/bristol-gas-training/admin/courses/{courseId}/sessions`
- **Dashboard**: `http://localhost:3000/bristol-gas-training/admin`
- **Bookings**: `http://localhost:3000/bristol-gas-training/admin/bookings`
- **Students**: `http://localhost:3000/bristol-gas-training/admin/students`

### Public URLs  
- **Home**: `http://localhost:3000/bristol-gas-training`
- **Courses**: `http://localhost:3000/bristol-gas-training/courses`
- **Booking**: `http://localhost:3000/bristol-gas-training/courses/{courseId}/book`

## 🏆 Success Metrics

### For Training Centers
- ✅ Easy session scheduling
- ✅ Automated booking management  
- ✅ Real-time capacity tracking
- ✅ Integrated payment processing
- ✅ Student communication tools

### For Students
- ✅ Clear course availability
- ✅ Simple booking process
- ✅ Secure payment options
- ✅ Booking confirmations
- ✅ Session reminders

## 🔧 Troubleshooting

### Common Issues
1. **404 on session management** → Fixed! Routes now exist
2. **Payment processing errors** → Check Stripe configuration
3. **Booking capacity errors** → Validate session availability
4. **Email notifications** → Configure SMTP settings

### Debug Commands
```bash
# Check session API
curl "http://localhost:3000/api/tenant/bristol-gas-training/courses/{courseId}/sessions"

# Check booking API  
curl "http://localhost:3000/api/tenant/bristol-gas-training/bookings"

# Check dashboard stats
curl "http://localhost:3000/api/tenant/bristol-gas-training/dashboard"
```

---

## 🎉 Status: FULLY IMPLEMENTED

The complete booking flow is now functional:
- ✅ Session management UI and APIs
- ✅ Booking creation and management
- ✅ Payment integration ready
- ✅ Admin dashboard working
- ✅ Multi-tenant isolation
- ✅ Real-time statistics

**Ready for production use!** 🚀