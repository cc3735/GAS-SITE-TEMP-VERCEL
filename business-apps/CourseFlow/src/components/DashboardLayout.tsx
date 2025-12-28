'use client'

/**
 * Dashboard Layout Component
 * 
 * Main layout for authenticated pages with sidebar navigation.
 * 
 * @module components/DashboardLayout
 */

import { ReactNode, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Plus,
  Globe,
} from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Courses', href: '/courses', icon: GraduationCap },
  { name: 'Browse Courses', href: '/courses/browse', icon: Globe },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
            <Link href="/dashboard" className="flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary-600" />
              <span className="text-xl font-bold text-slate-900">CourseFlow</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Create Course Button */}
          <div className="p-4">
            <Link
              href="/courses/new"
              className="btn-primary w-full justify-center py-2.5"
            >
              <Plus className="h-4 w-4" />
              Create Course
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : ''}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Settings Link */}
          <div className="p-3 border-t border-slate-200">
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/settings'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Search (placeholder) */}
            <div className="flex-1 max-w-xl mx-4 hidden sm:block">
              <input
                type="text"
                placeholder="Search courses, assignments..."
                className="input py-2"
              />
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium">
                  {userInitial}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700">
                  {userName}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-slate-200 shadow-lg z-50">
                    <div className="p-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{userName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

