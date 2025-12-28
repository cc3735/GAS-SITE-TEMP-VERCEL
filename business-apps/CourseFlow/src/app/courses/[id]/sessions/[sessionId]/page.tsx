'use client'

/**
 * Live Session Detail Page
 * 
 * Displays a YouTube Live session with embedded player.
 * 
 * @module app/courses/[id]/sessions/[sessionId]/page
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
  Video,
  Calendar,
  Clock,
  Edit,
  ExternalLink,
  Play,
  CheckCircle,
  XCircle,
  Radio,
  Trash2,
} from 'lucide-react'
import type { Course, LiveSession } from '@/types/database'

export default function SessionDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const sessionId = params.sessionId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [session, setSession] = useState<LiveSession | null>(null)
  const [isInstructor, setIsInstructor] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && courseId && sessionId) {
      loadData()
    }
  }, [user, courseId, sessionId])

  const loadData = async () => {
    if (!user) return

    try {
      // Load course
      const { data: courseData } = await supabase
        .from('courseflow_courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (!courseData) {
        router.push('/courses')
        return
      }

      setCourse(courseData)
      setIsInstructor(courseData.instructor_id === user.id)

      // Load session
      const { data: sessionData } = await supabase
        .from('courseflow_live_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (!sessionData) {
        router.push(`/courses/${courseId}`)
        return
      }

      setSession(sessionData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const updateStatus = async (newStatus: 'scheduled' | 'live' | 'completed' | 'cancelled') => {
    if (!session) return

    await supabase
      .from('courseflow_live_sessions')
      .update({ status: newStatus })
      .eq('id', sessionId)

    setSession({ ...session, status: newStatus })
  }

  const deleteSession = async () => {
    if (!confirm('Are you sure you want to delete this session?')) return

    await supabase
      .from('courseflow_live_sessions')
      .delete()
      .eq('id', sessionId)

    router.push(`/courses/${courseId}`)
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session || !course) {
    return null
  }

  const getStatusStyles = () => {
    switch (session.status) {
      case 'live':
        return {
          badge: 'bg-red-100 text-red-700 animate-pulse',
          icon: Radio,
          text: '🔴 LIVE NOW',
        }
      case 'completed':
        return {
          badge: 'badge-success',
          icon: CheckCircle,
          text: 'Completed',
        }
      case 'cancelled':
        return {
          badge: 'badge-neutral',
          icon: XCircle,
          text: 'Cancelled',
        }
      default:
        return {
          badge: 'badge-primary',
          icon: Clock,
          text: 'Scheduled',
        }
    }
  }

  const statusInfo = getStatusStyles()

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
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                session.status === 'live'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <Video className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{session.title}</h1>
                  <span className={`badge ${statusInfo.badge}`}>
                    {statusInfo.text}
                  </span>
                </div>
                {session.scheduled_start_at && (
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(session.scheduled_start_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(session.scheduled_start_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {session.scheduled_end_at && (
                        <> - {new Date(session.scheduled_end_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Instructor Actions */}
            {isInstructor && (
              <div className="flex items-center gap-2">
                {session.status === 'scheduled' && (
                  <button
                    onClick={() => updateStatus('live')}
                    className="btn-primary"
                  >
                    <Play className="h-4 w-4" />
                    Go Live
                  </button>
                )}
                {session.status === 'live' && (
                  <button
                    onClick={() => updateStatus('completed')}
                    className="btn-secondary"
                  >
                    <CheckCircle className="h-4 w-4" />
                    End Session
                  </button>
                )}
                <Link
                  href={`/courses/${courseId}/sessions/${sessionId}/edit`}
                  className="btn-secondary p-2"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={deleteSession}
                  className="btn-secondary p-2 text-red-600 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div className="card overflow-hidden">
          {session.youtube_video_id ? (
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${session.youtube_video_id}?autoplay=${session.status === 'live' ? 1 : 0}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={session.title}
              />
            </div>
          ) : (
            <div className="aspect-video bg-slate-900 flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Video unavailable</p>
              </div>
            </div>
          )}
        </div>

        {/* Session Info */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {session.description && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-slate-900">About this Session</h2>
                </div>
                <div className="card-body">
                  <MarkdownRenderer content={session.description} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="card p-4">
              <h3 className="font-medium text-slate-900 mb-3">Quick Links</h3>
              <a
                href={session.youtube_live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-sm"
              >
                <ExternalLink className="h-4 w-4 text-slate-500" />
                <span className="flex-1">Open on YouTube</span>
              </a>
            </div>

            {/* Status Control (Instructor) */}
            {isInstructor && (
              <div className="card p-4">
                <h3 className="font-medium text-slate-900 mb-3">Session Status</h3>
                <div className="space-y-2">
                  {(['scheduled', 'live', 'completed', 'cancelled'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(s)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        session.status === s
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {s === 'live' ? '🔴 Live' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

