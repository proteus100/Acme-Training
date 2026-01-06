'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Mail, ArrowRight, Sparkles } from 'lucide-react'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const tenantSlug = searchParams.get('tenant')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // In production, use subdomain URLs. In development, use path-based URLs.
  const isProduction = baseUrl.includes('trainkit.co.uk')

  let tenantAdminUrl: string | null = null
  let tenantPublicUrl: string | null = null

  if (tenantSlug) {
    if (isProduction) {
      // Production: Use subdomain (e.g., https://acme.trainkit.co.uk/admin)
      tenantAdminUrl = `https://${tenantSlug}.trainkit.co.uk/admin`
      tenantPublicUrl = `https://${tenantSlug}.trainkit.co.uk`
    } else {
      // Development: Use path-based routing (e.g., http://localhost:3003/acme/admin)
      tenantAdminUrl = `${baseUrl}/${tenantSlug}/admin`
      tenantPublicUrl = `${baseUrl}/${tenantSlug}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to TrainKit!</h1>
          <p className="text-xl text-gray-600">Your account has been created successfully</p>
        </div>

        {/* Success Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="space-y-6">
            {/* Trial Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Sparkles className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">14-Day Free Trial Started</h3>
                  <p className="text-sm text-blue-800">
                    Explore all features risk-free. No charges until {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            </div>

            {/* Email Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Check Your Email</h3>
                  <p className="text-sm text-green-800">
                    We've sent you a password setup link. Check your inbox to set up your admin account.
                  </p>
                </div>
              </div>
            </div>

            {/* Access URLs */}
            {tenantSlug && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Your TrainKit URLs:</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Admin Portal:</label>
                    <div className="flex items-center mt-1">
                      <input
                        type="text"
                        value={tenantAdminUrl || ''}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                      {tenantAdminUrl && (
                        <Link
                          href={tenantAdminUrl}
                          target="_blank"
                          className="ml-2 text-blue-600 hover:text-blue-700"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Public Site:</label>
                    <div className="flex items-center mt-1">
                      <input
                        type="text"
                        value={tenantPublicUrl || ''}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                      {tenantPublicUrl && (
                        <Link
                          href={tenantPublicUrl}
                          target="_blank"
                          className="ml-2 text-blue-600 hover:text-blue-700"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Next Steps:</h3>
              <ol className="space-y-3">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                    1
                  </span>
                  <span className="text-gray-700">
                    Check your email and click the link to set up your password
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                    2
                  </span>
                  <span className="text-gray-700">
                    Log in to your admin portal and complete your profile
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                    3
                  </span>
                  <span className="text-gray-700">
                    Add your first course and start accepting bookings
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {tenantAdminUrl ? (
            <Link
              href={tenantAdminUrl}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-center"
            >
              Go to Admin Portal
            </Link>
          ) : (
            <Link
              href="/admin/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-center"
            >
              Go to Login
            </Link>
          )}
          <a
            href="mailto:support@trainkit.co.uk"
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors text-center"
          >
            Contact Support
          </a>
        </div>

        {/* Support Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Need help getting started?{' '}
            <a href="mailto:support@trainkit.co.uk" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
