'use client'

/**
 * Browse Public Courses Page
 * 
 * Allows users to discover and browse publicly available courses.
 * 
 * @module app/courses/browse/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  Search,
  BookOpen,
  Users,
  Clock,
  ArrowRight,
  Filter,
  Globe,
} from 'lucide-react'
import type { Course } from '@/types/database'

type CourseWithStats = Course & {
  enrollment_count?: number
}

export default function BrowseCoursesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadCourses()
      loadEnrollments()
    }
  }, [user])

  const loadCourses = async () => {
    // Load public courses
    const { data } = await supabase
      .from('courseflow_courses')
      .select('*')
      .eq('visibility', 'public')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    setCourses(data || [])
    setLoadingCourses(false)
  }

  const loadEnrollments = async () => {
    if (!user) return

    const { data } = await supabase
      .from('courseflow_enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (data) {
      setEnrolledCourseIds(new Set(data.map(e => e.course_id)))
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const isEnrolled = (courseId: string) => enrolledCourseIds.has(courseId)
  const isInstructor = (course: Course) => course.instructor_id === user?.id

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
            <h1 className="text-2xl font-bold text-slate-900">Browse Courses</h1>
            <p className="text-slate-600 mt-1">Discover and enroll in public courses</p>
          </div>

          <Link href="/courses/enroll" className="btn-secondary">
            Have an enrollment code?
          </Link>
        </div>

        {/* Search */}
        <div className="card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={isEnrolled(course.id)}
                isInstructor={isInstructor(course)}
              />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Globe className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">
              {searchQuery ? 'No courses found' : 'No public courses yet'}
            </h3>
            <p className="mt-2 text-slate-600">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Check back later for new courses'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function CourseCard({
  course,
  isEnrolled,
  isInstructor,
}: {
  course: CourseWithStats
  isEnrolled: boolean
  isInstructor: boolean
}) {
  return (
    <div className="card overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
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
        {isInstructor && (
          <div className="absolute top-2 right-2">
            <span className="badge bg-white text-slate-700 text-xs">Your Course</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 truncate">{course.title}</h3>
        {course.description && (
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{course.description}</p>
        )}

        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {new Date(course.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Action */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          {isInstructor ? (
            <Link
              href={`/courses/${course.id}`}
              className="btn-secondary w-full justify-center"
            >
              Manage Course
            </Link>
          ) : isEnrolled ? (
            <Link
              href={`/courses/${course.id}`}
              className="btn-primary w-full justify-center"
            >
              Go to Course
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={`/courses/${course.id}/enroll`}
              className="btn-primary w-full justify-center"
            >
              Enroll Now
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

