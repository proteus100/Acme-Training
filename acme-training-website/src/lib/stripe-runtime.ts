// This module ONLY loads Stripe at runtime, never at build time
// It uses lazy loading and build guards to prevent build-time execution

export async function getStripeInstance() {
  // Guard: If we're somehow in build context, return a mock
  if (typeof window === 'undefined' && !process.env.STRIPE_SECRET_KEY) {
    console.warn('Stripe not available during build - using mock')
    return null
  }

  // Dynamic import - only loads when this function is called
  const { default: Stripe } = await import('stripe')

  const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_for_build_only'

  return new Stripe(apiKey, {
    apiVersion: '2024-06-20',
  })
}
