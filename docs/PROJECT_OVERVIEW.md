# ACME Training Centre Website

## Project Overview

This is a professional training booking website for ACME Training Centre in Newton Abbot, specializing in gas safety, heat pump, OFTEC oil, and LPG qualifications.

## Business Requirements

### Training Categories
- **Gas Safe Training**: Gas cooker training, gas fires training, new gas training for beginners
- **Heat Pump Training**: Installation, servicing and maintenance
- **OFTEC Oil Qualifications**: Pressure jet boilers, vaporizing appliances (AGA, Rayburn, Esse)
- **LPG Training**: Permanent installations, mobile homes, park homes, leisure vehicles, Widney fires

### Key Features
- Online course catalog with filtering
- Real-time booking system with calendar integration
- Payment processing (full payment or deposits)
- Customer management
- Email confirmations
- Admin dashboard
- Flexible scheduling (short notice, weekends, evenings)

### Business Details
- Location: Newton Abbot, Devon
- WRAS approved training centre
- Ariston training center
- Maximum 12 students per course typically
- Flexible scheduling including weekends and evenings

## Technical Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide React icons
- **Calendar**: FullCalendar.js for booking interface
- **Forms**: React Hook Form with Zod validation

### Backend
- **Database**: PostgreSQL with Prisma ORM
- **API**: Next.js API routes
- **Payment**: Stripe for payment processing
- **Email**: Resend for email notifications

### Key Dependencies
```json
{
  "@fullcalendar/react": "^6.1.19",
  "@prisma/client": "^6.16.0", 
  "@stripe/stripe-js": "^7.9.0",
  "react-hook-form": "^7.62.0",
  "zod": "^4.1.7",
  "resend": "^6.0.3",
  "lucide-react": "^0.544.0"
}
```

## Database Schema

### Core Models
- **Course**: Training course information (title, category, duration, price)
- **CourseSession**: Specific date/time instances of courses
- **Customer**: Customer information and contact details
- **Booking**: Links customers to course sessions
- **Payment**: Payment records and transaction tracking

### Course Categories (Enum)
- GAS_SAFE
- HEAT_PUMP  
- OFTEC
- LPG
- VAPORIZING

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── courses/
│   │       └── route.ts
│   ├── booking/
│   │   └── page.tsx
│   ├── courses/
│   │   └── page.tsx
│   └── page.tsx (homepage)
├── components/
│   ├── ui/
│   ├── forms/
│   └── calendar/
├── lib/
│   ├── prisma.ts
│   ├── stripe.ts
│   └── seed-data.ts
prisma/
└── schema.prisma
```

## Features Implemented

### ✅ Completed
1. **Project Setup**
   - Next.js 14 with TypeScript and Tailwind CSS
   - Prisma database schema
   - Core dependencies installed

2. **Homepage**
   - Professional design showcasing services
   - Course category overview
   - Call-to-action sections

3. **Course Catalog**
   - Course listing with filtering by category
   - Course details display
   - Available sessions preview

4. **Booking System Foundation**
   - Multi-step booking process
   - Course selection interface
   - Calendar integration with FullCalendar
   - Customer information form
   - Payment option selection (full/deposit)

5. **Database Design**
   - Comprehensive schema for courses, sessions, bookings
   - Sample data seeding functionality

### 🚧 In Progress
- Stripe payment integration
- Email confirmation system
- Admin dashboard

### 📋 Planned
- Customer authentication
- Booking management
- Certificate generation
- Reporting dashboard
- Mobile app considerations

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/acme_training"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Email
RESEND_API_KEY="re_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   ```bash
   # Copy and configure environment variables
   cp .env.example .env
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed sample data
   npx prisma db seed
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Homepage: http://localhost:3000
   - Courses: http://localhost:3000/courses
   - Booking: http://localhost:3000/booking

## Payment Flow

1. Customer selects course and session
2. Fills in personal/contact details
3. Chooses payment type (full or 30% deposit)
4. Stripe payment processing
5. Email confirmation sent
6. Booking confirmed in database

## Admin Features (Planned)

- Course management (CRUD operations)
- Session scheduling
- Booking overview and management
- Customer communication
- Payment tracking
- Reporting and analytics

## Deployment Considerations

- **Database**: PostgreSQL on cloud provider (AWS RDS, Supabase)
- **Hosting**: Vercel (recommended for Next.js)
- **Storage**: Cloudinary for certificates/documents
- **Monitoring**: Sentry for error tracking
- **Analytics**: Google Analytics or Plausible

## Business Rules

- Maximum students per course varies by type
- Deposit is 30% of course price
- Balance due before course start date
- Cancellation policy to be implemented
- Certificate issued upon completion
- Weekend and evening availability
- Short notice bookings accepted

## Security Considerations

- PCI compliance through Stripe
- Customer data protection (GDPR)
- Secure payment processing
- Input validation and sanitization
- Rate limiting on API endpoints
- Environment variable security

---

*Last updated: September 2024*
*Project Status: Initial development phase*