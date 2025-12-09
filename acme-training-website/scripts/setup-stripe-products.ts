import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

async function setupStripeProducts() {
  try {
    console.log('🚀 Setting up TrainKit subscription products in Stripe...\n')

    // Check if products already exist
    const existingProducts = await stripe.products.list({ limit: 100 })
    const trainkitProducts = existingProducts.data.filter(p =>
      p.name.includes('TrainKit') || p.metadata?.app === 'trainkit'
    )

    if (trainkitProducts.length > 0) {
      console.log('⚠️  Found existing TrainKit products:')
      for (const product of trainkitProducts) {
        console.log(`   - ${product.name} (${product.id})`)
      }
      console.log('\n')

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })

      const answer = await new Promise<string>(resolve => {
        readline.question('Do you want to create new products anyway? (y/n): ', resolve)
      })
      readline.close()

      if (answer.toLowerCase() !== 'y') {
        console.log('❌ Cancelled. Using existing products.')
        return
      }
    }

    // Create STARTER plan
    console.log('📦 Creating STARTER plan...')
    const starterProduct = await stripe.products.create({
      name: 'TrainKit Starter',
      description: 'Perfect for small training centers getting started',
      metadata: {
        app: 'trainkit',
        plan: 'STARTER',
        maxStudents: '50',
        maxCourses: '5'
      }
    })

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 24700, // £247.00
      currency: 'gbp',
      recurring: {
        interval: 'month',
        trial_period_days: 14
      },
      metadata: {
        app: 'trainkit',
        plan: 'STARTER'
      }
    })

    console.log(`✅ STARTER product created:`)
    console.log(`   Product ID: ${starterProduct.id}`)
    console.log(`   Price ID: ${starterPrice.id}`)
    console.log(`   Amount: £247/month\n`)

    // Create PROFESSIONAL plan
    console.log('📦 Creating PROFESSIONAL plan...')
    const professionalProduct = await stripe.products.create({
      name: 'TrainKit Professional',
      description: 'For growing training centers with more students',
      metadata: {
        app: 'trainkit',
        plan: 'PROFESSIONAL',
        maxStudents: '150',
        maxCourses: '15'
      }
    })

    const professionalPrice = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 44700, // £447.00
      currency: 'gbp',
      recurring: {
        interval: 'month',
        trial_period_days: 14
      },
      metadata: {
        app: 'trainkit',
        plan: 'PROFESSIONAL'
      }
    })

    console.log(`✅ PROFESSIONAL product created:`)
    console.log(`   Product ID: ${professionalProduct.id}`)
    console.log(`   Price ID: ${professionalPrice.id}`)
    console.log(`   Amount: £447/month\n`)

    // Create ENTERPRISE plan
    console.log('📦 Creating ENTERPRISE plan...')
    const enterpriseProduct = await stripe.products.create({
      name: 'TrainKit Enterprise',
      description: 'For large training centers with unlimited scale',
      metadata: {
        app: 'trainkit',
        plan: 'ENTERPRISE',
        maxStudents: 'unlimited',
        maxCourses: 'unlimited'
      }
    })

    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 89700, // £897.00
      currency: 'gbp',
      recurring: {
        interval: 'month',
        trial_period_days: 14
      },
      metadata: {
        app: 'trainkit',
        plan: 'ENTERPRISE'
      }
    })

    console.log(`✅ ENTERPRISE product created:`)
    console.log(`   Product ID: ${enterpriseProduct.id}`)
    console.log(`   Price ID: ${enterprisePrice.id}`)
    console.log(`   Amount: £897/month\n`)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('🎉 All products created successfully!')
    console.log('═══════════════════════════════════════════════════════════\n')

    console.log('📝 Add these to your .env.local file:\n')
    console.log(`STRIPE_STARTER_PRICE_ID="${starterPrice.id}"`)
    console.log(`STRIPE_PROFESSIONAL_PRICE_ID="${professionalPrice.id}"`)
    console.log(`STRIPE_ENTERPRISE_PRICE_ID="${enterprisePrice.id}"`)
    console.log('')
    console.log('📝 And add these to your .env.production file (for frontend):\n')
    console.log(`NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID="${starterPrice.id}"`)
    console.log(`NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID="${professionalPrice.id}"`)
    console.log(`NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID="${enterprisePrice.id}"`)
    console.log('')

    console.log('═══════════════════════════════════════════════════════════')
    console.log('⚠️  IMPORTANT: Set up your Stripe webhook')
    console.log('═══════════════════════════════════════════════════════════\n')
    console.log('1. Go to: https://dashboard.stripe.com/webhooks')
    console.log('2. Click "Add endpoint"')
    console.log('3. Endpoint URL: https://trainkit.co.uk/api/webhooks/stripe')
    console.log('4. Select these events:')
    console.log('   - customer.subscription.created')
    console.log('   - customer.subscription.updated')
    console.log('   - customer.subscription.deleted')
    console.log('   - customer.subscription.trial_will_end')
    console.log('   - invoice.payment_succeeded')
    console.log('   - invoice.payment_failed')
    console.log('   - invoice.created')
    console.log('   - invoice.finalized')
    console.log('   - payment_intent.succeeded')
    console.log('   - payment_intent.payment_failed')
    console.log('5. Copy the "Signing secret" and add to .env.production:')
    console.log('   STRIPE_WEBHOOK_SECRET="whsec_..."')
    console.log('')

  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error)
    process.exit(1)
  }
}

setupStripeProducts()
