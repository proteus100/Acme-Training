'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Calendar, Mail, Phone } from 'lucide-react'

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const amount = searchParams.get('amount')
  const course = searchParams.get('course')
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">ACME Training Centre</Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="hover:text-blue-200">Home</Link>
              <Link href="/courses" className="hover:text-blue-200">Courses</Link>
              <Link href="/contact" className="hover:text-blue-200">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for booking with ACME Training Centre. Your payment has been processed successfully.
          </p>

          {/* Booking Details Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Booking Details</h2>
            
            <div className="space-y-4 text-left">
              {bookingId && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Booking Reference:</span>
                  <span className="font-semibold">#{bookingId.substring(0, 8).toUpperCase()}</span>
                </div>
              )}
              
              {course && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Course:</span>
                  <span className="font-semibold">{decodeURIComponent(course)}</span>
                </div>
              )}
              
              {amount && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-green-600">£{amount}</span>
                </div>
              )}
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              What Happens Next?
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>✅ You will receive a confirmation email with all the details</li>
              <li>✅ Course materials and location details will be sent closer to the date</li>
              <li>✅ If you paid a deposit, we'll contact you about the remaining balance</li>
              <li>✅ Certificate will be issued upon successful completion</li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-100 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-center">
                <Mail className="w-4 h-4 mr-2 text-gray-600" />
                <span>info@acme-training.co.uk</span>
              </div>
              <div className="flex items-center justify-center">
                <Phone className="w-4 h-4 mr-2 text-gray-600" />
                <span>Contact us for phone support</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              For any questions about your booking, please include your booking reference in your email.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/courses"
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Browse More Courses
            </Link>
            <Link 
              href="/"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Return Home
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center text-gray-600">
            <p className="text-sm">
              This page can be bookmarked for your records. A copy of these details has been sent to your email.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}