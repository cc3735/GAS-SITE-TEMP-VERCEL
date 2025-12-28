'use client'

/**
 * Submit Assignment Page
 * 
 * Allows students to submit their work for an assignment.
 * 
 * @module app/courses/[id]/assignments/[assignmentId]/submit/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import MarkdownEditor from '@/components/MarkdownEditor'
import FileUpload from '@/components/FileUpload'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  FileText,
  Clock,
  AlertCircle,
} from 'lucide-react'
import type { Course, Assignment, Submission } from '@/types/database'

interface UploadedFile {
  name: string
  url: string
  size: number
  type: string
}

export default function SubmitAssignmentPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const assignmentId = params.assignmentId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null)
  const [submissionCount, setSubmissionCount] = useState(0)
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [textContent, setTextContent] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

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

      // Check if user is instructor (instructors can't submit)
      if (courseData.instructor_id === user.id) {
        router.push(`/courses/${courseId}/assignments/${assignmentId}`)
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

      // Check if assignment is published
      if (assignmentData.status !== 'published') {
        router.push(`/courses/${courseId}/assignments/${assignmentId}`)
        return
      }

      setAssignment(assignmentData)

      // Load existing submissions count
      const { count } = await supabase
        .from('courseflow_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignmentId)
        .eq('user_id', user.id)

      setSubmissionCount(count || 0)

      // Load most recent submission
      const { data: submissionData } = await supabase
        .from('courseflow_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (submissionData) {
        setExistingSubmission(submissionData)
        // Pre-fill form with previous submission
        if (submissionData.text_content) {
          setTextContent(submissionData.text_content)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!user || !assignment) return

    // Validate submission
    if (assignment.submission_type === 'text_submission' && !textContent.trim()) {
      setError('Please enter your submission text')
      setSubmitting(false)
      return
    }

    if (assignment.submission_type === 'file_upload' && uploadedFiles.length === 0) {
      setError('Please upload at least one file')
      setSubmitting(false)
      return
    }

    // Check max submissions
    if (assignment.max_submissions && submissionCount >= assignment.max_submissions) {
      setError(`Maximum submissions (${assignment.max_submissions}) reached`)
      setSubmitting(false)
      return
    }

    // Determine if late
    const isLate = assignment.due_date
      ? new Date() > new Date(assignment.due_date)
      : false

    // Check if late submissions are allowed
    if (isLate && !assignment.allow_late_submissions) {
      setError('This assignment no longer accepts submissions')
      setSubmitting(false)
      return
    }

    // Check resubmission
    if (!assignment.allow_resubmission && submissionCount > 0) {
      setError('Resubmissions are not allowed for this assignment')
      setSubmitting(false)
      return
    }

    const submission = {
      assignment_id: assignmentId,
      user_id: user.id,
      text_content: textContent || null,
      file_urls: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : null,
      is_late: isLate,
      status: 'submitted' as const,
    }

    const { data, error: insertError } = await supabase
      .from('courseflow_submissions')
      .insert(submission)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    router.push(`/courses/${courseId}/assignments/${assignmentId}`)
  }

  const handleFileUpload = (files: UploadedFile[]) => {
    setUploadedFiles([...uploadedFiles, ...files])
  }

  const handleFileRemove = (url: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.url !== url))
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!assignment || !course) {
    return null
  }

  const isPastDue = assignment.due_date && new Date(assignment.due_date) < new Date()
  const canSubmit = assignment.allow_resubmission || submissionCount === 0
  const maxReached = assignment.max_submissions && submissionCount >= assignment.max_submissions

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/courses/${courseId}/assignments/${assignmentId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assignment
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">Submit Assignment</h1>
          <p className="text-slate-600 mt-1">{assignment.title}</p>
        </div>

        {/* Warnings */}
        {isPastDue && assignment.allow_late_submissions && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Late Submission</p>
              <p className="text-sm text-amber-700">
                This assignment was due {new Date(assignment.due_date!).toLocaleString()}.
                A {assignment.late_penalty_percent}% late penalty will be applied.
              </p>
            </div>
          </div>
        )}

        {existingSubmission && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Previous Submission</p>
              <p className="text-sm text-blue-700">
                You submitted on {new Date(existingSubmission.submitted_at).toLocaleString()}.
                {assignment.allow_resubmission
                  ? ' Submitting again will create a new submission.'
                  : ' Resubmissions are not allowed.'}
              </p>
            </div>
          </div>
        )}

        {maxReached && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Maximum Submissions Reached</p>
              <p className="text-sm text-red-700">
                You have used all {assignment.max_submissions} allowed submissions.
              </p>
            </div>
          </div>
        )}

        {/* Submission Form */}
        {canSubmit && !maxReached && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Submission</h2>

              {assignment.submission_type === 'text_submission' ? (
                <MarkdownEditor
                  label="Your Answer"
                  value={textContent}
                  onChange={setTextContent}
                  placeholder="Write your submission here... (Markdown supported)"
                  minHeight="300px"
                  required
                />
              ) : (
                <FileUpload
                  label="Upload Files"
                  onUpload={handleFileUpload}
                  existingFiles={uploadedFiles}
                  onRemove={handleFileRemove}
                  folder={`submissions/${courseId}/${assignmentId}/${user?.id}`}
                  maxFiles={10}
                  maxSizeMB={50}
                  required
                />
              )}

              {/* Allow both text and files */}
              {assignment.submission_type === 'file_upload' && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <MarkdownEditor
                    label="Additional Comments (Optional)"
                    value={textContent}
                    onChange={setTextContent}
                    placeholder="Add any notes or comments about your submission..."
                    minHeight="100px"
                  />
                </div>
              )}
            </div>

            {/* Submission Info */}
            <div className="card p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Submissions used</span>
                <span className="font-medium">
                  {submissionCount} / {assignment.max_submissions || '∞'}
                </span>
              </div>
              {assignment.due_date && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-600">Due Date</span>
                  <span className={`font-medium ${isPastDue ? 'text-red-600' : ''}`}>
                    {new Date(assignment.due_date).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href={`/courses/${courseId}/assignments/${assignmentId}`}
                className="btn-secondary"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}

