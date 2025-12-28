'use client'

/**
 * Enroll with Code Page
 * 
 * Allows users to enroll in courses using an enrollment code.
 * 
 * @module app/courses/enroll/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  Key,
  AlertCircle,
  CheckCircle,
  BookOpen,
} from 'lucide-react'
import type { Course } from '@/types/database'

export default function EnrollWithCodePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [enrollmentCode, setEnrollmentCode] = useState('')
  const [foundCourse, setFoundCourse] = useState<Course | null>(null)
  const [searching, setSearching] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const searchCourse = async () => {
    if (!enrollmentCode.trim() || !user) return

    setSearching(true)
    setError(null)
    setFoundCourse(null)
    setAlreadyEnrolled(false)

    // Find course by enrollment code
    const { data: course, error: courseError } = await supabase
      .from('courseflow_courses')
      .select('*')
      .eq('enrollment_code', enrollmentCode.trim().toUpperCase())
      .single()

    if (courseError || !course) {
      setError('No course found with this enrollment code')
      setSearching(false)
      return
    }

    // Check if already enrolled
    const { data: enrollment } = await supabase
      .from('courseflow_enrollments')
      .select('*')
      .eq('course_id', course.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (enrollment) {
      setAlreadyEnrolled(true)
    }

    setFoundCourse(course)
    setSearching(false)
  }

  const handleEnroll = async () => {
    if (!foundCourse || !user) return

    setEnrolling(true)
    setError(null)

    // Check max enrollments
    if (foundCourse.max_enrollments) {
      const { count } = await supabase
        .from('courseflow_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', foundCourse.id)
        .eq('status', 'active')

      if (count && count >= foundCourse.max_enrollments) {
        setError('This course has reached its maximum enrollment capacity')
        setEnrolling(false)
        return
      }
    }

    const { error: enrollError } = await supabase
      .from('courseflow_enrollments')
      .insert({
        course_id: foundCourse.id,
        user_id: user.id,
        status: 'active',
      })

    if (enrollError) {
      setError(enrollError.message)
      setEnrolling(false)
      return
    }

    // Redirect to course
    router.push(`/courses/${foundCourse.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">Enroll with Code</h1>
          <p className="text-slate-600 mt-1">
            Enter the enrollment code provided by your instructor
          </p>
        </div>

        {/* Search Form */}
        <div className="card p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="code" className="label">Enrollment Code</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                id="code"
                value={enrollmentCode}
                onChange={(e) => {
                  setEnrollmentCode(e.target.value.toUpperCase())
                  setFoundCourse(null)
                  setError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && searchCourse()}
                className="input pl-10 uppercase font-mono tracking-wider"
                placeholder="XXXXXX"
                maxLength={10}
              />
            </div>
          </div>

          <button
            onClick={searchCourse}
            className="btn-primary w-full justify-center"
            disabled={searching || !enrollmentCode.trim()}
          >
            {searching ? 'Searching...' : 'Find Course'}
          </button>
        </div>

        {/* Found Course */}
        {foundCourse && (
          <div className="card overflow-hidden">
            {/* Course Header */}
            <div className="aspect-[3/1] bg-gradient-to-br from-primary-500 to-primary-700 relative">
              {foundCourse.cover_image_url ? (
                <img
                  src={foundCourse.cover_image_url}
                  alt={foundCourse.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-white/50" />
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{foundCourse.title}</h2>
                {foundCourse.description && (
                  <p className="text-slate-600 mt-2">{foundCourse.description}</p>
                )}
              </div>

              {alreadyEnrolled ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-800">Already Enrolled</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      You're already enrolled in this course.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    Click the button below to enroll in this course. You'll get immediate access
                    to all course materials.
                  </p>
                </div>
              )}

              {alreadyEnrolled ? (
                <Link
                  href={`/courses/${foundCourse.id}`}
                  className="btn-primary w-full justify-center"
                >
                  Go to Course
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  className="btn-primary w-full justify-center"
                  disabled={enrolling}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-center text-sm text-slate-500">
          <p>Don't have a code?</p>
          <Link href="/courses/browse" className="text-primary-600 hover:text-primary-700">
            Browse public courses
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

