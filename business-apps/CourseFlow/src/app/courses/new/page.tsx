'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Globe,
  Lock,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react'

export default function NewCoursePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('private')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError(null)
    setLoading(true)

    try {
      // Generate enrollment code for private/unlisted courses
      const enrollmentCode = visibility !== 'public' 
        ? Math.random().toString(36).substring(2, 10).toUpperCase()
        : null

      const { data, error: createError } = await supabase
        .from('courseflow_courses')
        .insert({
          instructor_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          visibility,
          enrollment_code: enrollmentCode,
          status: 'active',
        })
        .select()
        .single()

      if (createError) {
        setError(createError.message)
      } else if (data) {
        router.push(`/courses/${data.id}`)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create New Course</h1>
          <p className="mt-1 text-slate-600">
            Set up your course details. You can add assignments and content after creation.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="card p-6 space-y-6">
            {/* Course Title */}
            <div>
              <label htmlFor="title" className="label">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="e.g., Introduction to Web Development"
                required
                maxLength={200}
              />
              <p className="mt-1 text-xs text-slate-500">
                Choose a clear, descriptive title for your course
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[120px] resize-y"
                placeholder="Describe what students will learn in this course..."
                maxLength={2000}
              />
              <p className="mt-1 text-xs text-slate-500">
                {description.length}/2000 characters
              </p>
            </div>

            {/* Visibility */}
            <div>
              <label className="label">Course Visibility</label>
              <div className="space-y-3 mt-2">
                <VisibilityOption
                  value="private"
                  current={visibility}
                  onChange={setVisibility}
                  icon={<Lock className="h-5 w-5" />}
                  title="Private"
                  description="Only invited students can join via enrollment code"
                />
                <VisibilityOption
                  value="unlisted"
                  current={visibility}
                  onChange={setVisibility}
                  icon={<LinkIcon className="h-5 w-5" />}
                  title="Unlisted"
                  description="Anyone with the link can join"
                />
                <VisibilityOption
                  value="public"
                  current={visibility}
                  onChange={setVisibility}
                  icon={<Globe className="h-5 w-5" />}
                  title="Public"
                  description="Anyone can discover and join this course"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/courses" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4" />
                  Create Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

function VisibilityOption({
  value,
  current,
  onChange,
  icon,
  title,
  description,
}: {
  value: 'public' | 'private' | 'unlisted'
  current: string
  onChange: (value: 'public' | 'private' | 'unlisted') => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  const isSelected = current === value

  return (
    <label
      className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <input
        type="radio"
        name="visibility"
        value={value}
        checked={isSelected}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <div
        className={`flex-shrink-0 ${
          isSelected ? 'text-primary-600' : 'text-slate-400'
        }`}
      >
        {icon}
      </div>
      <div>
        <div className={`font-medium ${isSelected ? 'text-primary-900' : 'text-slate-700'}`}>
          {title}
        </div>
        <div className={`text-sm ${isSelected ? 'text-primary-700' : 'text-slate-500'}`}>
          {description}
        </div>
      </div>
    </label>
  )
}

