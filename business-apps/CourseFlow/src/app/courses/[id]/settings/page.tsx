'use client'

/**
 * Course Settings Page
 * 
 * Allows instructors to manage course settings and enrollment.
 * 
 * @module app/courses/[id]/settings/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  AlertCircle,
  Settings,
  Globe,
  Lock,
  Link as LinkIcon,
  Archive,
  RotateCcw,
} from 'lucide-react'
import type { Course, CourseVisibility, CourseStatus } from '@/types/database'

export default function CourseSettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<CourseVisibility>('private')
  const [maxEnrollments, setMaxEnrollments] = useState<string>('')
  const [status, setStatus] = useState<CourseStatus>('active')

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

    const { data, error } = await supabase
      .from('courseflow_courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (error || !data) {
      router.push('/courses')
      return
    }

    // Check if user is instructor
    if (data.instructor_id !== user.id) {
      router.push(`/courses/${courseId}`)
      return
    }

    setCourse(data)
    setTitle(data.title)
    setDescription(data.description || '')
    setVisibility(data.visibility)
    setMaxEnrollments(data.max_enrollments?.toString() || '')
    setStatus(data.status)
    setLoadingCourse(false)
  }

  const handleSave = async () => {
    if (!course) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    if (!title.trim()) {
      setError('Title is required')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('courseflow_courses')
      .update({
        title: title.trim(),
        description: description || null,
        visibility,
        max_enrollments: maxEnrollments ? parseInt(maxEnrollments) : null,
        status,
      })
      .eq('id', courseId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setCourse({ ...course, title, description, visibility, max_enrollments: maxEnrollments ? parseInt(maxEnrollments) : null, status })
    setSuccess('Settings saved!')
    setSaving(false)
  }

  const regenerateCode = async () => {
    if (!course) return

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { error } = await supabase
      .from('courseflow_courses')
      .update({ enrollment_code: newCode })
      .eq('id', courseId)

    if (!error) {
      setCourse({ ...course, enrollment_code: newCode })
      setSuccess('Enrollment code regenerated!')
    }
  }

  const copyEnrollmentCode = () => {
    if (course?.enrollment_code) {
      navigator.clipboard.writeText(course.enrollment_code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  const copyEnrollmentLink = () => {
    const link = `${window.location.origin}/courses/${courseId}/enroll`
    navigator.clipboard.writeText(link)
    setSuccess('Enrollment link copied!')
  }

  const deleteCourse = async () => {
    if (!confirm('Are you sure you want to permanently delete this course? This action cannot be undone.')) {
      return
    }

    if (!confirm('This will delete all assignments, discussions, sessions, and enrollments. Type "DELETE" to confirm.')) {
      return
    }

    const { error } = await supabase
      .from('courseflow_courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/courses')
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Link>

          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-slate-400" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Course Settings</h1>
              <p className="text-slate-600">{course.title}</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>

          <div>
            <label htmlFor="title" className="label">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="description" className="label">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[120px]"
              placeholder="Describe your course..."
            />
          </div>
        </div>

        {/* Enrollment */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Enrollment Settings</h2>

          <div>
            <label className="label mb-2">Visibility</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone can find and enroll' },
                { value: 'unlisted', icon: LinkIcon, label: 'Unlisted', desc: 'Link only, not in search' },
                { value: 'private', icon: Lock, label: 'Private', desc: 'Requires enrollment code' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-colors ${
                    visibility === opt.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={opt.value}
                    checked={visibility === opt.value}
                    onChange={() => setVisibility(opt.value as CourseVisibility)}
                    className="sr-only"
                  />
                  <opt.icon className="h-5 w-5 text-slate-600 mb-2" />
                  <span className="font-medium text-slate-900">{opt.label}</span>
                  <span className="text-xs text-slate-500 mt-1">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Enrollment Code */}
          {visibility !== 'public' && course.enrollment_code && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Enrollment Code</p>
                  <p className="text-sm text-slate-500">Share with students to join</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1.5 bg-white rounded-lg text-lg font-mono font-bold text-primary-700 border border-slate-200">
                    {course.enrollment_code}
                  </code>
                  <button
                    onClick={copyEnrollmentCode}
                    className="btn-secondary p-2"
                    title="Copy code"
                  >
                    {codeCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={regenerateCode}
                    className="btn-secondary p-2"
                    title="Regenerate code"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enrollment Link */}
          <div>
            <button
              onClick={copyEnrollmentLink}
              className="btn-secondary w-full justify-center"
            >
              <LinkIcon className="h-4 w-4" />
              Copy Enrollment Link
            </button>
          </div>

          {/* Max Enrollments */}
          <div>
            <label htmlFor="maxEnrollments" className="label">Maximum Enrollments</label>
            <input
              type="number"
              id="maxEnrollments"
              value={maxEnrollments}
              onChange={(e) => setMaxEnrollments(e.target.value)}
              className="input w-32"
              min="1"
              placeholder="Unlimited"
            />
            <p className="text-sm text-slate-500 mt-1">Leave empty for unlimited</p>
          </div>
        </div>

        {/* Course Status */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Course Status</h2>

          <div className="flex gap-3">
            <label
              className={`flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                status === 'active'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="status"
                value="active"
                checked={status === 'active'}
                onChange={() => setStatus('active')}
                className="sr-only"
              />
              <RotateCcw className="h-5 w-5 text-emerald-600" />
              <div>
                <span className="font-medium text-slate-900">Active</span>
                <p className="text-xs text-slate-500">Course is visible and accepting enrollments</p>
              </div>
            </label>

            <label
              className={`flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                status === 'archived'
                  ? 'border-slate-500 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="status"
                value="archived"
                checked={status === 'archived'}
                onChange={() => setStatus('archived')}
                className="sr-only"
              />
              <Archive className="h-5 w-5 text-slate-600" />
              <div>
                <span className="font-medium text-slate-900">Archived</span>
                <p className="text-xs text-slate-500">Course hidden, read-only for enrolled students</p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="card p-6 border-red-200 bg-red-50">
          <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
          <p className="text-sm text-red-700 mb-4">
            Once you delete a course, there is no going back. This will permanently delete all
            assignments, submissions, discussions, and enrollments.
          </p>
          <button
            onClick={deleteCourse}
            className="btn-secondary text-red-600 border-red-300 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete Course
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

