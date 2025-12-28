'use client'

/**
 * Course Enrollment Page
 * 
 * Allows users to enroll in a specific course directly.
 * 
 * @module app/courses/[id]/enroll/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Globe,
  Lock,
  Key,
} from 'lucide-react'
import type { Course } from '@/types/database'

export default function CourseEnrollPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [enrollmentCount, setEnrollmentCount] = useState(0)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false)
  const [enrollmentCode, setEnrollmentCode] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && courseId) {
      loadCourse()
    }
  }, [user, courseId])

  const loadCourse = async () => {
    if (!user) return

    try {
      // Load course
      const { data: courseData, error: courseError } = await supabase
        .from('courseflow_courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError || !courseData) {
        router.push('/courses/browse')
        return
      }

      // Redirect instructors to their course
      if (courseData.instructor_id === user.id) {
        router.push(`/courses/${courseId}`)
        return
      }

      setCourse(courseData)

      // Check if already enrolled
      const { data: enrollment } = await supabase
        .from('courseflow_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (enrollment) {
        setAlreadyEnrolled(true)
      }

      // Get enrollment count
      const { count } = await supabase
        .from('courseflow_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('status', 'active')

      setEnrollmentCount(count || 0)
    } catch (error) {
      console.error('Error loading course:', error)
    } finally {
      setLoadingCourse(false)
    }
  }

  const handleEnroll = async () => {
    if (!course || !user) return

    setEnrolling(true)
    setError(null)

    // Check visibility and code
    if (course.visibility === 'private') {
      if (!enrollmentCode.trim()) {
        setError('Please enter the enrollment code')
        setEnrolling(false)
        return
      }
      if (enrollmentCode.trim().toUpperCase() !== course.enrollment_code) {
        setError('Invalid enrollment code')
        setEnrolling(false)
        return
      }
    }

    // Check max enrollments
    if (course.max_enrollments && enrollmentCount >= course.max_enrollments) {
      setError('This course has reached its maximum enrollment capacity')
      setEnrolling(false)
      return
    }

    const { error: enrollError } = await supabase
      .from('courseflow_enrollments')
      .insert({
        course_id: courseId,
        user_id: user.id,
        status: 'active',
      })

    if (enrollError) {
      setError(enrollError.message)
      setEnrolling(false)
      return
    }

    // Redirect to course
    router.push(`/courses/${courseId}`)
  }

  if (loading || loadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!course) {
    return null
  }

  const isFull = course.max_enrollments && enrollmentCount >= course.max_enrollments

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/courses/browse"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Browse
          </Link>
        </div>

        {/* Course Card */}
        <div className="card overflow-hidden">
          {/* Cover */}
          <div className="aspect-[3/1] bg-gradient-to-br from-primary-500 to-primary-700 relative">
            {course.cover_image_url ? (
              <img
                src={course.cover_image_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-white/50" />
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  {course.visibility === 'public' ? (
                    <Globe className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {course.visibility.charAt(0).toUpperCase() + course.visibility.slice(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {enrollmentCount} enrolled
                  {course.max_enrollments && ` / ${course.max_enrollments}`}
                </span>
              </div>
            </div>

            {/* Description */}
            {course.description && (
              <div>
                <h2 className="font-medium text-slate-900 mb-2">About this course</h2>
                <p className="text-slate-600">{course.description}</p>
              </div>
            )}

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {alreadyEnrolled && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-800">You're enrolled!</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    You already have access to this course.
                  </p>
                </div>
              </div>
            )}

            {isFull && !alreadyEnrolled && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Course Full</p>
                  <p className="text-sm text-amber-700 mt-1">
                    This course has reached its maximum enrollment capacity.
                  </p>
                </div>
              </div>
            )}

            {/* Enrollment Code Input (for private courses) */}
            {course.visibility === 'private' && !alreadyEnrolled && !isFull && (
              <div>
                <label htmlFor="code" className="label">
                  Enrollment Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    id="code"
                    value={enrollmentCode}
                    onChange={(e) => setEnrollmentCode(e.target.value.toUpperCase())}
                    className="input pl-10 uppercase font-mono tracking-wider"
                    placeholder="Enter code"
                  />
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  This course requires an enrollment code from your instructor.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100">
              {alreadyEnrolled ? (
                <Link
                  href={`/courses/${courseId}`}
                  className="btn-primary w-full justify-center"
                >
                  Go to Course
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  className="btn-primary w-full justify-center"
                  disabled={enrolling || isFull}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

