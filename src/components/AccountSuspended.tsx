import { AlertCircle, Mail, Phone } from 'lucide-react'

interface AccountSuspendedProps {
  tenantName?: string
  contactEmail?: string
  contactPhone?: string
}

export default function AccountSuspended({
  tenantName = 'This Account',
  contactEmail = 'support@acme-training.co.uk',
  contactPhone = '+44 (0) 1234 567 890'
}: AccountSuspendedProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Account Suspended
          </h1>

          {/* Message */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 mb-3">
              {tenantName}'s subscription is currently inactive.
            </p>
            <p className="text-gray-600">
              This account has been temporarily suspended. Access to the training portal and all booking systems has been disabled.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-8"></div>

          {/* Reactivation Section */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              Want to Reactivate This Account?
            </h2>
            <p className="text-gray-700 text-center mb-6">
              To restore access and resume accepting bookings, please contact our support team.
            </p>

            {/* Contact Options */}
            <div className="space-y-4">
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center justify-center gap-3 w-full bg-white border border-gray-200 rounded-lg px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="text-xs text-gray-500 uppercase font-medium">Email Us</div>
                  <div className="text-sm font-semibold text-gray-900">{contactEmail}</div>
                </div>
              </a>

              <a
                href={`tel:${contactPhone.replace(/\s/g, '')}`}
                className="flex items-center justify-center gap-3 w-full bg-white border border-gray-200 rounded-lg px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="text-xs text-gray-500 uppercase font-medium">Call Us</div>
                  <div className="text-sm font-semibold text-gray-900">{contactPhone}</div>
                </div>
              </a>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Our team is available Monday-Friday, 9am-5pm to help reactivate your account.
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Powered by <span className="font-semibold">ACME Training Platform</span>
          </p>
        </div>
      </div>
    </div>
  )
}
