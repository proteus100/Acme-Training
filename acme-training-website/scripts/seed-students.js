const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const testStudents = [
  { firstName: 'James', lastName: 'Smith', email: 'james.smith@email.com', phone: '07123456789', company: 'Smith Plumbing Ltd', city: 'Exeter', postcode: 'EX4 3LL' },
  { firstName: 'Emma', lastName: 'Johnson', email: 'emma.johnson@email.com', phone: '07234567890', company: 'Johnson Heating', city: 'Plymouth', postcode: 'PL1 2AB' },
  { firstName: 'Michael', lastName: 'Williams', email: 'michael.williams@email.com', phone: '07345678901', company: 'Williams Gas Services', city: 'Torquay', postcode: 'TQ1 3CD' },
  { firstName: 'Sarah', lastName: 'Brown', email: 'sarah.brown@email.com', phone: '07456789012', company: 'Brown & Sons', city: 'Barnstaple', postcode: 'EX31 4EF' },
  { firstName: 'David', lastName: 'Jones', email: 'david.jones@email.com', phone: '07567890123', company: 'Jones Electrical', city: 'Exeter', postcode: 'EX2 5GH' },
  { firstName: 'Lisa', lastName: 'Garcia', email: 'lisa.garcia@email.com', phone: '07678901234', company: 'Garcia Renewables', city: 'Truro', postcode: 'TR1 6IJ' },
  { firstName: 'Robert', lastName: 'Miller', email: 'robert.miller@email.com', phone: '07789012345', company: 'Miller HVAC', city: 'Plymouth', postcode: 'PL3 7KL' },
  { firstName: 'Jessica', lastName: 'Davis', email: 'jessica.davis@email.com', phone: '07890123456', company: 'Davis Engineering', city: 'Exeter', postcode: 'EX4 8MN' },
  { firstName: 'Christopher', lastName: 'Rodriguez', email: 'christopher.rodriguez@email.com', phone: '07901234567', company: 'Rodriguez Systems', city: 'Torquay', postcode: 'TQ2 9OP' },
  { firstName: 'Amanda', lastName: 'Martinez', email: 'amanda.martinez@email.com', phone: '07012345678', company: 'Martinez Maintenance', city: 'Barnstaple', postcode: 'EX32 0QR' },
  { firstName: 'Daniel', lastName: 'Anderson', email: 'daniel.anderson@email.com', phone: '07123456780', company: 'Anderson Installations', city: 'Exeter', postcode: 'EX1 1ST' },
  { firstName: 'Ashley', lastName: 'Taylor', email: 'ashley.taylor@email.com', phone: '07234567801', company: 'Taylor Technical', city: 'Plymouth', postcode: 'PL4 2UV' },
  { firstName: 'Matthew', lastName: 'Thomas', email: 'matthew.thomas@email.com', phone: '07345678012', company: 'Thomas Trades', city: 'Truro', postcode: 'TR2 3WX' },
  { firstName: 'Stephanie', lastName: 'Hernandez', email: 'stephanie.hernandez@email.com', phone: '07456789023', company: 'Hernandez Heat Pumps', city: 'Exeter', postcode: 'EX3 4YZ' },
  { firstName: 'Joshua', lastName: 'Moore', email: 'joshua.moore@email.com', phone: '07567890134', company: 'Moore Gas Solutions', city: 'Torquay', postcode: 'TQ3 5AB' },
  { firstName: 'Michelle', lastName: 'Martin', email: 'michelle.martin@email.com', phone: '07678901245', company: 'Martin Mechanical', city: 'Plymouth', postcode: 'PL5 6CD' },
  { firstName: 'Andrew', lastName: 'Jackson', email: 'andrew.jackson@email.com', phone: '07789012356', company: 'Jackson Services', city: 'Barnstaple', postcode: 'EX33 7EF' },
  { firstName: 'Kimberly', lastName: 'Thompson', email: 'kimberly.thompson@email.com', phone: '07890123467', company: 'Thompson Energy', city: 'Exeter', postcode: 'EX5 8GH' },
  { firstName: 'Brian', lastName: 'White', email: 'brian.white@email.com', phone: '07901234578', company: 'White Plumbing', city: 'Truro', postcode: 'TR3 9IJ' },
  { firstName: 'Nicole', lastName: 'Lopez', email: 'nicole.lopez@email.com', phone: '07012345689', company: 'Lopez Heating', city: 'Plymouth', postcode: 'PL6 0KL' },
  { firstName: 'Kevin', lastName: 'Lee', email: 'kevin.lee@email.com', phone: '07123456791', company: 'Lee HVAC Systems', city: 'Exeter', postcode: 'EX6 1MN' },
  { firstName: 'Rachel', lastName: 'Gonzalez', email: 'rachel.gonzalez@email.com', phone: '07234567802', company: 'Gonzalez Gas', city: 'Torquay', postcode: 'TQ4 2OP' },
  { firstName: 'Gary', lastName: 'Wilson', email: 'gary.wilson@email.com', phone: '07345678913', company: 'Wilson Renewables', city: 'Barnstaple', postcode: 'EX34 3QR' },
  { firstName: 'Laura', lastName: 'Anderson', email: 'laura.anderson@email.com', phone: '07456789024', company: 'Anderson Air Con', city: 'Exeter', postcode: 'EX7 4ST' },
  { firstName: 'Ryan', lastName: 'Thomas', email: 'ryan.thomas@email.com', phone: '07567890135', company: 'Thomas Engineering', city: 'Plymouth', postcode: 'PL7 5UV' },
  { firstName: 'Helen', lastName: 'Taylor', email: 'helen.taylor@email.com', phone: '07678901246', company: 'Taylor Installations', city: 'Truro', postcode: 'TR4 6WX' },
  { firstName: 'Jason', lastName: 'Moore', email: 'jason.moore@email.com', phone: '07789012357', company: 'Moore Maintenance', city: 'Exeter', postcode: 'EX8 7YZ' },
  { firstName: 'Amy', lastName: 'Jackson', email: 'amy.jackson@email.com', phone: '07890123468', company: 'Jackson Heating Solutions', city: 'Torquay', postcode: 'TQ5 8AB' },
  { firstName: 'William', lastName: 'Martin', email: 'william.martin@email.com', phone: '07901234579', company: 'Martin Gas Services', city: 'Plymouth', postcode: 'PL8 9CD' },
  { firstName: 'Elizabeth', lastName: 'Garcia', email: 'elizabeth.garcia@email.com', phone: '07012345690', company: 'Garcia Technical Services', city: 'Barnstaple', postcode: 'EX35 0EF' }
]

async function seedStudents() {
  console.log('Starting to seed students...')
  
  try {
    for (let i = 0; i < testStudents.length; i++) {
      const student = testStudents[i]
      
      // Check if student already exists
      const existingStudent = await prisma.customer.findUnique({
        where: { email: student.email }
      })
      
      if (!existingStudent) {
        await prisma.customer.create({
          data: student
        })
        console.log(`Created student ${i + 1}/30: ${student.firstName} ${student.lastName}`)
      } else {
        console.log(`Student ${i + 1}/30 already exists: ${student.firstName} ${student.lastName}`)
      }
    }
    
    console.log('✅ Successfully seeded 30 test students!')
  } catch (error) {
    console.error('❌ Error seeding students:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedStudents()