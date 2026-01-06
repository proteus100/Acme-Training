const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const trainingCourses = [
  // Gas Safe Courses
  {
    title: "ACS CORE & 4 INITIAL (Domestic Gas)",
    description: "Initial Assessment for ACS Core Gas Safety and 4 appliances (CCN1, CPA1, CENWAT1, CKR1). Essential certification for domestic gas engineers starting their career.",
    category: "GAS_SAFE",
    duration: 40,
    price: 995.00,
    maxStudents: 8
  },
  {
    title: "ACS CORE & 4 REA (Domestic Gas Re-Assessment)",
    description: "5-year re-assessment for ACS Core Gas Safety and 4 appliances. Maintains your Gas Safe registration for domestic work.",
    category: "GAS_SAFE", 
    duration: 8,
    price: 650.00,
    maxStudents: 12
  },
  {
    title: "ACS CKR1 - Cookers (Initial)",
    description: "Initial assessment for installation, commissioning, service and repair of domestic gas cookers and built-in cooking appliances.",
    category: "GAS_SAFE",
    duration: 8,
    price: 295.00,
    maxStudents: 10
  },
  {
    title: "ACS HTR1 - Central Heating (Initial)", 
    description: "Initial assessment for installation, commissioning, service and repair of domestic gas central heating systems up to 70kW.",
    category: "GAS_SAFE",
    duration: 16,
    price: 495.00,
    maxStudents: 8
  },
  {
    title: "ACS WAT1 - Water Heaters (Initial)",
    description: "Initial assessment for installation, commissioning, service and repair of domestic gas water heaters and combination boilers.",
    category: "GAS_SAFE",
    duration: 8,
    price: 295.00,
    maxStudents: 10
  },

  // Heat Pump Courses
  {
    title: "Air Source Heat Pump Installation (MCS Approved)",
    description: "Comprehensive training on air source heat pump installation, commissioning and maintenance. MCS approved course for domestic renewable installations.",
    category: "HEAT_PUMP",
    duration: 32,
    price: 1295.00,
    maxStudents: 6
  },
  {
    title: "Ground Source Heat Pump Systems",
    description: "Specialist training on ground source heat pump technology, ground loop installation and system design for domestic properties.",
    category: "HEAT_PUMP", 
    duration: 24,
    price: 995.00,
    maxStudents: 6
  },
  {
    title: "Heat Pump Maintenance & Service",
    description: "Service and maintenance procedures for air and ground source heat pumps. Fault finding and repair techniques.",
    category: "HEAT_PUMP",
    duration: 16,
    price: 695.00,
    maxStudents: 8
  },

  // OFTEC Courses
  {
    title: "OFTEC OT1 - Oil Tank Installation",
    description: "Installation of oil storage tanks and supply systems for domestic heating. Includes regulations and safety procedures.",
    category: "OFTEC",
    duration: 16,
    price: 595.00,
    maxStudents: 8
  },
  {
    title: "OFTEC OT2 - Oil Boiler Commissioning", 
    description: "Commissioning, servicing and maintenance of oil-fired boilers and heating systems for domestic properties.",
    category: "OFTEC",
    duration: 24,
    price: 795.00,
    maxStudents: 6
  },

  // LPG Courses
  {
    title: "ACS LPG Core Safety (CPLPG1)",
    description: "Core LPG safety course covering properties of LPG, installation principles, safety procedures and emergency actions.",
    category: "LPG", 
    duration: 8,
    price: 395.00,
    maxStudents: 12
  },
  {
    title: "ACS CCLP1 - LPG Pipework",
    description: "Installation of LPG pipework systems for domestic and leisure applications. Covers regulations and testing procedures.",
    category: "LPG",
    duration: 16,
    price: 595.00,
    maxStudents: 8
  },

  // F-Gas Air Conditioning
  {
    title: "F-Gas Category I Certification",
    description: "Category I F-Gas certification for handling refrigerants in air conditioning and heat pump systems. EU regulation compliance.",
    category: "FGAS_AIR_CONDITIONING",
    duration: 16,
    price: 695.00,
    maxStudents: 10
  },
  {
    title: "F-Gas Category II Certification", 
    description: "Category II F-Gas certification for installation and commissioning of air conditioning systems. Higher level certification.",
    category: "FGAS_AIR_CONDITIONING",
    duration: 24,
    price: 895.00,
    maxStudents: 8
  },

  // Commercial Courses
  {
    title: "ACS CIGA1 - Industrial & Commercial Boilers",
    description: "Installation, commissioning and maintenance of industrial and commercial gas-fired boilers over 70kW net input.",
    category: "COMMERCIAL_GAS",
    duration: 24,
    price: 895.00,
    maxStudents: 6
  },
  {
    title: "ACS CDGA1 - Commercial Catering Equipment",
    description: "Installation, commissioning, service and repair of commercial gas catering appliances in commercial kitchens.",
    category: "COMMERCIAL_CATERING", 
    duration: 16,
    price: 695.00,
    maxStudents: 8
  },

  // Water Regulations
  {
    title: "Water Regulations (WRAS) Training",
    description: "Understanding water regulations, backflow prevention, and compliance requirements for plumbing installations.",
    category: "WATER",
    duration: 8,
    price: 295.00,
    maxStudents: 12
  },

  // Electrical Training
  {
    title: "18th Edition IET Wiring Regulations (BS 7671)",
    description: "Latest 18th Edition wiring regulations training covering amendments and updates to electrical installation standards.",
    category: "ELECTRICAL",
    duration: 16,
    price: 495.00,
    maxStudents: 10
  },
  {
    title: "PAT Testing (Portable Appliance Testing)",
    description: "Training on portable appliance testing procedures, equipment use, and certification requirements for electrical safety.",
    category: "ELECTRICAL", 
    duration: 8,
    price: 295.00,
    maxStudents: 12
  }
]

async function seedCourses() {
  console.log('Starting to seed training courses...')
  
  try {
    // First, let's correct the existing courses
    console.log('Correcting existing course categories...')
    
    // Update the gas course that was incorrectly categorized
    const gasCourse = await prisma.course.findFirst({
      where: { 
        title: { contains: "ACS Gas Safety Re-Assessment" }
      }
    })
    
    if (gasCourse) {
      await prisma.course.update({
        where: { id: gasCourse.id },
        data: { 
          category: "GAS_SAFE",
          title: "ACS Gas Safety Re-Assessment (Domestic)",
          description: "5-year re-assessment for ACS Gas Safety qualifications. Maintains your Gas Safe registration for domestic gas work."
        }
      })
      console.log('✅ Corrected existing gas course category')
    }

    let created = 0
    let existing = 0
    
    for (const course of trainingCourses) {
      // Check if course already exists
      const existingCourse = await prisma.course.findFirst({
        where: { 
          OR: [
            { title: course.title },
            { title: { contains: course.title.substring(0, 20) } }
          ]
        }
      })
      
      if (!existingCourse) {
        await prisma.course.create({
          data: course
        })
        created++
        console.log(`✅ Created: ${course.title}`)
      } else {
        existing++
        console.log(`➖ Already exists: ${course.title}`)
      }
    }
    
    console.log('\n📊 Course Seeding Summary:')
    console.log(`✅ Created: ${created} new courses`)
    console.log(`➖ Already existed: ${existing} courses`)
    console.log(`🎯 Total courses in catalog: ${created + existing + 2}`) // +2 for existing ones
    
  } catch (error) {
    console.error('❌ Error seeding courses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCourses()