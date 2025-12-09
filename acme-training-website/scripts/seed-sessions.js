const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Helper function to add days to a date
function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Helper function to set specific time on date
function setTime(date, timeString) {
  const [hours, minutes] = timeString.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

async function seedCourseSessions() {
  console.log('Starting to seed course sessions...')
  
  try {
    // Get all courses
    const courses = await prisma.course.findMany()
    console.log(`Found ${courses.length} courses to create sessions for`)
    
    let sessionsCreated = 0
    const today = new Date()
    
    for (const course of courses) {
      console.log(`\nCreating sessions for: ${course.title}`)
      
      // Create sessions based on course type and duration
      let sessionsToCreate = []
      
      if (course.duration <= 8) {
        // Short courses (1 day) - create more frequent sessions
        sessionsToCreate = [
          { startDate: addDays(today, 5), frequency: 'single' },   // Next week
          { startDate: addDays(today, 12), frequency: 'single' },  // 2 weeks
          { startDate: addDays(today, 19), frequency: 'single' },  // 3 weeks
          { startDate: addDays(today, 26), frequency: 'single' },  // 4 weeks
          { startDate: addDays(today, 40), frequency: 'single' },  // 6 weeks
          { startDate: addDays(today, 54), frequency: 'single' },  // 8 weeks
        ]
      } else if (course.duration <= 16) {
        // Medium courses (2 days) - spread over weekends or consecutive days
        sessionsToCreate = [
          { startDate: addDays(today, 8), frequency: 'weekend' },   // Next weekend
          { startDate: addDays(today, 22), frequency: 'weekend' },  // 3 weeks
          { startDate: addDays(today, 36), frequency: 'weekend' },  // 5 weeks
          { startDate: addDays(today, 50), frequency: 'weekend' },  // 7 weeks
        ]
      } else if (course.duration <= 32) {
        // Long courses (3-4 days) - weekly sessions or intensive courses
        sessionsToCreate = [
          { startDate: addDays(today, 10), frequency: 'intensive' }, // 1.5 weeks
          { startDate: addDays(today, 31), frequency: 'intensive' }, // Month
          { startDate: addDays(today, 52), frequency: 'intensive' }, // 2 months
        ]
      } else {
        // Very long courses (5+ days) - monthly intensive
        sessionsToCreate = [
          { startDate: addDays(today, 14), frequency: 'weekly' },    // 2 weeks
          { startDate: addDays(today, 42), frequency: 'weekly' },    // 6 weeks
          { startDate: addDays(today, 70), frequency: 'weekly' },    // 10 weeks
        ]
      }
      
      for (const sessionPlan of sessionsToCreate) {
        let startDate, endDate, startTime, endTime
        
        switch (sessionPlan.frequency) {
          case 'single':
            // Single day course
            startDate = sessionPlan.startDate
            endDate = sessionPlan.startDate
            startTime = course.duration <= 4 ? '09:00' : '08:30'
            endTime = course.duration <= 4 ? '13:00' : '17:00'
            break
            
          case 'weekend':
            // Weekend course (Saturday-Sunday)
            startDate = sessionPlan.startDate
            endDate = addDays(sessionPlan.startDate, 1)
            startTime = '09:00'
            endTime = '16:00'
            break
            
          case 'intensive':
            // Intensive course (3-4 consecutive days)
            startDate = sessionPlan.startDate
            const intensiveDays = Math.ceil(course.duration / 8)
            endDate = addDays(sessionPlan.startDate, intensiveDays - 1)
            startTime = '08:30'
            endTime = '17:00'
            break
            
          case 'weekly':
            // Weekly sessions over multiple weeks
            startDate = sessionPlan.startDate
            const weeklyDuration = Math.ceil(course.duration / 8)
            endDate = addDays(sessionPlan.startDate, (weeklyDuration - 1) * 7)
            startTime = '09:00'
            endTime = '17:00'
            break
        }
        
        // Create the session
        try {
          await prisma.courseSession.create({
            data: {
              courseId: course.id,
              startDate: setTime(startDate, startTime),
              endDate: setTime(endDate, endTime),
              startTime: startTime,
              endTime: endTime,
              availableSpots: course.maxStudents,
              bookedSpots: Math.floor(Math.random() * 3), // Random 0-2 bookings for realism
              isActive: true
            }
          })
          
          sessionsCreated++
          const dateStr = startDate.toLocaleDateString('en-GB')
          const endDateStr = startDate.getTime() !== endDate.getTime() ? ` - ${endDate.toLocaleDateString('en-GB')}` : ''
          console.log(`  ✅ Session: ${dateStr}${endDateStr} ${startTime}-${endTime}`)
          
        } catch (error) {
          console.log(`  ❌ Failed to create session: ${error.message}`)
        }
      }
    }
    
    console.log('\n📊 Session Seeding Summary:')
    console.log(`✅ Created ${sessionsCreated} course sessions`)
    console.log(`📅 Sessions span from ${today.toLocaleDateString('en-GB')} to ${addDays(today, 70).toLocaleDateString('en-GB')}`)
    console.log('🎯 Students can now see available dates and book courses!')
    
  } catch (error) {
    console.error('❌ Error seeding course sessions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCourseSessions()