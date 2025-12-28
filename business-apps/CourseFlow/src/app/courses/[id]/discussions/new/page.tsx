'use client'

/**
 * Create Discussion Page
 * 
 * Allows users to create new discussion threads.
 * 
 * @module app/courses/[id]/discussions/new/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import MarkdownEditor from '@/components/MarkdownEditor'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Send, AlertCircle } from 'lucide-react'
import type { Course, DiscussionInsert } from '@/types/database'

export default function CreateDiscussionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

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

    setCourse(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!user) {
      setError('You must be logged in')
      setSaving(false)
      return
    }

    if (!title.trim()) {
      setError('Title is required')
      setSaving(false)
      return
    }

    const discussion: DiscussionInsert = {
      course_id: courseId,
      author_id: user.id,
      title: title.trim(),
      body: body || null,
      is_pinned: false,
      is_locked: false,
    }

    const { data, error: insertError } = await supabase
      .from('courseflow_discussions')
      .insert(discussion)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push(`/courses/${courseId}/discussions/${data.id}`)
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

          <h1 className="text-2xl font-bold text-slate-900">Start a Discussion</h1>
          <p className="text-slate-600 mt-1">Share your thoughts with the class</p>
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
                placeholder="e.g., Question about Week 1 assignment"
                required
              />
            </div>

            <MarkdownEditor
              label="Message"
              value={body}
              onChange={setBody}
              placeholder="Share your thoughts, questions, or ideas... (Markdown supported)"
              minHeight="200px"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link
              href={`/courses/${courseId}`}
              className="btn-secondary"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              <Send className="h-4 w-4" />
              {saving ? 'Posting...' : 'Post Discussion'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

