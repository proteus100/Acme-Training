# ACME Training - Space Management System Reference

## Overview
The space management system automatically tracks course session capacity and provides real-time visibility to administrators about booking availability.

## How Space Counting Works

### Database Structure
- **CourseSession Model:**
  - `availableSpots` (Int) - Total capacity for the session
  - `bookedSpots` (Int) - Currently confirmed/pending bookings
  - `isActive` (Boolean) - Whether session accepts new bookings

### Automatic Space Updates
1. **New Booking Created** → `bookedSpots` +1
2. **Booking Cancelled** → `bookedSpots` -1
3. **Booking Deleted** → `bookedSpots` -1
4. **Status Changes** → Adjusts based on PENDING/CONFIRMED vs CANCELLED

### Real-time Calculation
```
Remaining Spaces = availableSpots - bookedSpots
```

## Administrator Dashboard Features

### Space Visibility Indicators
- **Available:** Green icon + badge (3+ spaces remaining)
- **Nearly Full:** Amber icon + badge (1-2 spaces remaining)
- **FULL:** Red icon + badge (0 spaces remaining)

### Admin Interface Columns
1. **Customer** - Name, email, phone
2. **Course** - Title and duration
3. **Session Date** - Start/end dates and times
4. **Capacity** - Visual space indicator with remaining count
5. **Amount** - Total and deposit amounts
6. **Payment Status** - Paid/Deposit Paid/Unpaid
7. **Status** - Confirmed/Pending/Cancelled badges
8. **Actions** - View/Edit/Delete buttons

### Capacity Status Examples
```
✅ "11 of 12 spots remaining" - Available (Green)
⚠️  "2 of 12 spots remaining" - Nearly Full (Amber)
🔴 "0 of 12 spots remaining" - FULL (Red)
```

## API Endpoints

### Get All Bookings with Space Info
- **URL:** `/api/admin/bookings`
- **Method:** GET
- **Returns:** Array of bookings with session capacity data

### Create Booking (Auto-updates spaces)
- **URL:** `/api/bookings`
- **Method:** POST
- **Validation:** Checks availability before creating
- **Updates:** Increments `bookedSpots` on success

### Update Booking Status
- **URL:** `/api/bookings/[id]`
- **Method:** PUT
- **Handles:** Status changes affecting space count
- **Logic:** CANCELLED ↔ CONFIRMED/PENDING adjustments

### Delete Booking
- **URL:** `/api/bookings/[id]`
- **Method:** DELETE
- **Updates:** Decrements `bookedSpots` if booking was active

## Booking Flow Protection

### Availability Checks
1. **Session Exists** - Validates session ID
2. **Session Active** - Checks `isActive` flag
3. **Space Available** - Prevents overbooking
4. **No Duplicate** - One booking per customer per session

### Error Responses
- `409 Conflict` - Session fully booked
- `409 Conflict` - Customer already booked
- `400 Bad Request` - Session not active
- `404 Not Found` - Session doesn't exist

## Current System Status

### Live Data Examples (September 2025)
```
Course: "ACS CORE & 4 REASSESSMENT"
- Total Spots: 12
- Booked: 1
- Remaining: 11
- Status: Available ✅

Course: "LPG PD/RPH REA" 
- Total Spots: 12
- Booked: 0  
- Remaining: 12
- Status: Available ✅
```

## Administrator Actions

### Monitoring Capacity
1. **Dashboard View** - See all sessions at a glance
2. **Filter by Status** - Focus on specific booking states
3. **Search Function** - Find specific customers/courses
4. **Export Data** - Download booking reports

### Managing Full Courses
1. **Waitlist** - (Future feature) Handle overflow bookings
2. **Additional Sessions** - Create new dates for popular courses
3. **Customer Contact** - Reach out for alternative options

## Technical Implementation

### Files Modified
- `src/app/api/admin/bookings/route.ts` - Admin API endpoint
- `src/app/admin/bookings/page.tsx` - Enhanced admin interface
- `src/app/api/bookings/route.ts` - Booking creation/updates
- `src/app/api/bookings/[id]/route.ts` - Individual booking management

### Key Features Added
- Real-time space indicators
- Capacity status badges
- Visual alerts for nearly full sessions
- Live database integration
- Automatic space counting

## Troubleshooting

### Common Issues
- **Spaces not updating:** Check booking status changes in database
- **Negative spaces:** Review booking deletion/cancellation logic
- **Overbooking:** Verify API validation is working
- **Wrong counts:** Ensure `bookedSpots` matches actual active bookings

### Database Queries for Verification
```sql
-- Check session capacity
SELECT id, availableSpots, bookedSpots, 
       (availableSpots - bookedSpots) as remaining
FROM CourseSession;

-- Count actual bookings per session
SELECT sessionId, COUNT(*) as actual_bookings
FROM Booking 
WHERE status IN ('PENDING', 'CONFIRMED')
GROUP BY sessionId;
```

---
*Space Management System implemented September 2025*  
**ACME Training Centre - Newton Abbot**