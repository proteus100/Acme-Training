#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addTestCourses() {
  try {
    const testTenantId = 'cmfpssagv0000rrx87pgu8a33' // Test Plumbing Academy ID

    const courses = [
      {
        title: 'Basic Plumbing Installation',
        description: 'Learn the fundamentals of plumbing installation including pipe fitting, joint making, and basic repairs.',
        category: 'WATER',
        duration: 2,
        price: 350.00,
        maxStudents: 12,
        tenantId: testTenantId
      },
      {
        title: 'Water System Maintenance',
        description: 'Comprehensive training on water system maintenance, leak detection, and preventive maintenance.',
        category: 'WATER',
        duration: 1,
        price: 275.00,
        maxStudents: 10,
        tenantId: testTenantId
      },
      {
        title: 'Domestic Plumbing Repairs',
        description: 'Hands-on training for common domestic plumbing repairs and troubleshooting.',
        category: 'WATER',
        duration: 3,
        price: 450.00,
        maxStudents: 8,
        tenantId: testTenantId
      }
    ]

    console.log('Adding test courses...')

    for (const courseData of courses) {
      console.log(`Creating course: ${courseData.title}`)
      const course = await prisma.course.create({
        data: courseData
      })
      console.log(`✅ Created course: ${course.title} (ID: ${course.id})`)
    }

    console.log('✨ All test courses added successfully!')

  } catch (error) {
    console.error('❌ Error adding test courses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestCourses()