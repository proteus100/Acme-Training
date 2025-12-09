const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const certificationRules = [
  {
    category: 'GAS_SAFE',
    validityYears: 5,
    reminderMonths: '6,3,1', // 6 months, 3 months, 1 month before expiry
    isActive: true
  },
  {
    category: 'HEAT_PUMP',
    validityYears: 5,
    reminderMonths: '6,3,1',
    isActive: true
  },
  {
    category: 'OFTEC',
    validityYears: 5,
    reminderMonths: '6,3,1',
    isActive: true
  },
  {
    category: 'LPG',
    validityYears: 5,
    reminderMonths: '6,3,1',
    isActive: true
  },
  {
    category: 'VAPORIZING',
    validityYears: 3, // Some certifications have shorter validity
    reminderMonths: '6,3,1',
    isActive: true
  },
  {
    category: 'WATER',
    validityYears: 5,
    reminderMonths: '6,3,1',
    isActive: true
  },
  {
    category: 'FGAS_AIR_CONDITIONING',
    validityYears: 5,
    reminderMonths: '6,3,1',
    isActive: true
  },
  {
    category: 'COMMERCIAL_CATERING',
    validityYears: 5,
    reminderMonths: '6,3,1',
    isActive: true
  },
  {
    category: 'COMMERCIAL_LAUNDRY',
    validityYears: 5,
    reminderMonths: '6,3,1',
    isActive: true
  },
  {
    category: 'COMMERCIAL_GAS',
    validityYears: 5,
    reminderMonths: '6,3,1',
    isActive: true
  },
  {
    category: 'COMMERCIAL_CORE',
    validityYears: 5,
    reminderMonths: '6,3,1',
    isActive: true
  },
  {
    category: 'ELECTRICAL',
    validityYears: 3, // Electrical certifications often need more frequent renewal
    reminderMonths: '6,3,1',
    isActive: true
  },
  {
    category: 'REFRIGERATION',
    validityYears: 5,
    reminderMonths: '6,3,1',
    isActive: true
  }
]

async function main() {
  console.log('🔄 Seeding certification rules...')
  
  for (const rule of certificationRules) {
    const existing = await prisma.certificationRule.findUnique({
      where: { category: rule.category }
    })
    
    if (existing) {
      console.log(`⚠️  Certification rule for ${rule.category} already exists, skipping...`)
      continue
    }
    
    const created = await prisma.certificationRule.create({
      data: rule
    })
    console.log(`✅ Created certification rule for ${created.category} (${created.validityYears} years)`)
  }
  
  console.log('🎉 Certification rules seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding certification rules:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })