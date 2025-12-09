'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Bell,
  User,
  ExternalLink,
  CalendarCheck,
  Package
} from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  primaryColor: string
  secondaryColor: string
  logo?: string
}

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchTenant()
  }, [params.slug])

  const fetchTenant = async () => {
    try {
      const response = await fetch(`/api/tenant/${params.slug}`)
      const data = await response.json()
      if (data.success) {
        setTenant(data.tenant)
      }
    } catch (error) {
      console.error('Error fetching tenant:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: `/${params.slug}/admin`, icon: LayoutDashboard },
    { name: 'Students', href: `/${params.slug}/admin/students`, icon: Users },
    { name: 'Courses', href: `/${params.slug}/admin/courses`, icon: BookOpen },
    { name: 'Bundles', href: `/${params.slug}/admin/bundles`, icon: Package },
    { name: 'Sessions', href: `/${params.slug}/admin/sessions`, icon: CalendarCheck },
    { name: 'Bookings', href: `/${params.slug}/admin/bookings`, icon: Calendar },
    { name: 'Billing', href: `/${params.slug}/admin/billing`, icon: CreditCard },
    { name: 'Settings', href: `/${params.slug}/admin/settings`, icon: Settings },
    { name: 'View Public Website', href: `/${params.slug}`, icon: ExternalLink, external: true },
  ]

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl transition ease-in-out duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center">
                {tenant.logo ? (
                  <img className="h-8 w-8 rounded-full" src={tenant.logo} alt={tenant.name} />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {tenant.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="ml-2 text-lg font-semibold text-gray-900">{tenant.name}</span>
              </div>
            </div>
            
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href && !item.external
                const isFirstExternal = item.external && navigation[index - 1] && !navigation[index - 1].external
                return (
                  <div key={item.name}>
                    {isFirstExternal && (
                      <div className="border-t border-gray-200 my-2"></div>
                    )}
                    <Link
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500'
                          : item.external
                          ? 'text-green-600 hover:bg-green-50 hover:text-green-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${
                        isActive 
                          ? 'text-blue-500' 
                          : item.external 
                          ? 'text-green-500 group-hover:text-green-600' 
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      {item.name}
                    </Link>
                  </div>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              {tenant.logo ? (
                <img className="h-8 w-8 rounded-full" src={tenant.logo} alt={tenant.name} />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {tenant.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="ml-2 text-lg font-semibold text-gray-900">{tenant.name}</span>
            </div>
            
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href && !item.external
                const isFirstExternal = item.external && navigation[index - 1] && !navigation[index - 1].external
                return (
                  <div key={item.name}>
                    {isFirstExternal && (
                      <div className="border-t border-gray-200 my-2"></div>
                    )}
                    <Link
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500'
                          : item.external
                          ? 'text-green-600 hover:bg-green-50 hover:text-green-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${
                        isActive 
                          ? 'text-blue-500' 
                          : item.external 
                          ? 'text-green-500 group-hover:text-green-600' 
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      {item.name}
                    </Link>
                  </div>
                )
              })}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <User className="inline-block h-8 w-8 rounded-full text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    Training Center Admin
                  </p>
                  <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                    Manage courses & students
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}