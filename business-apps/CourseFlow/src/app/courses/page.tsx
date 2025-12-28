'use client'

/**
 * My Courses Page
 * 
 * Lists all courses the user is teaching or enrolled in.
 * 
 * @module app/courses/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  Plus,
  BookOpen,
  Users,
  Settings,
  ArrowRight,
  Globe,
  Lock,
  Link as LinkIcon,
  Search,
} from 'lucide-react'
import type { Course } from '@/types/database'

type CourseWithRole = Course & { role: 'instructor' | 'student' }

export default function CoursesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [courses, setCourses] = useState<CourseWithRole[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [filter, setFilter] = useState<'all' | 'teaching' | 'enrolled'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadCourses()
    }
  }, [user])

  const loadCourses = async () => {
    if (!user) return

    try {
      // Load courses where user is instructor
      const { data: instructorCourses } = await supabase
        .from('courseflow_courses')
        .select('*')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false })

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
        enrolledCourses = courses || []
      }

      // Combine and tag with role
      const allCourses: CourseWithRole[] = [
        ...(instructorCourses?.map(c => ({ ...c, role: 'instructor' as const })) || []),
        ...(enrolledCourses.map(c => ({ ...c, role: 'student' as const }))),
      ]

      setCourses(allCourses)
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    // Filter by role
    if (filter === 'teaching' && course.role !== 'instructor') return false
    if (filter === 'enrolled' && course.role !== 'student') return false

    // Filter by search
    if (searchQuery) {
      return course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             course.description?.toLowerCase().includes(searchQuery.toLowerCase())
    }

    return true
  })

  const instructorCount = courses.filter(c => c.role === 'instructor').length
  const studentCount = courses.filter(c => c.role === 'student').length

  if (loading || loadingCourses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
            <p className="text-slate-600 mt-1">
              {instructorCount} teaching · {studentCount} enrolled
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/courses/enroll" className="btn-secondary">
              <LinkIcon className="h-4 w-4" />
              Enter Code
            </Link>
            <Link href="/courses/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              Create Course
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'teaching', label: 'Teaching' },
              { value: 'enrolled', label: 'Enrolled' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 py-2"
              />
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">
              {searchQuery ? 'No courses found' : 'No courses yet'}
            </h3>
            <p className="mt-2 text-slate-600">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first course or browse available courses to get started'}
            </p>
            {!searchQuery && (
              <div className="flex justify-center gap-4 mt-6">
                <Link href="/courses/new" className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Create Course
                </Link>
                <Link href="/courses/browse" className="btn-secondary">
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function CourseCard({ course }: { course: CourseWithRole }) {
  const getVisibilityIcon = () => {
    switch (course.visibility) {
      case 'public':
        return Globe
      case 'private':
        return Lock
      case 'unlisted':
        return LinkIcon
    }
  }

  const VisibilityIcon = getVisibilityIcon()

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Cover */}
      <div className="aspect-video bg-gradient-to-br from-primary-500 to-primary-700 relative">
        {course.cover_image_url ? (
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-white/50" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`badge ${
            course.role === 'instructor' ? 'bg-primary-600 text-white' : 'bg-emerald-600 text-white'
          }`}>
            {course.role === 'instructor' ? 'Teaching' : 'Enrolled'}
          </span>
        </div>

        {/* Archived overlay */}
        {course.status === 'archived' && (
          <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
            <span className="badge bg-slate-800 text-white">Archived</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 truncate flex-1">{course.title}</h3>
          <VisibilityIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
        </div>

        {course.description && (
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{course.description}</p>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
          <Link
            href={`/courses/${course.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 group-hover:gap-2 transition-all"
          >
            {course.role === 'instructor' ? 'Manage' : 'Open'}
            <ArrowRight className="h-4 w-4" />
          </Link>

          {course.role === 'instructor' && (
            <Link
              href={`/courses/${course.id}/settings`}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
