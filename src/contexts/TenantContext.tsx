'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { TenantConfig } from '@/lib/tenant'

interface TenantContextValue {
  tenant: TenantConfig | null
  isLoading: boolean
  isDemoMode: boolean
  error: string | null
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined)

interface TenantProviderProps {
  children: React.ReactNode
  tenantSlug?: string
  isDemoMode?: boolean
}

export function TenantProvider({ children, tenantSlug, isDemoMode = false }: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTenant() {
      if (!tenantSlug) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch(`/api/tenant/${tenantSlug}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch tenant configuration')
        }

        const data = await response.json()
        
        if (data.success) {
          setTenant(data.tenant)
        } else {
          throw new Error(data.error || 'Unknown error')
        }

      } catch (err) {
        console.error('Error fetching tenant:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTenant()
  }, [tenantSlug])

  const value: TenantContextValue = {
    tenant,
    isLoading,
    isDemoMode,
    error
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

// Hook to use tenant context
export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

// Hook for tenant-specific styling
export function useTenantStyles() {
  const { tenant, isDemoMode } = useTenant()

  const styles = {
    primaryColor: tenant?.primaryColor || '#1e40af',
    secondaryColor: tenant?.secondaryColor || '#dc2626',
    companyName: tenant?.name || 'ACME Training',
    logo: tenant?.logo,
    isWhiteLabel: tenant?.settings?.whiteLabel || false
  }

  return { ...styles, isDemoMode }
}

// Hook for tenant-specific branding
export function useTenantBranding() {
  const { tenant, isDemoMode } = useTenant()

  return {
    companyName: tenant?.name || 'ACME Training',
    email: tenant?.email || 'info@acmetraining.co.uk',
    phone: tenant?.phone,
    address: tenant?.address,
    city: tenant?.city,
    postcode: tenant?.postcode,
    logo: tenant?.logo,
    website: tenant?.domain ? `https://${tenant.domain}` : undefined,
    isWhiteLabel: tenant?.settings?.whiteLabel || false,
    isDemoMode
  }
}