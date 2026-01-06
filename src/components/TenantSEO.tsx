'use client'

import Head from 'next/head'
import { useTenant } from '@/contexts/TenantContext'

interface TenantSEOProps {
  pageTitle?: string
  pageDescription?: string
  pageKeywords?: string
  canonicalUrl?: string
}

export default function TenantSEO({ 
  pageTitle, 
  pageDescription, 
  pageKeywords,
  canonicalUrl 
}: TenantSEOProps) {
  const { tenant } = useTenant()

  if (!tenant) return null

  // Parse JSON fields
  const mainServices = tenant.mainServices ? JSON.parse(tenant.mainServices) : []
  const serviceAreas = tenant.serviceAreas ? JSON.parse(tenant.serviceAreas) : []
  const nearbyAreas = tenant.nearbyAreas ? JSON.parse(tenant.nearbyAreas) : []
  const accreditations = tenant.accreditations ? JSON.parse(tenant.accreditations) : []

  // Build dynamic meta content
  const title = pageTitle || tenant.metaTitle || 
    `${tenant.name} | Professional ${tenant.businessType} in ${tenant.city}, ${tenant.county}`
  
  const description = pageDescription || tenant.metaDescription || 
    `Leading ${tenant.businessType?.toLowerCase()} provider in ${tenant.city}. ${tenant.yearsExperience}+ years experience. ${mainServices.slice(0, 3).join(', ')}. Book your course today.`
  
  const keywords = pageKeywords || tenant.metaKeywords || 
    `${tenant.businessType?.toLowerCase()}, ${tenant.city?.toLowerCase()}, ${tenant.county?.toLowerCase()}, ${mainServices.slice(0, 5).join(', ').toLowerCase()}`

  const siteUrl = tenant.domain ? `https://${tenant.domain}` : 'https://example.com'
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl

  // Generate structured data for local business
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": tenant.name,
    "description": description,
    "url": siteUrl,
    "telephone": tenant.phone,
    "email": tenant.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": tenant.address,
      "addressLocality": tenant.city,
      "addressRegion": tenant.county,
      "postalCode": tenant.postcode,
      "addressCountry": "GB"
    },
    "geo": tenant.latitude && tenant.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": tenant.latitude,
      "longitude": tenant.longitude
    } : undefined,
    "areaServed": serviceAreas.map((area: string) => ({
      "@type": "City",
      "name": area
    })),
    "serviceType": mainServices,
    "hasCredential": accreditations.map((acc: string) => ({
      "@type": "EducationalOccupationalCredential",
      "name": acc
    })),
    "foundingDate": tenant.yearsExperience ? new Date(new Date().getFullYear() - tenant.yearsExperience, 0, 1).toISOString().split('T')[0] : undefined,
    "logo": tenant.logo,
    "image": tenant.logo,
    "priceRange": "££",
    "openingHours": tenant.businessHours ? JSON.parse(tenant.businessHours) : undefined,
    "sameAs": tenant.socialLinks ? Object.values(JSON.parse(tenant.socialLinks)) : undefined
  }

  // Clean up undefined values
  const cleanStructuredData = JSON.parse(JSON.stringify(structuredData))

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <link rel="canonical" href={fullCanonicalUrl} />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={fullCanonicalUrl} />
        <meta property="og:type" content="business.business" />
        <meta property="og:site_name" content={tenant.name} />
        {tenant.logo && <meta property="og:image" content={tenant.logo} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {tenant.logo && <meta name="twitter:image" content={tenant.logo} />}
        
        {/* Local Business Tags */}
        <meta name="geo.region" content={`GB-${tenant.county}`} />
        <meta name="geo.placename" content={tenant.city} />
        {tenant.latitude && <meta name="geo.position" content={`${tenant.latitude};${tenant.longitude}`} />}
        <meta name="ICBM" content={`${tenant.latitude},${tenant.longitude}`} />
        
        {/* Business Specific */}
        <meta name="business:contact_data:locality" content={tenant.city} />
        <meta name="business:contact_data:region" content={tenant.county} />
        <meta name="business:contact_data:postal_code" content={tenant.postcode} />
        <meta name="business:contact_data:country_name" content="United Kingdom" />
        
        {/* Favicon */}
        {tenant.logo && <link rel="icon" href={tenant.logo} />}
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanStructuredData) }}
        />
      </Head>
    </>
  )
}

// Hook for generating page-specific SEO
export function useTenantSEO(pageData?: {
  title?: string
  description?: string
  keywords?: string
  path?: string
}) {
  const { tenant } = useTenant()

  if (!tenant) return null

  const mainServices = tenant.mainServices ? JSON.parse(tenant.mainServices) : []
  const serviceAreas = tenant.serviceAreas ? JSON.parse(tenant.serviceAreas) : []

  // Generate page-specific content
  const generatePageSEO = (pageType: 'home' | 'courses' | 'contact' | 'about') => {
    switch (pageType) {
      case 'home':
        return {
          title: tenant.metaTitle || `${tenant.name} | Professional ${tenant.businessType} in ${tenant.city}`,
          description: tenant.metaDescription || `Leading ${tenant.businessType?.toLowerCase()} in ${tenant.city}. ${tenant.yearsExperience}+ years experience. ${mainServices.slice(0, 3).join(', ')}.`,
          keywords: `${tenant.businessType?.toLowerCase()}, ${tenant.city?.toLowerCase()}, ${mainServices.slice(0, 5).join(', ').toLowerCase()}`
        }
      
      case 'courses':
        return {
          title: `Training Courses | ${tenant.name} | ${tenant.city}`,
          description: `Professional training courses in ${tenant.city}. ${mainServices.join(', ')}. Book your ${tenant.businessType?.toLowerCase()} course today.`,
          keywords: `training courses ${tenant.city?.toLowerCase()}, ${mainServices.join(', ').toLowerCase()}`
        }
      
      case 'contact':
        return {
          title: `Contact Us | ${tenant.name} | ${tenant.city}, ${tenant.county}`,
          description: `Contact ${tenant.name} for professional training in ${tenant.city}. Call ${tenant.phone} or visit us at ${tenant.address}.`,
          keywords: `contact ${tenant.name.toLowerCase()}, ${tenant.city?.toLowerCase()} training, ${tenant.phone}`
        }
      
      case 'about':
        return {
          title: `About ${tenant.name} | ${tenant.yearsExperience}+ Years Experience | ${tenant.city}`,
          description: `Learn about ${tenant.name}, ${tenant.city}'s leading ${tenant.businessType?.toLowerCase()} provider. ${tenant.yearsExperience}+ years of professional training experience.`,
          keywords: `about ${tenant.name.toLowerCase()}, ${tenant.city?.toLowerCase()} training, ${tenant.yearsExperience} years experience`
        }
      
      default:
        return {
          title: tenant.metaTitle,
          description: tenant.metaDescription,
          keywords: tenant.metaKeywords
        }
    }
  }

  return {
    generatePageSEO,
    tenant,
    mainServices,
    serviceAreas
  }
}