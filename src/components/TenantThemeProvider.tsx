'use client'

import { useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'

interface TenantThemeProviderProps {
  children: React.ReactNode
}

export default function TenantThemeProvider({ children }: TenantThemeProviderProps) {
  const { tenant, isDemoMode } = useTenant()

  useEffect(() => {
    // Apply dynamic CSS custom properties for tenant theming
    if (tenant) {
      const root = document.documentElement
      
      // Set CSS custom properties for colors
      root.style.setProperty('--tenant-primary', tenant.primaryColor)
      root.style.setProperty('--tenant-secondary', tenant.secondaryColor)
      
      // Generate lighter/darker variations
      const primaryRgb = hexToRgb(tenant.primaryColor)
      const secondaryRgb = hexToRgb(tenant.secondaryColor)
      
      if (primaryRgb) {
        // Primary variations
        root.style.setProperty('--tenant-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`)
        root.style.setProperty('--tenant-primary-50', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.05)`)
        root.style.setProperty('--tenant-primary-100', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`)
        root.style.setProperty('--tenant-primary-200', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`)
        root.style.setProperty('--tenant-primary-300', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`)
        root.style.setProperty('--tenant-primary-600', lightenDarkenColor(tenant.primaryColor, -20))
        root.style.setProperty('--tenant-primary-700', lightenDarkenColor(tenant.primaryColor, -40))
        root.style.setProperty('--tenant-primary-800', lightenDarkenColor(tenant.primaryColor, -60))
      }
      
      if (secondaryRgb) {
        // Secondary variations
        root.style.setProperty('--tenant-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`)
        root.style.setProperty('--tenant-secondary-50', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.05)`)
        root.style.setProperty('--tenant-secondary-100', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.1)`)
        root.style.setProperty('--tenant-secondary-200', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.2)`)
        root.style.setProperty('--tenant-secondary-600', lightenDarkenColor(tenant.secondaryColor, -20))
        root.style.setProperty('--tenant-secondary-700', lightenDarkenColor(tenant.secondaryColor, -40))
      }

      // Apply tenant-specific favicon if available
      if (tenant.logo) {
        updateFavicon(tenant.logo)
      }

      // Add tenant class to body for additional styling
      document.body.classList.add('tenant-themed')
      if (tenant.settings?.whiteLabel) {
        document.body.classList.add('white-label')
      }
    } else {
      // Reset to default theme
      const root = document.documentElement
      root.style.removeProperty('--tenant-primary')
      root.style.removeProperty('--tenant-secondary')
      root.style.removeProperty('--tenant-primary-rgb')
      root.style.removeProperty('--tenant-secondary-rgb')
      // Remove all variations
      for (let i = 50; i <= 900; i += 50) {
        root.style.removeProperty(`--tenant-primary-${i}`)
        root.style.removeProperty(`--tenant-secondary-${i}`)
      }
      
      document.body.classList.remove('tenant-themed', 'white-label')
    }

    // Cleanup on unmount
    return () => {
      if (!tenant) {
        document.body.classList.remove('tenant-themed', 'white-label')
      }
    }
  }, [tenant])

  return <>{children}</>
}

// Helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function lightenDarkenColor(color: string, amount: number): string {
  const usePound = color[0] === '#'
  const col = usePound ? color.slice(1) : color
  const num = parseInt(col, 16)
  let r = (num >> 16) + amount
  let g = (num >> 8 & 0x00FF) + amount
  let b = (num & 0x0000FF) + amount
  r = r > 255 ? 255 : r < 0 ? 0 : r
  g = g > 255 ? 255 : g < 0 ? 0 : g
  b = b > 255 ? 255 : b < 0 ? 0 : b
  return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16)
}

function updateFavicon(logoUrl: string) {
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
  if (favicon) {
    favicon.href = logoUrl
  }
}