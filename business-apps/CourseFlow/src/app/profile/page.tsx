'use client'

/**
 * User Profile Page
 * 
 * Displays and allows editing of user profile information.
 * 
 * @module app/profile/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  User,
  Mail,
  Calendar,
  BookOpen,
  FileText,
  Shield,
  Settings,
  AlertCircle,
  Check,
} from 'lucide-react'
import type { Course, Enrollment } from '@/types/database'

interface UserStats {
  instructorCourses: number
  enrolledCourses: number
  totalSubmissions: number
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState<UserStats>({ instructorCourses: 0, enrolledCourses: 0, totalSubmissions: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    if (!user) return

    try {
      // Count courses as instructor
      const { count: instructorCount } = await supabase
        .from('courseflow_courses')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', user.id)

      // Count courses enrolled in
      const { count: enrolledCount } = await supabase
        .from('courseflow_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')

      // Count submissions
      const { count: submissionCount } = await supabase
        .from('courseflow_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setStats({
        instructorCourses: instructorCount || 0,
        enrolledCourses: enrolledCount || 0,
        totalSubmissions: submissionCount || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-3xl font-bold text-white">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-slate-600">{user.email}</p>
            </div>
          </div>

          <Link href="/settings" className="btn-secondary">
            <Settings className="h-4 w-4" />
            Account Settings
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <BookOpen className="h-8 w-8 text-primary-600 mx-auto" />
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.instructorCourses}</p>
            <p className="text-sm text-slate-500">Courses Teaching</p>
          </div>
          <div className="card p-4 text-center">
            <User className="h-8 w-8 text-emerald-600 mx-auto" />
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.enrolledCourses}</p>
            <p className="text-sm text-slate-500">Courses Enrolled</p>
          </div>
          <div className="card p-4 text-center">
            <FileText className="h-8 w-8 text-amber-600 mx-auto" />
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalSubmissions}</p>
            <p className="text-sm text-slate-500">Submissions</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-900">Account Information</h2>
          </div>
          <div className="card-body">
            <dl className="divide-y divide-slate-100">
              <div className="py-3 flex justify-between">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Mail className="h-4 w-4" />
                  Email
                </dt>
                <dd className="text-slate-900">{user.email}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Calendar className="h-4 w-4" />
                  Joined
                </dt>
                <dd className="text-slate-900">{createdAt}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Shield className="h-4 w-4" />
                  Account Type
                </dt>
                <dd className="text-slate-900">
                  {user.app_metadata?.provider || 'Email'}
                </dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Check className="h-4 w-4" />
                  Email Verified
                </dt>
                <dd>
                  <span className={`badge ${user.email_confirmed_at ? 'badge-success' : 'badge-neutral'}`}>
                    {user.email_confirmed_at ? 'Verified' : 'Not verified'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/courses/new"
                className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Create a Course</p>
                  <p className="text-sm text-slate-500">Start teaching something new</p>
                </div>
              </Link>

              <Link
                href="/courses/browse"
                className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Browse Courses</p>
                  <p className="text-sm text-slate-500">Find courses to enroll in</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

