'use client'

/**
 * Create Live Session Page
 * 
 * Allows instructors to schedule YouTube Live sessions.
 * 
 * @module app/courses/[id]/sessions/new/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  Video,
  Calendar,
  Clock,
  AlertCircle,
  Youtube,
  ExternalLink,
} from 'lucide-react'
import type { Course, LiveSessionInsert, LiveSessionStatus } from '@/types/database'

export default function CreateSessionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [status, setStatus] = useState<LiveSessionStatus>('scheduled')

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

  const extractYouTubeVideoId = (url: string): string | null => {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\s?]+)/,
      /youtube\.com\/v\/([^&\s?]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      setSaving(false)
      return
    }

    if (!youtubeUrl.trim()) {
      setError('YouTube URL is required')
      setSaving(false)
      return
    }

    const videoId = extractYouTubeVideoId(youtubeUrl)
    if (!videoId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video or live stream URL.')
      setSaving(false)
      return
    }

    // Build schedule times
    let scheduledStartAt: string | null = null
    let scheduledEndAt: string | null = null

    if (startDate && startTime) {
      scheduledStartAt = new Date(`${startDate}T${startTime}:00`).toISOString()
    }
    if (startDate && endTime) {
      scheduledEndAt = new Date(`${startDate}T${endTime}:00`).toISOString()
    }

    const session: LiveSessionInsert = {
      course_id: courseId,
      title: title.trim(),
      description: description || null,
      youtube_live_url: youtubeUrl.trim(),
      youtube_video_id: videoId,
      scheduled_start_at: scheduledStartAt,
      scheduled_end_at: scheduledEndAt,
      status,
    }

    const { data, error: insertError } = await supabase
      .from('courseflow_live_sessions')
      .insert(session)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push(`/courses/${courseId}/sessions/${data.id}`)
  }

  if (loading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const previewVideoId = extractYouTubeVideoId(youtubeUrl)

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
            Back to {course.title}
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">Schedule Live Session</h1>
          <p className="text-slate-600 mt-1">Add a YouTube Live session to your course</p>
        </div>

        {/* Help Card */}
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Youtube className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Using YouTube Live</p>
              <p className="text-sm text-blue-700 mt-1">
                Create a live stream on YouTube Studio, then paste the URL here. Students will see
                the embedded video directly in the course. You can use unlisted videos for private sessions.
              </p>
              <a
                href="https://studio.youtube.com/channel/UC/livestreaming"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-2"
              >
                Open YouTube Studio
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Session Details</h2>

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
                placeholder="e.g., Week 3: Live Q&A Session"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="label">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[100px]"
                placeholder="What will this session cover?"
              />
            </div>

            <div>
              <label htmlFor="youtubeUrl" className="label">
                YouTube URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="input"
                placeholder="https://youtube.com/watch?v=... or https://youtube.com/live/..."
                required
              />
              <p className="text-sm text-slate-500 mt-1">
                Supports youtube.com/watch, youtu.be, and youtube.com/live URLs
              </p>
            </div>

            {/* Video Preview */}
            {previewVideoId && (
              <div>
                <p className="label mb-2">Preview</p>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${previewVideoId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="startDate" className="label">Date</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="startTime" className="label">Start Time</label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="label">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Leave empty to add a recorded session without a specific schedule.
            </p>
          </div>

          {/* Status */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Status</h2>

            <div className="grid grid-cols-2 gap-4">
              {(['scheduled', 'completed'] as LiveSessionStatus[]).map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    status === s
                      ? 'border-primary-500 bg-primary-50'
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
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    status === s ? 'border-primary-500 bg-primary-500' : 'border-slate-300'
                  }`}>
                    {status === s && (
                      <div className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 capitalize">{s}</p>
                    <p className="text-sm text-slate-500">
                      {s === 'scheduled' && 'Upcoming live session'}
                      {s === 'completed' && 'Recorded session'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Link href={`/courses/${courseId}`} className="btn-secondary">
              Cancel
            </Link>

            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              <Video className="h-4 w-4" />
              {saving ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

