import { seedDatabase } from '../src/lib/seed-data'

async function main() {
  try {
    console.log('Starting database seeding...')
    await seedDatabase()
    console.log('✅ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

main()