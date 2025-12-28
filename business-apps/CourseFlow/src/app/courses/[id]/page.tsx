'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Users,
  FileText,
  MessageSquare,
  Video,
  Settings,
  Plus,
  Copy,
  Check,
  Globe,
  Lock,
  Link as LinkIcon,
  Calendar,
  Clock,
} from 'lucide-react'
import type { Course, Assignment, Discussion, LiveSession, Enrollment } from '@/types/database'

type Tab = 'overview' | 'assignments' | 'discussions' | 'sessions' | 'students'

export default function CourseDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [enrollments, setEnrollments] = useState<(Enrollment & { user_email?: string })[]>([])
  const [isInstructor, setIsInstructor] = useState(false)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [codeCopied, setCodeCopied] = useState(false)

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
        router.push('/courses')
        return
      }

      setCourse(courseData)
      setIsInstructor(courseData.instructor_id === user.id)

      // Load assignments
      const { data: assignmentsData } = await supabase
        .from('courseflow_assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      setAssignments(assignmentsData || [])

      // Load discussions
      const { data: discussionsData } = await supabase
        .from('courseflow_discussions')
        .select('*')
        .eq('course_id', courseId)
        .order('is_pinned', { ascending: false })
        .order('last_reply_at', { ascending: false, nullsFirst: false })

      setDiscussions(discussionsData || [])

      // Load live sessions
      const { data: sessionsData } = await supabase
        .from('courseflow_live_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('scheduled_start_at', { ascending: false })

      setSessions(sessionsData || [])

      // Load enrollments (instructors only)
      if (courseData.instructor_id === user.id) {
        const { data: enrollmentsData } = await supabase
          .from('courseflow_enrollments')
          .select('*')
          .eq('course_id', courseId)
          .eq('status', 'active')

        setEnrollments(enrollmentsData || [])
      }
    } catch (error) {
      console.error('Error loading course:', error)
    } finally {
      setLoadingCourse(false)
    }
  }

  const copyEnrollmentCode = () => {
    if (course?.enrollment_code) {
      navigator.clipboard.writeText(course.enrollment_code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
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

  const getVisibilityIcon = () => {
    switch (course.visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
      case 'unlisted':
        return <LinkIcon className="h-4 w-4" />
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: FileText, count: assignments.length },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare, count: discussions.length },
    { id: 'sessions', label: 'Live Sessions', icon: Video, count: sessions.length },
    ...(isInstructor ? [{ id: 'students', label: 'Students', icon: Users, count: enrollments.length }] : []),
  ] as const

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
                <span className={`badge ${course.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                  {course.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  {getVisibilityIcon()}
                  {course.visibility.charAt(0).toUpperCase() + course.visibility.slice(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {enrollments.length} students
                </span>
              </div>
            </div>

            {isInstructor && (
              <div className="flex gap-2">
                <Link href={`/courses/${courseId}/settings`} className="btn-secondary">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Enrollment Code Card (for instructors) */}
        {isInstructor && course.enrollment_code && (
          <div className="card p-4 bg-primary-50 border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-900">Enrollment Code</p>
                <p className="text-xs text-primary-700">Share this code with students to join</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 bg-white rounded-lg text-lg font-mono font-bold text-primary-700 border border-primary-200">
                  {course.enrollment_code}
                </code>
                <button
                  onClick={copyEnrollmentCode}
                  className="btn-secondary p-2"
                  title="Copy code"
                >
                  {codeCopied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <OverviewTab course={course} />
          )}
          {activeTab === 'assignments' && (
            <AssignmentsTab
              assignments={assignments}
              courseId={courseId}
              isInstructor={isInstructor}
              onUpdate={loadCourse}
            />
          )}
          {activeTab === 'discussions' && (
            <DiscussionsTab
              discussions={discussions}
              courseId={courseId}
              isInstructor={isInstructor}
              onUpdate={loadCourse}
            />
          )}
          {activeTab === 'sessions' && (
            <SessionsTab
              sessions={sessions}
              courseId={courseId}
              isInstructor={isInstructor}
              onUpdate={loadCourse}
            />
          )}
          {activeTab === 'students' && isInstructor && (
            <StudentsTab enrollments={enrollments} onUpdate={loadCourse} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function OverviewTab({ course }: { course: Course }) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-900">About this Course</h2>
          </div>
          <div className="card-body">
            {course.description ? (
              <div className="prose-courseflow">
                <p>{course.description}</p>
              </div>
            ) : (
              <p className="text-slate-500 italic">No description provided</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-4">
          <h3 className="font-medium text-slate-900 mb-4">Course Info</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium text-slate-900 capitalize">{course.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Visibility</dt>
              <dd className="font-medium text-slate-900 capitalize">{course.visibility}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Created</dt>
              <dd className="font-medium text-slate-900">
                {new Date(course.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

function AssignmentsTab({
  assignments,
  courseId,
  isInstructor,
  onUpdate,
}: {
  assignments: Assignment[]
  courseId: string
  isInstructor: boolean
  onUpdate: () => void
}) {
  const publishedAssignments = assignments.filter(a => a.status === 'published')
  const draftAssignments = assignments.filter(a => a.status === 'draft')

  return (
    <div className="space-y-6">
      {isInstructor && (
        <div className="flex justify-end">
          <Link href={`/courses/${courseId}/assignments/new`} className="btn-primary">
            <Plus className="h-4 w-4" />
            Create Assignment
          </Link>
        </div>
      )}

      {assignments.length > 0 ? (
        <div className="space-y-4">
          {isInstructor && draftAssignments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3">Drafts</h3>
              <div className="space-y-2">
                {draftAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} courseId={courseId} />
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-3">Published</h3>
            {publishedAssignments.length > 0 ? (
              <div className="space-y-2">
                {publishedAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} courseId={courseId} />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No published assignments</p>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No assignments yet</h3>
          {isInstructor && (
            <Link href={`/courses/${courseId}/assignments/new`} className="mt-4 btn-primary inline-flex">
              <Plus className="h-4 w-4" />
              Create First Assignment
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function AssignmentCard({ assignment, courseId }: { assignment: Assignment; courseId: string }) {
  return (
    <Link
      href={`/courses/${courseId}/assignments/${assignment.id}`}
      className="card p-4 hover:shadow-md transition-shadow flex items-center gap-4"
    >
      <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-900 truncate">{assignment.title}</h4>
        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
          <span>{assignment.points_possible} points</span>
          {assignment.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Due {new Date(assignment.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <span className={`badge ${assignment.status === 'published' ? 'badge-success' : 'badge-neutral'}`}>
        {assignment.status}
      </span>
    </Link>
  )
}

function DiscussionsTab({
  discussions,
  courseId,
  isInstructor,
  onUpdate,
}: {
  discussions: Discussion[]
  courseId: string
  isInstructor: boolean
  onUpdate: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href={`/courses/${courseId}/discussions/new`} className="btn-primary">
          <Plus className="h-4 w-4" />
          New Discussion
        </Link>
      </div>

      {discussions.length > 0 ? (
        <div className="space-y-2">
          {discussions.map((discussion) => (
            <Link
              key={discussion.id}
              href={`/courses/${courseId}/discussions/${discussion.id}`}
              className="card p-4 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {discussion.is_pinned && (
                    <span className="badge badge-primary">Pinned</span>
                  )}
                  <h4 className="font-medium text-slate-900 truncate">{discussion.title}</h4>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {discussion.last_reply_at
                    ? `Last reply ${new Date(discussion.last_reply_at).toLocaleDateString()}`
                    : `Created ${new Date(discussion.created_at).toLocaleDateString()}`}
                </p>
              </div>
              {discussion.is_locked && (
                <Lock className="h-4 w-4 text-slate-400" />
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <MessageSquare className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No discussions yet</h3>
          <Link href={`/courses/${courseId}/discussions/new`} className="mt-4 btn-primary inline-flex">
            <Plus className="h-4 w-4" />
            Start First Discussion
          </Link>
        </div>
      )}
    </div>
  )
}

function SessionsTab({
  sessions,
  courseId,
  isInstructor,
  onUpdate,
}: {
  sessions: LiveSession[]
  courseId: string
  isInstructor: boolean
  onUpdate: () => void
}) {
  return (
    <div className="space-y-6">
      {isInstructor && (
        <div className="flex justify-end">
          <Link href={`/courses/${courseId}/sessions/new`} className="btn-primary">
            <Plus className="h-4 w-4" />
            Schedule Session
          </Link>
        </div>
      )}

      {sessions.length > 0 ? (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/courses/${courseId}/sessions/${session.id}`}
              className="card p-4 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                session.status === 'live' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <Video className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900 truncate">{session.title}</h4>
                {session.scheduled_start_at && (
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(session.scheduled_start_at).toLocaleString()}
                  </p>
                )}
              </div>
              <span className={`badge ${
                session.status === 'live' ? 'bg-red-100 text-red-700' :
                session.status === 'completed' ? 'badge-success' :
                session.status === 'cancelled' ? 'badge-neutral' :
                'badge-primary'
              }`}>
                {session.status === 'live' ? '🔴 LIVE' : session.status}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Video className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No live sessions yet</h3>
          {isInstructor && (
            <Link href={`/courses/${courseId}/sessions/new`} className="mt-4 btn-primary inline-flex">
              <Plus className="h-4 w-4" />
              Schedule First Session
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function StudentsTab({
  enrollments,
  onUpdate,
}: {
  enrollments: (Enrollment & { user_email?: string })[]
  onUpdate: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {enrollments.length} student{enrollments.length !== 1 ? 's' : ''} enrolled
        </p>
      </div>

      {enrollments.length > 0 ? (
        <div className="card">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Enrolled
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                        {enrollment.user_id.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-900">{enrollment.user_id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-success capitalize">{enrollment.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Users className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No students yet</h3>
          <p className="mt-2 text-slate-600">Share your enrollment code to invite students</p>
        </div>
      )}
    </div>
  )
}

