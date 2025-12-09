'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Crown,
  Check,
  X,
  Zap,
  Users,
  BookOpen,
  Shield,
  BarChart3,
  Palette,
  Mail,
  Phone,
  Star,
  AlertCircle,
  CheckCircle,
  CreditCard
} from 'lucide-react'

interface TenantInfo {
  id: string
  name: string
  planType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  maxStudents: number
  maxCourses: number
  currentStudents?: number
  currentCourses?: number
}

const PLAN_FEATURES = {
  STARTER: {
    name: 'STARTER',
    price: 29,
    maxCourses: 5,
    maxStudents: 50,
    features: [
      'Up to 5 courses',
      'Up to 50 students',
      'Basic reporting',
      'Email support',
      'Online bookings',
      'Student management'
    ]
  },
  PROFESSIONAL: {
    name: 'PROFESSIONAL',
    price: 49,
    maxCourses: 15,
    maxStudents: 150,
    features: [
      'Up to 15 courses',
      'Up to 150 students',
      'Advanced reporting',
      'Priority email support',
      'Custom branding (basic)',
      'Payment processing',
      'Bulk operations',
      'Export functionality'
    ]
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    price: 149,
    maxCourses: 999999,
    maxStudents: 999999,
    features: [
      'Unlimited courses',
      'Unlimited students',
      'Advanced analytics',
      'Priority phone support',
      'Full custom branding',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'Advanced automation'
    ]
  }
}

export default function TenantUpgradePage() {
  const params = useParams()
  const router = useRouter()
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [upgrading, setUpgrading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTenantInfo()
  }, [params.slug])

  const fetchTenantInfo = async () => {
    try {
      const response = await fetch(`/api/tenant/${params.slug}`)
      const data = await response.json()
      
      if (data.success) {
        setTenantInfo(data.tenant)
        // Auto-select next tier up
        if (data.tenant.planType === 'STARTER') {
          setSelectedPlan('PROFESSIONAL')
        } else if (data.tenant.planType === 'PROFESSIONAL') {
          setSelectedPlan('ENTERPRISE')
        }
      }
    } catch (error) {
      console.error('Error fetching tenant info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      setMessage({ type: 'error', text: 'Please select a plan to upgrade to' })
      return
    }

    setUpgrading(true)
    setMessage(null)

    try {
      // This would typically integrate with a payment processor like Stripe
      // For now, we'll simulate the upgrade process
      const response = await fetch(`/api/tenant/${params.slug}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPlan: selectedPlan
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Plan upgrade initiated successfully! Redirecting...' })
        setTimeout(() => {
          router.push(`/${params.slug}/admin`)
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to initiate upgrade' })
      }
    } catch (error) {
      console.error('Error upgrading plan:', error)
      setMessage({ type: 'error', text: 'Failed to upgrade plan. Please try again.' })
    } finally {
      setUpgrading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const currentPlan = tenantInfo ? PLAN_FEATURES[tenantInfo.planType] : null
  const plans = Object.values(PLAN_FEATURES)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${params.slug}/admin/billing`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Crown className="w-6 h-6 text-yellow-500" />
          Upgrade Your Plan
        </h1>
        <p className="text-gray-600 mt-2">
          Choose a plan that fits your training center's needs
        </p>
      </div>

      {/* Current Plan Info */}
      {tenantInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Current Plan: {tenantInfo.planType}</h3>
              <p className="text-blue-700 text-sm">
                {tenantInfo.currentCourses || 0} of {tenantInfo.maxCourses === 999999 ? 'unlimited' : tenantInfo.maxCourses} courses • {tenantInfo.currentStudents || 0} of {tenantInfo.maxStudents === 999999 ? 'unlimited' : tenantInfo.maxStudents} students
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Plan Comparison */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = tenantInfo?.planType === plan.name
          const isSelected = selectedPlan === plan.name
          const isRecommended = tenantInfo?.planType === 'PROFESSIONAL' && plan.name === 'ENTERPRISE'
          const isDowngrade = tenantInfo && (
            (tenantInfo.planType === 'PROFESSIONAL' && plan.name === 'STARTER') ||
            (tenantInfo.planType === 'ENTERPRISE' && (plan.name === 'STARTER' || plan.name === 'PROFESSIONAL'))
          )

          return (
            <div
              key={plan.name}
              className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                isCurrentPlan
                  ? 'border-gray-300 bg-gray-50'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => !isCurrentPlan && !isDowngrade && setSelectedPlan(plan.name)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Recommended
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {plan.name === 'ENTERPRISE' && (
                    <Crown className="w-6 h-6 text-yellow-500" />
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">£{plan.price}</span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      <span>Courses:</span>
                    </div>
                    <span className="font-medium">
                      {plan.maxCourses === 999999 ? 'Unlimited' : plan.maxCourses}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>Students:</span>
                    </div>
                    <span className="font-medium">
                      {plan.maxStudents === 999999 ? 'Unlimited' : plan.maxStudents}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                {isCurrentPlan ? (
                  <div className="bg-gray-100 text-gray-600 rounded-lg px-4 py-2 text-center text-sm font-medium">
                    Your Current Plan
                  </div>
                ) : isDowngrade ? (
                  <div className="bg-gray-50 text-gray-400 rounded-lg px-4 py-2 text-center text-sm">
                    Contact Support for Downgrades
                  </div>
                ) : (
                  <button
                    className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPlan(plan.name)
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select Plan'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Upgrade Actions */}
      {selectedPlan && selectedPlan !== tenantInfo?.planType && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to upgrade?</h3>
              <p className="text-gray-600 text-sm">
                Upgrade to {selectedPlan} plan for £{PLAN_FEATURES[selectedPlan as keyof typeof PLAN_FEATURES].price}/month
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPlan('')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {upgrading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {upgrading ? 'Processing...' : 'Upgrade Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ/Help Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help Choosing?</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Contact Our Team</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>support@acme-training.co.uk</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>+44 (0) 1234 567890</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Common Questions</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Can I change my plan anytime?</li>
              <li>• What happens to my data when upgrading?</li>
              <li>• Do you offer custom enterprise solutions?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}