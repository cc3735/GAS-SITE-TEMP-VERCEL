'use client'

/**
 * Edit Assignment Page
 * 
 * Allows instructors to edit existing assignments.
 * 
 * @module app/courses/[id]/assignments/[assignmentId]/edit/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import MarkdownEditor from '@/components/MarkdownEditor'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, AlertCircle, Check } from 'lucide-react'
import type { Course, Assignment, SubmissionType, AssignmentStatus } from '@/types/database'

export default function EditAssignmentPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const assignmentId = params.assignmentId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
    if (user && courseId && assignmentId) {
      loadData()
    }
  }, [user, courseId, assignmentId])

  const loadData = async () => {
    if (!user) return

    try {
      // Load course
      const { data: courseData, error: courseError } = await supabase
        .from('courseflow_courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError || !courseData) {
        router.push('/courses')
        return
      }

      // Check if user is instructor
      if (courseData.instructor_id !== user.id) {
        router.push(`/courses/${courseId}`)
        return
      }

      setCourse(courseData)

      // Load assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('courseflow_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single()

      if (assignmentError || !assignmentData) {
        router.push(`/courses/${courseId}`)
        return
      }

      setAssignment(assignmentData)

      // Populate form
      setTitle(assignmentData.title)
      setInstructions(assignmentData.instructions || '')
      setPointsPossible(assignmentData.points_possible)
      setSubmissionType(assignmentData.submission_type)
      setAllowLateSubmissions(assignmentData.allow_late_submissions)
      setLatePenaltyPercent(assignmentData.late_penalty_percent)
      setAllowResubmission(assignmentData.allow_resubmission)
      setMaxSubmissions(assignmentData.max_submissions)
      setStatus(assignmentData.status)

      // Parse due date
      if (assignmentData.due_date) {
        const due = new Date(assignmentData.due_date)
        setDueDate(due.toISOString().split('T')[0])
        setDueTime(due.toTimeString().substring(0, 5))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

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

    const { error: updateError } = await supabase
      .from('courseflow_assignments')
      .update({
        title: title.trim(),
        instructions: instructions || null,
        points_possible: pointsPossible,
        submission_type: submissionType,
        due_date: dueDateISO,
        allow_late_submissions: allowLateSubmissions,
        late_penalty_percent: allowLateSubmissions ? latePenaltyPercent : 0,
        allow_resubmission: allowResubmission,
        max_submissions: allowResubmission ? maxSubmissions : 1,
        status,
      })
      .eq('id', assignmentId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSuccess('Assignment saved!')
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment? All submissions will be lost.')) {
      return
    }

    const { error } = await supabase
      .from('courseflow_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      setError(error.message)
      return
    }

    router.push(`/courses/${courseId}`)
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!course || !assignment) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/courses/${courseId}/assignments/${assignmentId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assignment
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">Edit Assignment</h1>
          <p className="text-slate-600 mt-1">{course.title}</p>
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

        {/* Form */}
        <div className="space-y-6">
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
              />
            </div>

            <MarkdownEditor
              label="Instructions"
              value={instructions}
              onChange={setInstructions}
              placeholder="Describe the assignment requirements..."
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
            <h2 className="text-lg font-semibold text-slate-900">Due Date</h2>

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
          </div>

          {/* Submission Settings */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Submission Settings</h2>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowLateSubmissions}
                onChange={(e) => setAllowLateSubmissions(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-600 rounded border-slate-300"
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
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowResubmission}
                onChange={(e) => setAllowResubmission(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-600 rounded border-slate-300"
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
              </div>
            )}
          </div>

          {/* Status */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Status</h2>

            <div className="flex gap-3">
              {(['draft', 'published'] as AssignmentStatus[]).map((s) => (
                <label
                  key={s}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                    status === s
                      ? s === 'published'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="sr-only"
                  />
                  <span className="font-medium text-slate-900 capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={handleDelete}
              className="btn-secondary text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Assignment
            </button>

            <button
              onClick={handleSave}
              className="btn-primary"
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

