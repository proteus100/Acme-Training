# ACME Training Template Customization Guide

## Overview: From ACME to Any Training Center

Your ACME Training platform is perfectly positioned as a template for other gas training centers. Here's how to customize it for new clients while maintaining the core functionality.

## Template Architecture Strategy

### Core Components to Keep (Template Base)
- ✅ **Booking System Logic** - Universal for all training centers
- ✅ **Database Schema** - Course/Session/Customer/Booking models
- ✅ **Admin Dashboard** - Space management and reporting
- ✅ **Payment Integration** - Stripe functionality
- ✅ **API Endpoints** - All booking/course management APIs
- ✅ **Component Structure** - React components for forms, calendars, etc.

### Customizable Elements (Client-Specific)
- 🎨 **Branding & Design** - Colors, logos, typography
- 📝 **Content** - Company name, copy, course descriptions
- 🏫 **Course Data** - Training categories, pricing, add-ons
- 📍 **Location** - Address, contact details, local SEO
- 🎯 **Specific Features** - Industry certifications, specializations

## Step-by-Step Customization Process

### Phase 1: Project Setup (1-2 days)

#### 1. Clone ACME Template
```bash
# Create new project from ACME template
git clone acme-training-website bristol-gas-training
cd bristol-gas-training

# Remove git history to start fresh
rm -rf .git
git init
git add .
git commit -m "Initial template setup for Bristol Gas Training"
```

#### 2. Update Project Configuration
```json
// package.json
{
  "name": "bristol-gas-training",
  "description": "Bristol Gas Training - Professional Gas Training Centre",
  "author": "Bristol Gas Training",
  // ... rest of config
}
```

#### 3. Environment Setup
```bash
# .env.local (copy from ACME, update values)
DATABASE_URL="mysql://bristol_user:password@host:3306/bristol_gas_db"
NEXT_PUBLIC_APP_URL="https://bristolgastraining.com"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_bristol_key"
STRIPE_SECRET_KEY="sk_live_bristol_key"
```

### Phase 2: Branding & Design (2-3 days)

#### 1. Logo & Assets Replacement
```bash
# Replace logo files
public/images/logos/
├── company-logo.svg (client's main logo)
├── company-logo-simple.png (simplified version)
├── gas-safe.svg (keep if applicable)
└── oftec.svg (keep if applicable)
```

#### 2. Color Scheme Update
```css
/* styles/globals.css or tailwind.config.js */
:root {
  /* ACME: Blue theme */
  --primary: #1e40af;     /* blue-800 */
  --secondary: #f97316;   /* orange-500 */
  
  /* Bristol: Green theme example */
  --primary: #166534;     /* green-800 */
  --secondary: #dc2626;   /* red-600 */
}
```

#### 3. Typography & Styling
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'bristol-primary': '#166534',
        'bristol-secondary': '#dc2626',
        'bristol-accent': '#fbbf24'
      },
      fontFamily: {
        'bristol': ['Inter', 'sans-serif'] // Client-specific font
      }
    }
  }
}
```

### Phase 3: Content Customization (2-3 days)

#### 1. Site-wide Content Updates
```typescript
// config/site-config.ts
export const siteConfig = {
  name: "Bristol Gas Training",
  title: "Professional Gas Training in Bristol",
  description: "Leading gas training centre in Bristol offering Gas Safe, OFTEC, and Heat Pump courses",
  url: "https://bristolgastraining.com",
  contact: {
    phone: "0117 XXX XXXX",
    email: "info@bristolgastraining.com",
    address: "123 Training Street, Bristol, BS1 XXX"
  },
  certifications: ["Gas Safe", "OFTEC"] // Remove/add as needed
}
```

#### 2. Homepage Content
```typescript
// src/app/page.tsx - Update hero section
<h1 className="text-4xl font-bold text-white mb-2">Bristol Gas Training</h1>
<p className="text-lg text-white/90 mb-1">TRAINING CENTRE</p>
<p className="text-sm text-white/80">Professional Gas Training • Bristol</p>

// Update main heading
<h2 className="text-4xl md:text-6xl font-light mb-6">
  Professional Gas Training in Bristol
</h2>

// Update description
<p className="text-xl mb-8 max-w-3xl mx-auto">
  Bristol's premier training centre for Gas Safe, OFTEC, and LPG qualifications. 
  Expert instruction with flexible scheduling options.
</p>
```

#### 3. Training Categories Update
```typescript
// src/app/page.tsx - Course categories
const trainingCategories = [
  {
    title: "Gas Safe Training",
    description: "Comprehensive gas safety training for domestic installations",
    icon: "🔥",
    logo: "/images/logos/gas-safe.svg"
  },
  {
    title: "OFTEC Training", 
    description: "Oil heating system installation and maintenance training",
    icon: "🛢️",
    logo: "/images/logos/oftec.svg"
  }
  // Add/remove categories based on client offerings
]
```

### Phase 4: Course & Pricing Configuration (1-2 days)

#### 1. Database Course Setup
```sql
-- Clear existing ACME courses
DELETE FROM Course;

-- Add Bristol-specific courses
INSERT INTO Course (title, description, category, duration, price, maxStudents) VALUES
('Gas Safe ACS Assessment', 'Annual ACS assessment for gas engineers', 'GAS_SAFE', 8, 180, 10),
('OFTEC OFT10-105E', 'Oil boiler service and maintenance', 'OFTEC', 16, 420, 8),
('Heat Pump Installation', 'Air source heat pump installation', 'HEAT_PUMP', 24, 650, 6);
```

#### 2. Add-ons Customization
```typescript
// src/app/booking/page.tsx - Update courseAddons
const courseAddons = {
  GAS_SAFE: [
    { id: 'cooker-assessment', name: 'Gas Cooker Assessment', price: 85 },
    { id: 'fire-assessment', name: 'Gas Fire Assessment', price: 110 },
    // Client-specific add-ons
  ],
  OFTEC: [
    { id: 'tank-assessment', name: 'Oil Tank Assessment', price: 95 },
    { id: 'aga-training', name: 'AGA Training Module', price: 185 },
    // Client-specific add-ons
  ]
}
```

### Phase 5: Location & SEO Updates (1 day)

#### 1. Location-Specific Content
```typescript
// Update all location references
"Newton Abbot" → "Bristol"
"Devon" → "Bristol & Southwest England"
"ACME Training Centre" → "Bristol Gas Training"
```

#### 2. SEO Configuration
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  title: "Bristol Gas Training - Professional Gas Safe & OFTEC Courses",
  description: "Leading gas training centre in Bristol. Gas Safe ACS, OFTEC oil heating, and heat pump courses. Expert instructors, flexible scheduling.",
  keywords: "gas training bristol, gas safe courses bristol, oftec training bristol",
  openGraph: {
    title: "Bristol Gas Training",
    description: "Professional gas training in Bristol",
    url: "https://bristolgastraining.com",
  }
}
```

#### 3. Local Business Schema
```typescript
// components/LocalBusinessSchema.tsx
const localBusiness = {
  "@type": "LocalBusiness",
  "name": "Bristol Gas Training",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Training Street",
    "addressLocality": "Bristol",
    "postalCode": "BS1 XXX",
    "addressCountry": "GB"
  },
  "telephone": "0117 XXX XXXX",
  "url": "https://bristolgastraining.com"
}
```

## Template Management Strategy

### 1. Master Template Repository
```bash
# Maintain clean template version
acme-training-template/
├── src/
├── config/
│   ├── template-variables.ts    # Configurable values
│   └── customization-guide.md   # Client instructions
├── scripts/
│   └── customize.js             # Automated customization script
└── README-TEMPLATE.md           # Template usage guide
```

### 2. Configuration-Driven Approach
```typescript
// config/template-variables.ts
export const templateConfig = {
  // Branding
  companyName: "{{COMPANY_NAME}}",
  tagline: "{{COMPANY_TAGLINE}}",
  primaryColor: "{{PRIMARY_COLOR}}",
  secondaryColor: "{{SECONDARY_COLOR}}",
  
  // Location
  city: "{{CITY}}",
  address: "{{ADDRESS}}",
  phone: "{{PHONE}}",
  email: "{{EMAIL}}",
  
  // Features
  certifications: ["{{CERT_1}}", "{{CERT_2}}"],
  specializations: ["{{SPEC_1}}", "{{SPEC_2}}"],
  
  // Courses (to be replaced with client data)
  courses: [] // Populated from client requirements
}
```

### 3. Automated Customization Script
```javascript
// scripts/customize.js
const fs = require('fs');
const path = require('path');

function customizeTemplate(clientConfig) {
  // Replace template variables in all files
  const filesToUpdate = [
    'src/app/page.tsx',
    'src/app/layout.tsx',
    'src/config/site-config.ts',
    'package.json'
  ];
  
  filesToUpdate.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace all template variables
    Object.entries(clientConfig).forEach(([key, value]) => {
      const placeholder = `{{${key.toUpperCase()}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });
    
    fs.writeFileSync(file, content);
  });
}

// Usage
const bristolConfig = {
  company_name: "Bristol Gas Training",
  city: "Bristol",
  primary_color: "#166534",
  // ... other config
};

customizeTemplate(bristolConfig);
```

## Client Onboarding Process

### Week 1: Discovery & Planning
1. **Requirements Gathering**
   - Courses offered
   - Certifications held
   - Branding guidelines
   - Special features needed

2. **Design Mockups**
   - Homepage design with client branding
   - Course pages layout
   - Color scheme examples

### Week 2: Development & Customization
1. **Template Setup** (Day 1-2)
2. **Branding Implementation** (Day 3-4)
3. **Content Updates** (Day 5-6)
4. **Course Configuration** (Day 7)

### Week 3: Testing & Launch
1. **Client Review** (Day 1-2)
2. **Revisions** (Day 3-4)
3. **Testing** (Day 5)
4. **Launch Preparation** (Day 6-7)

### Week 4: Launch & Training
1. **Domain Setup** (Day 1)
2. **Database Migration** (Day 2)
3. **Go Live** (Day 3)
4. **Admin Training** (Day 4-5)
5. **Documentation Handover** (Day 6-7)

## Pricing Structure for Template Service

### Service Packages

#### 🥉 **Bronze Package** - £2,500
- Template customization (branding, content)
- Basic course setup (up to 10 courses)
- Standard booking system
- 1 month support

#### 🥈 **Silver Package** - £4,500
- Everything in Bronze
- Custom add-ons configuration
- Advanced course management
- SEO optimization
- 3 months support
- Admin training (4 hours)

#### 🥇 **Gold Package** - £7,500
- Everything in Silver
- Custom feature development
- Multi-location support
- Advanced reporting
- 6 months support
- Admin training (8 hours)
- Marketing consultation

### Additional Services
- **Logo Design:** £250-500
- **Copy Writing:** £150/page
- **Photography:** £500/day
- **SEO Setup:** £750
- **Google Ads Setup:** £500
- **Social Media Setup:** £300

### Ongoing Services
- **Hosting & Maintenance:** £150/month
- **Support & Updates:** £75/month
- **Feature Additions:** £500-2000 each
- **Content Updates:** £50/hour

## Technical Best Practices

### 1. Maintain Template Integrity
- Keep core booking logic untouched
- Document all customizations
- Use configuration files for variables
- Version control all changes

### 2. Client Handover
- Provide admin training documentation
- Create video tutorials for booking system
- Set up monitoring and alerts
- Establish support procedures

### 3. Scalability Planning
- Design for easy updates
- Plan for additional features
- Consider multi-location expansion
- Build in analytics and reporting

## Success Metrics & KPIs

### Template Efficiency
- **Setup Time:** Target 2-3 weeks per client
- **Customization Depth:** 80% reusable, 20% custom
- **Client Satisfaction:** 95%+ rating
- **Revenue per Template:** £3,000-8,000

### Business Growth
- **Template Reuse:** 90% code reusability
- **Delivery Speed:** 3x faster than custom builds
- **Profit Margin:** 60-70% on template projects
- **Recurring Revenue:** £200-400/month per client

---

**TEMPLATE STRATEGY SUMMARY:**
Transform your ACME Training platform into a profitable template business. Streamlined customization process allows rapid deployment for new clients while maintaining quality and functionality. Target: 15 clients over 2 years = £200k+ revenue.

*Template Customization Guide - September 2025*