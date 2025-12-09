"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
	LayoutDashboard,
	BookOpen,
	Users,
	Calendar,
	BarChart3,
	Settings,
	LogOut,
	Menu,
	X,
	User,
	Shield,
	Mail,
	ClipboardList,
	Building2,
} from "lucide-react";

interface Tenant {
	id: string;
	name: string;
	slug: string;
	logo: string | null;
	primaryColor: string;
	secondaryColor: string;
}

interface AdminUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	tenantId: string | null;
	tenant: Tenant | null;
}

const navigation = [
	{ name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
	{
		name: "👑 Manage Tenants",
		href: "/admin/tenants",
		icon: Building2,
		isPlatformAdmin: true,
	},
	{ name: "Courses", href: "/admin/courses", icon: BookOpen },
	{ name: "Training Sessions", href: "/admin/sessions", icon: ClipboardList },
	{ name: "Students", href: "/admin/customers", icon: Users },
	{ name: "Bookings", href: "/admin/bookings", icon: Calendar },
	{ name: "Certifications", href: "/admin/certifications", icon: Shield },
	{ name: "Email Templates", href: "/admin/email-templates", icon: Mail },
	{ name: "Reports", href: "/admin/reports", icon: BarChart3 },
	{ name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [admin, setAdmin] = useState<AdminUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	// Skip auth check for login and password reset pages
	const isPublicPage = pathname === "/admin/login" ||
	                     pathname === "/admin/forgot-password" ||
	                     pathname === "/admin/reset-password";

	useEffect(() => {
		if (isPublicPage) {
			setIsLoading(false);
			return;
		}

		checkAuth();
	}, [isPublicPage]);

	const checkAuth = async () => {
		try {
			const response = await fetch("/api/admin/me");
			if (response.ok) {
				const data = await response.json();
				setAdmin(data.admin);
			} else {
				router.push("/admin/login");
			}
		} catch (error) {
			console.error("Auth check failed:", error);
			router.push("/admin/login");
		} finally {
			setIsLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			await fetch("/api/admin/logout", { method: "POST" });
			router.push("/admin/login");
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	if (isPublicPage) {
		return children;
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="flex items-center gap-3">
					<div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
					<span className="text-gray-600">Loading...</span>
				</div>
			</div>
		);
	}

	if (!admin) {
		return null;
	}

	// Determine branding
	const isPlatformAdmin = admin.role === "SUPER_ADMIN" && !admin.tenantId;
	const brandColor = admin.tenant?.primaryColor || "#1e40af"; // Default blue
	const brandName = admin.tenant?.name || "Platform Manager";
	const brandLogo = admin.tenant?.logo;

	// PLATFORM ADMIN: Light Theme with Blue Branding
	if (isPlatformAdmin) {
		return (
			<div className="min-h-screen bg-gray-50 flex">
				{/* Platform admin styles */}
				<style jsx global>{`
					:root {
						--platform-primary: #3b82f6;
						--platform-secondary: #8b5cf6;
						--platform-accent: #06b6d4;
					}
				`}</style>

				{/* Mobile sidebar backdrop */}
				{sidebarOpen && (
					<div
						className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
				)}

				{/* Sidebar - Light Theme */}
				<div
					className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex-shrink-0 lg:h-screen lg:sticky lg:top-0 border-r border-gray-200 ${
						sidebarOpen ? "translate-x-0" : "-translate-x-full"
					}`}
				>
					<div className="flex h-full flex-col overflow-hidden">
						{/* Platform Admin Logo */}
						<div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
							<div className="flex items-center gap-3 overflow-hidden">
								<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
									<Shield className="w-6 h-6 text-white" />
								</div>
								<div className="flex flex-col">
									<span className="text-lg font-bold text-gray-900 tracking-tight">
										Platform Manager
									</span>
									<span className="text-xs text-blue-600 font-semibold">
										Super Admin
									</span>
								</div>
							</div>
							<button
								onClick={() => setSidebarOpen(false)}
								className="lg:hidden p-1 rounded-md hover:bg-gray-100 flex-shrink-0"
							>
								<X className="w-5 h-5 text-gray-600" />
							</button>
						</div>

						{/* Navigation - Light Theme */}
						<nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
							{navigation.map((item) => {
								const Icon = item.icon;
								const isActive = pathname === item.href;
								const isItemPlatformOnly =
									"isPlatformAdmin" in item && item.isPlatformAdmin;

								// Hide platform-only items from tenant admins
								if (isItemPlatformOnly && !isPlatformAdmin) {
									return null;
								}

								return (
									<a
										key={item.name}
										href={item.href}
										className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
											isItemPlatformOnly
												? isActive
													? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
													: "text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300"
												: isActive
												? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50"
												: "text-gray-700 bg-gray-50 hover:bg-gray-100 hover:shadow-sm"
										}`}
									>
										<Icon className="w-5 h-5" />
										{item.name}
									</a>
								);
							})}
						</nav>

						{/* User info - Light Theme */}
						<div className="p-4 border-t border-gray-200 bg-white">
							<div className="p-4 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
								<div className="flex items-center gap-3 mb-3">
									<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
										<User className="w-5 h-5 text-white" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-gray-900 truncate">
											{admin.firstName} {admin.lastName}
										</p>
										<p className="text-xs text-gray-600 truncate">{admin.email}</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
										⚡ SUPER ADMIN
									</span>
								</div>
							</div>
							<button
								onClick={handleLogout}
								className="w-full mt-3 flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
							>
								<LogOut className="w-5 h-5" />
								Sign Out
							</button>
						</div>
					</div>
				</div>

				{/* Main content - Light Theme */}
				<div className="flex-1 flex flex-col min-w-0">
					{/* Top bar - Light Theme */}
					<div className="sticky top-0 z-30 bg-white shadow-md border-b border-gray-200">
						<div className="flex h-16 items-center justify-between px-6">
							<button
								onClick={() => setSidebarOpen(true)}
								className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
							>
								<Menu className="w-5 h-5" />
							</button>

							<div className="flex items-center gap-4">
								<div className="bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 rounded-full shadow-sm">
									<span className="text-xs text-white font-bold uppercase tracking-wide">
										🔒 Master Administrator
									</span>
								</div>
								<span className="text-sm text-gray-600">
									Welcome, <span className="text-gray-900 font-semibold">{admin.firstName}</span>!
								</span>
							</div>
						</div>
					</div>

					{/* Page content - Light Gray Background */}
					<main className="flex-1 px-6 pb-6 overflow-x-hidden bg-gray-100">{children}</main>
				</div>
			</div>
		);
	}

	// TENANT ADMIN: Light Theme with Tenant Branding
	return (
		<div className="min-h-screen bg-gray-50 flex">
			{/* Apply tenant colors as CSS custom properties */}
			<style jsx global>{`
				:root {
					--brand-primary: ${brandColor};
					--brand-secondary: ${admin.tenant?.secondaryColor || "#dc2626"};
				}
			`}</style>

			{/* Mobile sidebar backdrop */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<div
				className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex-shrink-0 lg:h-screen lg:sticky lg:top-0 ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex h-full flex-col overflow-hidden">
					{/* Logo with tenant branding */}
					<div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
						<div className="flex items-center gap-3 overflow-hidden">
							{brandLogo ? (
								<img
									src={brandLogo}
									alt={brandName}
									className="w-8 h-8 object-contain rounded"
								/>
							) : (
								<div
									className="w-8 h-8 rounded-lg flex items-center justify-center"
									style={{ backgroundColor: brandColor }}
								>
									<span className="text-white font-bold text-sm">
										{brandName.charAt(0).toUpperCase()}
									</span>
								</div>
							)}
							<span className="text-lg font-semibold text-gray-900 truncate">
								{brandName}
							</span>
						</div>
						<button
							onClick={() => setSidebarOpen(false)}
							className="lg:hidden p-1 rounded-md hover:bg-gray-100 flex-shrink-0"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Navigation */}
					<nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
						{navigation.map((item) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;
							const isItemPlatformOnly =
								"isPlatformAdmin" in item && item.isPlatformAdmin;

							// Hide platform-only items from tenant admins
							if (isItemPlatformOnly && !isPlatformAdmin) {
								return null;
							}

							return (
								<a
									key={item.name}
									href={item.href}
									className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
										isActive
											? "text-blue-700 border border-blue-200"
											: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
									}`}
									style={
										isActive
											? {
													backgroundColor: `${brandColor}15`,
													borderColor: `${brandColor}40`,
													color: brandColor,
											  }
											: {}
									}
								>
									<Icon className="w-5 h-5" />
									{item.name}
								</a>
							);
						})}
					</nav>

					{/* User info and logout */}
					<div className="p-4 border-t border-gray-200">
						<div className="p-3 rounded-lg bg-gray-50">
							<div className="flex items-center gap-3 mb-2">
								<div
									className="w-8 h-8 rounded-full flex items-center justify-center"
									style={{
										backgroundColor: `${brandColor}20`,
									}}
								>
									<User className="w-4 h-4" style={{ color: brandColor }} />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-900 truncate">
										{admin.firstName} {admin.lastName}
									</p>
									<p className="text-xs text-gray-500 truncate">{admin.email}</p>
								</div>
							</div>
							<div className="flex items-center gap-2 mt-2">
								<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">
									{admin.role.replace("_", " ")}
								</span>
								{admin.tenant && (
									<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: brandColor }}>
										{admin.tenant.slug}
									</span>
								)}
							</div>
						</div>
						<button
							onClick={handleLogout}
							className="w-full mt-3 flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
						>
							<LogOut className="w-5 h-5" />
							Sign Out
						</button>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Top bar */}
				<div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
					<div className="flex h-16 items-center justify-between px-6">
						<button
							onClick={() => setSidebarOpen(true)}
							className="lg:hidden p-1 rounded-md hover:bg-gray-100"
						>
							<Menu className="w-5 h-5" />
						</button>

						<div className="flex items-center gap-4">
							<span className="text-sm text-gray-500">
								Welcome back, {admin.firstName}!
							</span>
						</div>
					</div>
				</div>

				{/* Page content */}
				<main className="flex-1 px-6 pb-6 overflow-x-hidden">{children}</main>
			</div>
		</div>
	);
}
