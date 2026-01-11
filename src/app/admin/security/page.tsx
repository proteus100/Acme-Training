'use client'

import { useState, useEffect } from 'react'
import { Shield, Clock, Lock, Unlock, AlertTriangle, RefreshCw } from 'lucide-react'

interface RateLimit {
  identifier: string
  count: number
  resetTime: number
  blocked: boolean
  timeRemaining: number
}

export default function SecurityManagement() {
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState<string | null>(null)

  useEffect(() => {
    fetchRateLimits()
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchRateLimits, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchRateLimits = async () => {
    try {
      const response = await fetch('/api/admin/security/rate-limits')
      if (response.ok) {
        const data = await response.json()
        setRateLimits(data.rateLimits || [])
      }
    } catch (error) {
      console.error('Error fetching rate limits:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearRateLimit = async (identifier: string) => {
    if (!confirm(`Clear rate limit for ${identifier}?`)) return

    setClearing(identifier)
    try {
      const response = await fetch(`/api/admin/security/rate-limits?identifier=${encodeURIComponent(identifier)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from list immediately
        setRateLimits(prev => prev.filter(r => r.identifier !== identifier))
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error clearing rate limit:', error)
      alert('Failed to clear rate limit')
    } finally {
      setClearing(null)
    }
  }

  const clearAllRateLimits = async () => {
    if (!confirm('Clear ALL rate limits? This will unlock all blocked users.')) return

    setClearing('all')
    try {
      const response = await fetch('/api/admin/security/rate-limits?all=true', {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        setRateLimits([])
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error clearing all rate limits:', error)
      alert('Failed to clear rate limits')
    } finally {
      setClearing(null)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const isIpAddress = (identifier: string) => {
    return /^\d+\.\d+\.\d+\.\d+/.test(identifier) || identifier === 'unknown'
  }

  const blockedCount = rateLimits.filter(r => r.blocked).length

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Management</h1>
              <p className="text-gray-600">Rate Limiting & Access Control</p>
            </div>
          </div>
          <button
            onClick={fetchRateLimits}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Rate Limits</p>
                <p className="text-3xl font-bold text-gray-900">{rateLimits.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Blocked Accounts</p>
                <p className="text-3xl font-bold text-red-600">{blockedCount}</p>
              </div>
              <Lock className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security Status</p>
                <p className="text-xl font-semibold text-green-600">Active</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limit Configuration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Current Rate Limit Policy:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Admin Login:</strong> 5 attempts per 15 minutes → 30-minute block</li>
              <li><strong>API Endpoints:</strong> 30 requests per minute</li>
              <li><strong>Contact Forms:</strong> 5 submissions per hour</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Clear All Button */}
      {rateLimits.length > 0 && (
        <div className="mb-4">
          <button
            onClick={clearAllRateLimits}
            disabled={clearing === 'all'}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Unlock className="h-4 w-4" />
            {clearing === 'all' ? 'Clearing...' : `Clear All Rate Limits (${rateLimits.length})`}
          </button>
        </div>
      )}

      {/* Rate Limits Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Active Rate Limits
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading rate limits...
          </div>
        ) : rateLimits.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No Active Rate Limits</p>
            <p className="text-sm">All accounts are clear</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Identifier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rateLimits.map((limit) => (
                  <tr key={limit.identifier} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {limit.blocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Lock className="h-3 w-3" />
                          Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3" />
                          Limited
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-900">{limit.identifier}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {isIpAddress(limit.identifier) ? 'IP Address' : 'Email'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{limit.count}</span>
                      <span className="text-sm text-gray-500"> attempts</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {formatTime(limit.timeRemaining)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => clearRateLimit(limit.identifier)}
                        disabled={clearing === limit.identifier}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                      >
                        <Unlock className="h-3 w-3" />
                        {clearing === limit.identifier ? 'Clearing...' : 'Clear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Security Best Practices:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Rate limits automatically reset after the time period expires</li>
          <li>• Blocked users can retry after 30 minutes without intervention</li>
          <li>• Clear rate limits only for legitimate lockouts (e.g., user forgot password)</li>
          <li>• Monitor blocked IPs for potential brute force attacks</li>
          <li>• Encourage users to use strong passwords to avoid lockouts</li>
        </ul>
      </div>
    </div>
  )
}
