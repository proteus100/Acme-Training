'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Lock } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  amount: number
  courseTitle: string
  customerName: string
  bookingData: any
  onSuccess: (bookingId: string) => void
  onError: (error: string) => void
}

function CheckoutForm({ amount, courseTitle, customerName, bookingData, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      })

      const { clientSecret, bookingId, error } = await response.json()

      if (error) {
        onError(error)
        setProcessing(false)
        return
      }

      // Confirm payment
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: customerName,
            email: bookingData.customer.email,
            address: {
              line1: bookingData.customer.address,
              postal_code: bookingData.customer.postcode
            }
          }
        }
      })

      if (stripeError) {
        onError(stripeError.message || 'Payment failed')
      } else {
        // Confirm payment on server
        await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentIntentId: clientSecret.split('_secret_')[0] })
        })
        
        onSuccess(bookingId)
      }
    } catch (error) {
      console.error('Payment error:', error)
      onError('An unexpected error occurred')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-lg mb-2">Payment Summary</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Course:</span>
            <span>{courseTitle}</span>
          </div>
          <div className="flex justify-between">
            <span>Student:</span>
            <span>{customerName}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>£{amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CreditCard className="inline w-4 h-4 mr-1" />
          Card Details
        </label>
        <div className="border border-gray-300 rounded-md p-3 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#374151',
                  '::placeholder': {
                    color: '#9CA3AF',
                  },
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Your UK postcode from the booking form will be used for billing</p>
      </div>

      <div className="flex items-center text-sm text-gray-600">
        <Lock className="w-4 h-4 mr-2" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          processing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          `Pay £${amount.toFixed(2)}`
        )}
      </button>

      <div className="text-center text-xs text-gray-500">
        <p>By completing this payment, you agree to our terms and conditions.</p>
        <p className="mt-1">Powered by Stripe - PCI DSS compliant</p>
      </div>
    </form>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}