import { redirect } from 'next/navigation'

export default function TenantAdminRedirect() {
  // Redirect to the admin login page
  // The middleware will handle tenant detection from the URL path
  redirect('/admin/login')
}
