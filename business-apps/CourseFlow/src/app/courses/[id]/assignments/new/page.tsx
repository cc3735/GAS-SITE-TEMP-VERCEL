'use client'

/**
 * Create Assignment Page
 * 
 * Allows instructors to create new assignments for their courses.
 * 
 * @module app/courses/[id]/assignments/new/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import MarkdownEditor from '@/components/MarkdownEditor'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Calendar, AlertCircle } from 'lucide-react'
import type { Course, AssignmentInsert, SubmissionType, AssignmentStatus } from '@/types/database'

export default function CreateAssignmentPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [pointsPossible, setPointsPossible] = useState(100)
  const [submissionType, setSubmissionType] = useState<SubmissionType>('file_upload')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('23:59')
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(true)
  const [latePenaltyPercent, setLatePenaltyPercent] = useState(10)
  const [allowResubmission, setAllowResubmission] = useState(true)
  const [maxSubmissions, setMaxSubmissions] = useState<number | null>(3)
  const [status, setStatus] = useState<AssignmentStatus>('draft')

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
    if (data.instructor_id !== user?.id) {
      router.push(`/courses/${courseId}`)
      return
    }

    setCourse(data)
  }

  const handleSubmit = async (e: React.FormEvent, saveAs: AssignmentStatus = 'draft') => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!title.trim()) {
      setError('Assignment title is required')
      setSaving(false)
      return
    }

    // Combine date and time
    let dueDateISO: string | null = null
    if (dueDate) {
      const dateTime = `${dueDate}T${dueTime}:00`
      dueDateISO = new Date(dateTime).toISOString()
    }

    const assignment: AssignmentInsert = {
      course_id: courseId,
      title: title.trim(),
      instructions: instructions || null,
      points_possible: pointsPossible,
      submission_type: submissionType,
      due_date: dueDateISO,
      allow_late_submissions: allowLateSubmissions,
      late_penalty_percent: allowLateSubmissions ? latePenaltyPercent : 0,
      allow_resubmission: allowResubmission,
      max_submissions: allowResubmission ? maxSubmissions : 1,
      status: saveAs,
    }

    const { data, error: insertError } = await supabase
      .from('courseflow_assignments')
      .insert(assignment)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push(`/courses/${courseId}/assignments/${data.id}`)
  }

  if (loading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {course.title}
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">Create Assignment</h1>
          <p className="text-slate-600 mt-1">Add a new assignment to your course</p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, status)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Assignment Details</h2>

            <div>
              <label htmlFor="title" className="label">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="e.g., Week 1: Introduction to React"
                required
              />
            </div>

            <MarkdownEditor
              label="Instructions"
              value={instructions}
              onChange={setInstructions}
              placeholder="Describe the assignment requirements, learning objectives, and submission guidelines..."
              minHeight="200px"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="points" className="label">Points Possible</label>
                <input
                  type="number"
                  id="points"
                  value={pointsPossible}
                  onChange={(e) => setPointsPossible(parseInt(e.target.value) || 0)}
                  className="input"
                  min="0"
                  max="1000"
                />
              </div>

              <div>
                <label htmlFor="submissionType" className="label">Submission Type</label>
                <select
                  id="submissionType"
                  value={submissionType}
                  onChange={(e) => setSubmissionType(e.target.value as SubmissionType)}
                  className="input"
                >
                  <option value="file_upload">File Upload</option>
                  <option value="text_submission">Text Entry</option>
                </select>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Due Date
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dueDate" className="label">Date</label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="dueTime" className="label">Time</label>
                <input
                  type="time"
                  id="dueTime"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Leave empty for no due date
            </p>
          </div>

          {/* Submission Settings */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Submission Settings</h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowLateSubmissions}
                  onChange={(e) => setAllowLateSubmissions(e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-slate-900">Allow late submissions</span>
                  <p className="text-sm text-slate-500">Students can submit after the due date</p>
                </div>
              </label>

              {allowLateSubmissions && (
                <div className="ml-7">
                  <label htmlFor="latePenalty" className="label">Late Penalty (%)</label>
                  <input
                    type="number"
                    id="latePenalty"
                    value={latePenaltyPercent}
                    onChange={(e) => setLatePenaltyPercent(parseInt(e.target.value) || 0)}
                    className="input w-32"
                    min="0"
                    max="100"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Deduct {latePenaltyPercent}% from late submissions
                  </p>
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowResubmission}
                  onChange={(e) => setAllowResubmission(e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-slate-900">Allow resubmissions</span>
                  <p className="text-sm text-slate-500">Students can submit multiple times</p>
                </div>
              </label>

              {allowResubmission && (
                <div className="ml-7">
                  <label htmlFor="maxSubmissions" className="label">Maximum Submissions</label>
                  <input
                    type="number"
                    id="maxSubmissions"
                    value={maxSubmissions || ''}
                    onChange={(e) => setMaxSubmissions(e.target.value ? parseInt(e.target.value) : null)}
                    className="input w-32"
                    min="1"
                    max="100"
                    placeholder="Unlimited"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Leave empty for unlimited
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href={`/courses/${courseId}`}
              className="btn-secondary"
            >
              Cancel
            </Link>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, 'draft')}
                className="btn-secondary"
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                Save as Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, 'published')}
                className="btn-primary"
                disabled={saving}
              >
                <Eye className="h-4 w-4" />
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

