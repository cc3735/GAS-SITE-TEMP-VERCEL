'use client'

/**
 * Assignment Detail Page
 * 
 * Shows assignment details, handles student submissions, and instructor grading.
 * 
 * @module app/courses/[id]/assignments/[assignmentId]/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Upload,
  Edit,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  ChevronRight,
} from 'lucide-react'
import type { Course, Assignment, Submission, Feedback } from '@/types/database'

type SubmissionWithFeedback = Submission & { feedback?: Feedback | null }

export default function AssignmentDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const assignmentId = params.assignmentId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isInstructor, setIsInstructor] = useState(false)
  const [mySubmission, setMySubmission] = useState<SubmissionWithFeedback | null>(null)
  const [allSubmissions, setAllSubmissions] = useState<(Submission & { user_email?: string })[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'submissions'>('details')

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

      setCourse(courseData)
      const instructorFlag = courseData.instructor_id === user.id
      setIsInstructor(instructorFlag)

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

      if (instructorFlag) {
        // Load all submissions for instructor
        const { data: submissionsData } = await supabase
          .from('courseflow_submissions')
          .select('*')
          .eq('assignment_id', assignmentId)
          .order('submitted_at', { ascending: false })

        setAllSubmissions(submissionsData || [])
        setActiveTab('details')
      } else {
        // Load student's own submission
        const { data: submissionData } = await supabase
          .from('courseflow_submissions')
          .select('*')
          .eq('assignment_id', assignmentId)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (submissionData) {
          // Load feedback for submission
          const { data: feedbackData } = await supabase
            .from('courseflow_feedback')
            .select('*')
            .eq('submission_id', submissionData.id)
            .maybeSingle()

          setMySubmission({ ...submissionData, feedback: feedbackData })
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
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

  if (!assignment || !course) {
    return null
  }

  const isPastDue = assignment.due_date && new Date(assignment.due_date) < new Date()
  const canSubmit = !isInstructor && assignment.status === 'published'
  const hasSubmitted = mySubmission !== null

  const getDueStatus = () => {
    if (!assignment.due_date) return null
    const now = new Date()
    const due = new Date(assignment.due_date)
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 0) {
      return { text: 'Past due', color: 'text-red-600', icon: XCircle }
    } else if (diffHours < 24) {
      return { text: 'Due soon', color: 'text-amber-600', icon: AlertTriangle }
    } else {
      return { text: 'Upcoming', color: 'text-emerald-600', icon: Clock }
    }
  }

  const dueStatus = getDueStatus()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {course.title}
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                    <span>{assignment.points_possible} points</span>
                    <span className={`badge ${assignment.status === 'published' ? 'badge-success' : 'badge-neutral'}`}>
                      {assignment.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isInstructor && (
              <Link
                href={`/courses/${courseId}/assignments/${assignmentId}/edit`}
                className="btn-secondary"
              >
                <Edit className="h-4 w-4" />
                Edit Assignment
              </Link>
            )}
          </div>
        </div>

        {/* Due Date Banner */}
        {assignment.due_date && (
          <div className={`card p-4 border-l-4 ${
            isPastDue ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-amber-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {dueStatus && <dueStatus.icon className={`h-5 w-5 ${dueStatus.color}`} />}
                <div>
                  <p className={`font-medium ${dueStatus?.color}`}>
                    {isPastDue ? 'This assignment is past due' : `Due ${new Date(assignment.due_date).toLocaleString()}`}
                  </p>
                  {assignment.allow_late_submissions && isPastDue && (
                    <p className="text-sm text-slate-600">
                      Late submissions accepted with {assignment.late_penalty_percent}% penalty
                    </p>
                  )}
                </div>
              </div>
              {canSubmit && (
                <Link
                  href={`/courses/${courseId}/assignments/${assignmentId}/submit`}
                  className="btn-primary"
                >
                  <Upload className="h-4 w-4" />
                  {hasSubmitted ? 'Resubmit' : 'Submit'}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Instructor Tabs */}
        {isInstructor && (
          <div className="border-b border-slate-200">
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'submissions'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="h-4 w-4" />
                Submissions
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100">
                  {allSubmissions.length}
                </span>
              </button>
            </nav>
          </div>
        )}

        {/* Content */}
        {activeTab === 'details' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Instructions */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-slate-900">Instructions</h2>
                </div>
                <div className="card-body">
                  {assignment.instructions ? (
                    <MarkdownRenderer content={assignment.instructions} />
                  ) : (
                    <p className="text-slate-500 italic">No instructions provided</p>
                  )}
                </div>
              </div>

              {/* Student's Submission */}
              {!isInstructor && hasSubmitted && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-lg font-semibold text-slate-900">Your Submission</h2>
                  </div>
                  <div className="card-body space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Submitted</span>
                      <span className="font-medium">
                        {new Date(mySubmission!.submitted_at).toLocaleString()}
                      </span>
                    </div>

                    {mySubmission!.is_late && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                        This submission was late
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Status</span>
                      <span className={`badge ${
                        mySubmission!.status === 'graded' ? 'badge-success' :
                        mySubmission!.status === 'returned' ? 'badge-primary' :
                        'badge-neutral'
                      }`}>
                        {mySubmission!.status}
                      </span>
                    </div>

                    {mySubmission!.text_content && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Your Answer:</p>
                        <div className="bg-slate-50 rounded-lg p-4">
                          <MarkdownRenderer content={mySubmission!.text_content} />
                        </div>
                      </div>
                    )}

                    {mySubmission!.file_urls && mySubmission!.file_urls.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Attached Files:</p>
                        <div className="space-y-2">
                          {mySubmission!.file_urls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 text-sm text-primary-600"
                            >
                              <FileText className="h-4 w-4" />
                              File {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    {mySubmission!.feedback && mySubmission!.feedback.is_returned && (
                      <div className="border-t border-slate-200 pt-4">
                        <h3 className="font-medium text-slate-900 mb-3">Feedback</h3>
                        {mySubmission!.feedback.grade !== null && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-bold text-primary-600">
                              {mySubmission!.feedback.grade}
                            </span>
                            <span className="text-slate-500">/ {assignment.points_possible}</span>
                          </div>
                        )}
                        {mySubmission!.feedback.feedback_text && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <MarkdownRenderer content={mySubmission!.feedback.feedback_text} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assignment Info */}
              <div className="card p-4">
                <h3 className="font-medium text-slate-900 mb-4">Assignment Info</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Points</dt>
                    <dd className="font-medium text-slate-900">{assignment.points_possible}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Submission Type</dt>
                    <dd className="font-medium text-slate-900 capitalize">
                      {assignment.submission_type.replace('_', ' ')}
                    </dd>
                  </div>
                  {assignment.due_date && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Due Date</dt>
                      <dd className="font-medium text-slate-900">
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Late Submissions</dt>
                    <dd className="font-medium text-slate-900">
                      {assignment.allow_late_submissions ? 'Allowed' : 'Not allowed'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Resubmissions</dt>
                    <dd className="font-medium text-slate-900">
                      {assignment.allow_resubmission
                        ? assignment.max_submissions
                          ? `Up to ${assignment.max_submissions}`
                          : 'Unlimited'
                        : 'Not allowed'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Submit Button for students */}
              {canSubmit && !assignment.due_date && (
                <Link
                  href={`/courses/${courseId}/assignments/${assignmentId}/submit`}
                  className="btn-primary w-full justify-center"
                >
                  <Upload className="h-4 w-4" />
                  {hasSubmitted ? 'Resubmit' : 'Submit Assignment'}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Submissions Tab (Instructor only) */}
        {activeTab === 'submissions' && isInstructor && (
          <div className="space-y-4">
            {allSubmissions.length > 0 ? (
              <div className="card">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Submitted
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Grade
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {allSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                              {submission.user_id.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-slate-900 truncate max-w-[150px]">
                              {submission.user_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            {new Date(submission.submitted_at).toLocaleDateString()}
                            {submission.is_late && (
                              <span className="text-xs text-amber-600 font-medium">(Late)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            submission.status === 'graded' ? 'badge-success' :
                            submission.status === 'returned' ? 'badge-primary' :
                            'badge-neutral'
                          }`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          —
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/courses/${courseId}/assignments/${assignmentId}/submissions/${submission.id}`}
                            className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 text-sm"
                          >
                            Review
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">No submissions yet</h3>
                <p className="mt-2 text-slate-600">
                  Students haven't submitted work for this assignment yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

