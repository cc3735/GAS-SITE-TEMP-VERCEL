'use client'

/**
 * Submission Review & Grading Page
 * 
 * Allows instructors to view submissions and provide feedback/grades.
 * 
 * @module app/courses/[id]/assignments/[assignmentId]/submissions/[submissionId]/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import MarkdownEditor from '@/components/MarkdownEditor'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Download,
  Check,
  Send,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react'
import type { Course, Assignment, Submission, Feedback } from '@/types/database'

export default function SubmissionReviewPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const assignmentId = params.assignmentId as string
  const submissionId = params.submissionId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [grade, setGrade] = useState<string>('')
  const [feedbackText, setFeedbackText] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && courseId && assignmentId && submissionId) {
      loadData()
    }
  }, [user, courseId, assignmentId, submissionId])

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

      // Load submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('courseflow_submissions')
        .select('*')
        .eq('id', submissionId)
        .single()

      if (submissionError || !submissionData) {
        router.push(`/courses/${courseId}/assignments/${assignmentId}`)
        return
      }

      setSubmission(submissionData)

      // Load existing feedback
      const { data: feedbackData } = await supabase
        .from('courseflow_feedback')
        .select('*')
        .eq('submission_id', submissionId)
        .maybeSingle()

      if (feedbackData) {
        setExistingFeedback(feedbackData)
        setGrade(feedbackData.grade?.toString() || '')
        setFeedbackText(feedbackData.feedback_text || '')
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSave = async (returnToStudent: boolean = false) => {
    if (!user || !submission) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    const gradeValue = grade ? parseFloat(grade) : null

    if (gradeValue !== null && (gradeValue < 0 || gradeValue > (assignment?.points_possible || 100))) {
      setError(`Grade must be between 0 and ${assignment?.points_possible || 100}`)
      setSaving(false)
      return
    }

    const feedbackPayload = {
      submission_id: submissionId,
      instructor_id: user.id,
      feedback_text: feedbackText || null,
      grade: gradeValue,
      is_returned: returnToStudent,
      returned_at: returnToStudent ? new Date().toISOString() : null,
    }

    let result
    if (existingFeedback) {
      // Update existing feedback
      result = await supabase
        .from('courseflow_feedback')
        .update(feedbackPayload)
        .eq('id', existingFeedback.id)
        .select()
        .single()
    } else {
      // Create new feedback
      result = await supabase
        .from('courseflow_feedback')
        .insert(feedbackPayload)
        .select()
        .single()
    }

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }

    // Update submission status
    const newStatus = returnToStudent ? 'returned' : (gradeValue !== null ? 'graded' : 'submitted')
    await supabase
      .from('courseflow_submissions')
      .update({ status: newStatus })
      .eq('id', submissionId)

    setExistingFeedback(result.data)
    setSuccess(returnToStudent ? 'Feedback returned to student!' : 'Feedback saved!')
    setSaving(false)

    if (returnToStudent) {
      setTimeout(() => {
        router.push(`/courses/${courseId}/assignments/${assignmentId}`)
      }, 1500)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!submission || !assignment || !course) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/courses/${courseId}/assignments/${assignmentId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assignment
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Review Submission</h1>
              <p className="text-slate-600 mt-1">{assignment.title}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`badge ${
                submission.status === 'graded' ? 'badge-success' :
                submission.status === 'returned' ? 'badge-primary' :
                'badge-neutral'
              }`}>
                {submission.status}
              </span>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Submission Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Info */}
            <div className="card p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 truncate max-w-xs">
                    {submission.user_id}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    Submitted {new Date(submission.submitted_at).toLocaleString()}
                    {submission.is_late && (
                      <span className="text-amber-600 font-medium">(Late)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Content */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-slate-900">Submission</h2>
              </div>
              <div className="card-body space-y-4">
                {submission.text_content && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Text Response</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <MarkdownRenderer content={submission.text_content} />
                    </div>
                  </div>
                )}

                {submission.file_urls && submission.file_urls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Attached Files</h3>
                    <div className="space-y-2">
                      {submission.file_urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              File {index + 1}
                            </p>
                            <p className="text-xs text-slate-500">Click to view</p>
                          </div>
                          <Download className="h-4 w-4 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {!submission.text_content && (!submission.file_urls || submission.file_urls.length === 0) && (
                  <p className="text-slate-500 italic">No content submitted</p>
                )}
              </div>
            </div>
          </div>

          {/* Grading Panel */}
          <div className="space-y-6">
            <div className="card p-4 sticky top-6">
              <h3 className="font-semibold text-slate-900 mb-4">Grade & Feedback</h3>

              <div className="space-y-4">
                {/* Grade Input */}
                <div>
                  <label htmlFor="grade" className="label">
                    Grade (out of {assignment.points_possible})
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      id="grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="input w-24"
                      min="0"
                      max={assignment.points_possible}
                      step="0.5"
                      placeholder="—"
                    />
                    <span className="text-slate-500">/ {assignment.points_possible}</span>
                  </div>

                  {submission.is_late && assignment.late_penalty_percent > 0 && grade && (
                    <p className="text-sm text-amber-600 mt-1">
                      With {assignment.late_penalty_percent}% late penalty:{' '}
                      {(parseFloat(grade) * (1 - assignment.late_penalty_percent / 100)).toFixed(1)} points
                    </p>
                  )}
                </div>

                {/* Feedback */}
                <MarkdownEditor
                  label="Feedback"
                  value={feedbackText}
                  onChange={setFeedbackText}
                  placeholder="Write your feedback here..."
                  minHeight="150px"
                />

                {/* Actions */}
                <div className="space-y-2 pt-4">
                  <button
                    onClick={() => handleSave(false)}
                    className="btn-secondary w-full justify-center"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    className="btn-primary w-full justify-center"
                    disabled={saving}
                  >
                    <Send className="h-4 w-4" />
                    {saving ? 'Returning...' : 'Return to Student'}
                  </button>
                </div>

                {existingFeedback?.is_returned && (
                  <p className="text-sm text-emerald-600 text-center">
                    ✓ Returned on {new Date(existingFeedback.returned_at!).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

