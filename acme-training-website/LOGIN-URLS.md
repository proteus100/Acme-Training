# TrainKit Platform - Login URLs & Access Guide

## Production URLs

### 1. Super Admin Portal (Platform Admin)
**Login URL:** https://trainkit.co.uk/admin/login

**Access Level:** Full platform access
- Manage all training centers
- View all tenants, students, courses
- Create and manage bundles globally
- Access super admin dashboard

**Credentials:**
- Email: `admin@trainkit.co.uk`
- Password: `Admin123!`

OR

- Email: `parenthesesweb1@gmail.com`
- Password: `Admin123!`

**Dashboard:** https://trainkit.co.uk/admin/dashboard

**Password Reset:** https://trainkit.co.uk/admin/forgot-password

---

### 2. Training Center Admin Portal (Tenant-Specific)
**Login URL Format:** https://[slug].trainkit.co.uk/admin/login

**Current Training Centers:**

#### Absolute Training
- **Login:** https://absolute.trainkit.co.uk/admin/login
- **Dashboard:** https://absolute.trainkit.co.uk/admin
- **Public Site:** https://absolute.trainkit.co.uk

**Access Level:** Tenant-isolated access
- Manage only YOUR training center's data
- Create and manage courses for your center
- Manage students enrolled in your center
- Create custom course bundles for your center
- View bookings and billing for your center
- Cannot see or modify other training centers' data

**Available Features:**
- Dashboard - Overview statistics
- Students - Manage student enrollments
- Courses - Add/edit courses
- **Bundles** - Create custom course bundle offers (NEW)
- Sessions - Schedule training sessions
- Bookings - View and manage bookings
- Billing - Financial overview
- Settings - Center configuration

**Password Reset:** https://[slug].trainkit.co.uk/admin/forgot-password
- Example: https://absolute.trainkit.co.uk/admin/forgot-password

---

### 3. Student Portal
**Login URL:** https://trainkit.co.uk/student/login

**Access Level:** Student access
- View enrolled courses
- Book training sessions
- Access course materials
- Track learning progress
- Purchase courses and bundles

**Features:**
- Email/Password login
- Google OAuth login
- New student registration
- Student dashboard

**Dashboard:** https://trainkit.co.uk/student/dashboard

**Password Reset:** https://trainkit.co.uk/student/forgot-password

---

## Key Differences: Super Admin vs Training Center Admin

### Super Admin (Platform Level)
- Access via main domain: `trainkit.co.uk`
- Can view ALL training centers
- Can create new tenants
- Full system access
- Manages the platform itself

### Training Center Admin (Tenant Level)
- Access via subdomain: `[slug].trainkit.co.uk`
- Can ONLY see their own training center
- Cannot see other centers' data
- Self-service portal for managing their center
- Subdomain-based isolation enforced

---

## Important Security Notes

1. **Subdomain Enforcement:**
   - Training center admins MUST log in through their subdomain
   - Attempting to access another center's subdomain will be blocked
   - Super admins can access any subdomain

2. **Rate Limiting:**
   - Failed login attempts are tracked by IP and email
   - Too many failed attempts will temporarily block access
   - Limits automatically reset on successful login

3. **Session Management:**
   - Admin sessions last 7 days
   - Sessions are stored in secure HTTP-only cookies
   - Auto-logout on session expiry

4. **Password Requirements:**
   - Current admin password: `Admin123!`
   - Should be changed after first login in production
   - Use strong passwords with mix of characters

---

## Quick Reference URLs

### Super Admin
| Purpose | URL |
|---------|-----|
| Login | https://trainkit.co.uk/admin/login |
| Dashboard | https://trainkit.co.uk/admin/dashboard |
| Tenants | https://trainkit.co.uk/admin/tenants |
| Bundles | https://trainkit.co.uk/admin/bundles |
| Password Reset | https://trainkit.co.uk/admin/forgot-password |

### Training Center Admin (Absolute Example)
| Purpose | URL |
|---------|-----|
| Login | https://absolute.trainkit.co.uk/admin/login |
| Dashboard | https://absolute.trainkit.co.uk/admin |
| Students | https://absolute.trainkit.co.uk/admin/students |
| Courses | https://absolute.trainkit.co.uk/admin/courses |
| Bundles | https://absolute.trainkit.co.uk/admin/bundles |
| Sessions | https://absolute.trainkit.co.uk/admin/sessions |
| Bookings | https://absolute.trainkit.co.uk/admin/bookings |
| Billing | https://absolute.trainkit.co.uk/admin/billing |
| Settings | https://absolute.trainkit.co.uk/admin/settings |
| Public Site | https://absolute.trainkit.co.uk |
| Password Reset | https://absolute.trainkit.co.uk/admin/forgot-password |

### Student Portal
| Purpose | URL |
|---------|-----|
| Login/Register | https://trainkit.co.uk/student/login |
| Dashboard | https://trainkit.co.uk/student/dashboard |
| Password Reset | https://trainkit.co.uk/student/forgot-password |

---

## Local Development URLs

When running locally (npm run dev):

- Super Admin Login: http://localhost:3000/admin/login
- Student Login: http://localhost:3000/student/login
- Training Center Admin: http://[slug].localhost:3000/admin/login

**Note:** Subdomain routing on localhost may require additional configuration.

---

## Database Access

**Prisma Studio** (Production):
- SSH into server first
- Run: `cd /var/www/trainkit && npx prisma studio`
- Access at: http://localhost:5555 (via SSH tunnel)

---

## Support & Development

- Platform: TrainKit Training Management System
- Developer: Exeter Digital Agency
- Website: https://exeterdigitalagency.co.uk

---

**Last Updated:** November 17, 2025
**Version:** 1.0
