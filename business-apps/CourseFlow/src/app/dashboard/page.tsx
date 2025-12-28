'use client'

/**
 * Dashboard Page
 * 
 * Main dashboard showing user's courses, upcoming assignments, and recent activity.
 * 
 * @module app/dashboard/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  BookOpen,
  FileText,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  Users,
  Video,
  TrendingUp,
} from 'lucide-react'
import type { Course, Assignment, Enrollment, LiveSession } from '@/types/database'

interface DashboardData {
  instructorCourses: Course[]
  enrolledCourses: Course[]
  upcomingAssignments: (Assignment & { course_title?: string })[]
  upcomingSessions: (LiveSession & { course_title?: string })[]
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<DashboardData>({
    instructorCourses: [],
    enrolledCourses: [],
    upcomingAssignments: [],
    upcomingSessions: [],
  })
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      // Load courses where user is instructor
      const { data: instructorCourses } = await supabase
        .from('courseflow_courses')
        .select('*')
        .eq('instructor_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5)

      // Load enrollments
      const { data: enrollments } = await supabase
        .from('courseflow_enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      // Load enrolled courses
      let enrolledCourses: Course[] = []
      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.course_id)
        const { data: courses } = await supabase
          .from('courseflow_courses')
          .select('*')
          .in('id', courseIds)
          .eq('status', 'active')
          .limit(5)
        enrolledCourses = courses || []
      }

      // Load upcoming assignments (due in next 7 days)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      const allCourseIds = [
        ...(instructorCourses?.map(c => c.id) || []),
        ...(enrollments?.map(e => e.course_id) || []),
      ]

      let upcomingAssignments: any[] = []
      if (allCourseIds.length > 0) {
        const { data: assignments } = await supabase
          .from('courseflow_assignments')
          .select('*')
          .in('course_id', allCourseIds)
          .eq('status', 'published')
          .gte('due_date', new Date().toISOString())
          .lte('due_date', nextWeek.toISOString())
          .order('due_date', { ascending: true })
          .limit(5)

        upcomingAssignments = assignments || []
      }

      // Load upcoming live sessions
      let upcomingSessions: any[] = []
      if (allCourseIds.length > 0) {
        const { data: sessions } = await supabase
          .from('courseflow_live_sessions')
          .select('*')
          .in('course_id', allCourseIds)
          .in('status', ['scheduled', 'live'])
          .gte('scheduled_start_at', new Date().toISOString())
          .order('scheduled_start_at', { ascending: true })
          .limit(5)

        upcomingSessions = sessions || []
      }

      setData({
        instructorCourses: instructorCourses || [],
        enrolledCourses,
        upcomingAssignments,
        upcomingSessions,
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
  const hasNoCourses = data.instructorCourses.length === 0 && data.enrolledCourses.length === 0

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-slate-600 mt-1">
            Here's what's happening in your courses
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.instructorCourses.length}</p>
                <p className="text-sm text-slate-500">Teaching</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.enrolledCourses.length}</p>
                <p className="text-sm text-slate-500">Enrolled</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.upcomingAssignments.length}</p>
                <p className="text-sm text-slate-500">Due Soon</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.upcomingSessions.length}</p>
                <p className="text-sm text-slate-500">Live Sessions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {hasNoCourses && (
          <div className="card p-12 text-center">
            <BookOpen className="h-16 w-16 text-slate-300 mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900 mt-4">Get Started with CourseFlow</h2>
            <p className="text-slate-600 mt-2 max-w-md mx-auto">
              Create your first course to start teaching, or browse available courses to start learning.
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <Link href="/courses/new" className="btn-primary">
                <Plus className="h-4 w-4" />
                Create Course
              </Link>
              <Link href="/courses/browse" className="btn-secondary">
                Browse Courses
              </Link>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* My Courses */}
          {(data.instructorCourses.length > 0 || data.enrolledCourses.length > 0) && (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">My Courses</h2>
                <Link href="/courses" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {/* Instructor courses */}
                {data.instructorCourses.slice(0, 3).map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{course.title}</p>
                      <p className="text-sm text-slate-500">Instructor</p>
                    </div>
                    <span className="badge badge-primary">Teaching</span>
                  </Link>
                ))}

                {/* Enrolled courses */}
                {data.enrolledCourses.slice(0, 3).map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{course.title}</p>
                      <p className="text-sm text-slate-500">Student</p>
                    </div>
                    <span className="badge badge-success">Enrolled</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Assignments */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-slate-900">Upcoming Deadlines</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.upcomingAssignments.length > 0 ? (
                data.upcomingAssignments.map((assignment) => (
                  <Link
                    key={assignment.id}
                    href={`/courses/${assignment.course_id}/assignments/${assignment.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{assignment.title}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Due {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                    <span className="text-sm text-slate-500">{assignment.points_possible} pts</span>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-slate-500 mt-2">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Live Sessions */}
        {data.upcomingSessions.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-slate-900">Upcoming Live Sessions</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.upcomingSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/courses/${session.course_id}/sessions/${session.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    session.status === 'live'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    <Video className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{session.title}</p>
                    {session.scheduled_start_at && (
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(session.scheduled_start_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`badge ${
                    session.status === 'live' ? 'bg-red-100 text-red-700' : 'badge-primary'
                  }`}>
                    {session.status === 'live' ? '🔴 LIVE' : 'Scheduled'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
