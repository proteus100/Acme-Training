# Student Authentication System Reference

## Overview
Complete Google OAuth-based authentication system for students to register their companies and track gas training certifications.

## System Architecture

### Authentication Flow
1. Student visits `/student/login`
2. Signs in with Google OAuth
3. Redirected to `/student/profile-setup` for company registration
4. Access `/student/dashboard` for certification management

### Technology Stack
- **NextAuth.js v4.24.11** - Authentication framework
- **Google OAuth 2.0** - Identity provider
- **Prisma ORM** - Database operations
- **SQLite** - Database (NextAuth compatible)
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts    # NextAuth API handler
│   │   ├── student/
│   │   │   ├── profile/route.ts           # Profile GET/POST
│   │   │   └── certifications/route.ts    # Certifications GET
│   │   └── courses/route.ts               # Courses API (existing)
│   └── student/
│       ├── login/page.tsx                 # Google Sign-In page
│       ├── profile-setup/page.tsx         # Company registration
│       └── dashboard/page.tsx             # Main dashboard
├── lib/
│   ├── nextauth.ts                        # NextAuth configuration
│   ├── auth.ts                            # Admin auth utilities
│   └── prisma.ts                          # Prisma client
└── prisma/
    └── schema.prisma                      # Database schema
```

## Database Schema

### Enhanced Customer Model
```prisma
model Customer {
  id             String              @id @default(cuid())
  firstName      String
  lastName       String
  email          String              @unique
  phone          String?
  company        String?
  companySize    String?             // "1-10", "11-50", "51-200", "200+"
  jobTitle       String?
  googleId       String?             @unique
  image          String?             // Google profile picture
  emailVerified  DateTime?
  isActive       Boolean             @default(true)
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  // Relations
  bookings       Booking[]
  achievements   Achievement[]
  accounts       Account[]           // NextAuth
  sessions       Session[]           // NextAuth
}
```

### NextAuth Models
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user Customer @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         Customer @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## Configuration Files

### NextAuth Configuration (`src/lib/nextauth.ts`)
```typescript
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
  pages: {
    signIn: '/student/login',
    error: '/student/login',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}
```

### Environment Variables
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Database
DATABASE_URL="file:./dev.db"
```

## API Endpoints

### `/api/student/profile`

#### GET - Fetch User Profile
```typescript
// Returns user profile data
{
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  companySize?: string
  jobTitle?: string
  address?: string
  city?: string
  postcode?: string
}
```

#### POST - Update Profile
```typescript
// Request body
{
  firstName: string
  lastName: string
  phone?: string
  company: string
  companySize?: string
  jobTitle?: string
  address?: string
  city?: string
  postcode?: string
}
```

### `/api/student/certifications`

#### GET - Fetch Certifications
```typescript
// Returns array of certifications
[{
  id: string
  name: string
  issuedDate: string
  expiryDate: string
  status: 'active' | 'expiring' | 'expired'
  certificateUrl?: string
  description?: string
  type?: string
}]
```

### `/api/courses`

#### GET - Fetch Available Courses
```typescript
// Returns array of courses with sessions
[{
  id: string
  title: string
  description: string
  category: string
  duration: number
  price: number
  maxStudents: number
  sessions: [{
    id: string
    startDate: string
    endDate: string
    availableSpots: number
    bookedSpots: number
  }]
}]
```

## Component Features

### Student Login Page (`/student/login`)
- **Google Sign-In Button** - Handles OAuth flow
- **Two-column Layout** - Information sidebar + login form
- **Benefits Section** - Lists platform advantages
- **Contact Information** - Support details
- **Responsive Design** - Mobile-friendly

### Profile Setup Page (`/student/profile-setup`)
- **Progress Indicator** - 3-step setup process
- **Form Sections**:
  - Personal Information (name, phone, job title)
  - Company Information (name, size)
  - Address Information (optional)
- **Pre-filled Data** - Uses Google profile info
- **Validation** - Required field checking
- **Benefits Explanation** - Why data is needed

### Student Dashboard (`/student/dashboard`)
- **Welcome Section** - Personalized greeting
- **Statistics Cards**:
  - Active Certifications count
  - Expiring Soon count
  - Available Courses count
- **Certifications List** - With status indicators
- **Available Courses Grid** - Browse and book courses
- **Profile Sidebar** - User info and quick actions
- **Renewal Reminders** - Upcoming certification expirations

## Authentication States

### Session Management
```typescript
// Check authentication status
const { data: session, status } = useSession()

// Status values:
// - "loading" - Session is being fetched
// - "authenticated" - User is signed in
// - "unauthenticated" - User is not signed in
```

### Protected Routes
All student pages automatically redirect to `/student/login` if unauthenticated.

### Sign Out
```typescript
import { signOut } from 'next-auth/react'

const handleSignOut = async () => {
  await signOut({ callbackUrl: '/student/login' })
}
```

## Google OAuth Setup

### 1. Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials

### 2. OAuth Configuration
- **Application Type**: Web application
- **Authorized origins**: `http://localhost:3000`
- **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

### 3. Environment Setup
Add credentials to `.env.local`:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Database Migration

### Migration Commands
```bash
# Generate Prisma client
npx prisma generate

# Apply database changes
npx prisma migrate dev --name add-nextauth

# View database in browser
npx prisma studio
```

### Data Preservation
All existing data was successfully migrated:
- ✅ 19 courses
- ✅ 4 students  
- ✅ 2 sessions
- ✅ 4 bookings
- ✅ 1 achievement
- ✅ 1 admin user

## Testing

### Manual Testing Flow
1. Start development server: `npm run dev`
2. Visit `http://localhost:3000/student/login`
3. Click "Continue with Google"
4. Complete profile setup
5. Access dashboard features

### API Testing
```bash
# Test courses endpoint
curl http://localhost:3000/api/courses

# Test with authentication (requires session cookie)
curl -H "Cookie: next-auth.session-token=..." http://localhost:3000/api/student/profile
```

## Security Features

### Authentication Security
- **Database sessions** - More secure than JWT for sensitive data
- **CSRF protection** - Built into NextAuth
- **Session expiry** - 30-day automatic expiry
- **Secure cookies** - HttpOnly, Secure flags in production

### Authorization
- **Route protection** - Automatic redirects for unauthenticated users
- **API protection** - Session validation on all student endpoints
- **User isolation** - Users only access their own data

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database if corrupted
npx prisma migrate reset --force
```

#### Google OAuth Errors
- Check redirect URIs match exactly
- Verify client ID/secret in environment
- Ensure Google+ API is enabled

#### Session Issues
- Clear browser cookies
- Check NEXTAUTH_SECRET is set
- Verify database schema is up to date

### Debug Mode
Add to `.env.local`:
```env
NEXTAUTH_DEBUG=true
NODE_ENV=development
```

## Production Deployment

### Environment Variables
```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate_secure_random_string
GOOGLE_CLIENT_ID=production_client_id
GOOGLE_CLIENT_SECRET=production_client_secret
DATABASE_URL=production_database_url
```

### Security Checklist
- [ ] Set secure NEXTAUTH_SECRET
- [ ] Update Google OAuth redirect URIs
- [ ] Use production database
- [ ] Enable HTTPS
- [ ] Set secure cookie settings

## Support & Maintenance

### Regular Tasks
- Monitor certification expiry alerts
- Update Google OAuth credentials annually
- Database backups before schema changes
- Review user feedback and usage analytics

### Contact Information
- **Support Email**: support@acme-training.co.uk
- **Phone**: 01234 567890
- **Developer**: Available for system updates and maintenance

---

*Generated on 2025-09-13 - Student Authentication System v1.0*