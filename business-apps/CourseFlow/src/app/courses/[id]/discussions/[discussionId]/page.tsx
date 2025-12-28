'use client'

/**
 * Discussion Detail Page
 * 
 * Shows a discussion thread with nested replies.
 * 
 * @module app/courses/[id]/discussions/[discussionId]/page
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
  MessageSquare,
  Pin,
  Lock,
  Unlock,
  Trash2,
  Reply,
  MoreVertical,
  Clock,
  User,
  AlertCircle,
} from 'lucide-react'
import type { Course, Discussion, DiscussionPost } from '@/types/database'

type PostWithReplies = DiscussionPost & { replies: PostWithReplies[] }

export default function DiscussionDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const discussionId = params.discussionId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [posts, setPosts] = useState<PostWithReplies[]>([])
  const [isInstructor, setIsInstructor] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && courseId && discussionId) {
      loadData()
    }
  }, [user, courseId, discussionId])

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

      // Load discussion
      const { data: discussionData } = await supabase
        .from('courseflow_discussions')
        .select('*')
        .eq('id', discussionId)
        .single()

      if (!discussionData) {
        router.push(`/courses/${courseId}`)
        return
      }

      setDiscussion(discussionData)

      // Load posts
      const { data: postsData } = await supabase
        .from('courseflow_discussion_posts')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true })

      // Build nested structure
      const postsMap = new Map<string, PostWithReplies>()
      const rootPosts: PostWithReplies[] = []

      ;(postsData || []).forEach((post) => {
        postsMap.set(post.id, { ...post, replies: [] })
      })

      ;(postsData || []).forEach((post) => {
        const postWithReplies = postsMap.get(post.id)!
        if (post.parent_post_id) {
          const parent = postsMap.get(post.parent_post_id)
          if (parent) {
            parent.replies.push(postWithReplies)
          }
        } else {
          rootPosts.push(postWithReplies)
        }
      })

      setPosts(rootPosts)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleReply = async (parentPostId: string | null = null) => {
    if (!user || !replyContent.trim()) return

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('courseflow_discussion_posts')
      .insert({
        discussion_id: discussionId,
        author_id: user.id,
        parent_post_id: parentPostId,
        body: replyContent.trim(),
      })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    // Update last_reply_at
    await supabase
      .from('courseflow_discussions')
      .update({ last_reply_at: new Date().toISOString() })
      .eq('id', discussionId)

    setReplyContent('')
    setReplyTo(null)
    setSubmitting(false)
    loadData()
  }

  const togglePin = async () => {
    if (!discussion) return

    await supabase
      .from('courseflow_discussions')
      .update({ is_pinned: !discussion.is_pinned })
      .eq('id', discussionId)

    setDiscussion({ ...discussion, is_pinned: !discussion.is_pinned })
  }

  const toggleLock = async () => {
    if (!discussion) return

    await supabase
      .from('courseflow_discussions')
      .update({ is_locked: !discussion.is_locked })
      .eq('id', discussionId)

    setDiscussion({ ...discussion, is_locked: !discussion.is_locked })
  }

  const deleteDiscussion = async () => {
    if (!confirm('Are you sure you want to delete this discussion? All replies will be deleted.')) {
      return
    }

    await supabase
      .from('courseflow_discussions')
      .delete()
      .eq('id', discussionId)

    router.push(`/courses/${courseId}`)
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!discussion || !course) {
    return null
  }

  const isAuthor = discussion.author_id === user?.id

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

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {discussion.is_pinned && (
                    <Pin className="h-4 w-4 text-amber-500" />
                  )}
                  <h1 className="text-2xl font-bold text-slate-900">{discussion.title}</h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {discussion.author_id.substring(0, 8)}...
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(discussion.created_at).toLocaleDateString()}
                  </span>
                  {discussion.is_locked && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Lock className="h-3.5 w-3.5" />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Instructor Actions */}
            {isInstructor && (
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePin}
                  className="btn-secondary p-2"
                  title={discussion.is_pinned ? 'Unpin' : 'Pin'}
                >
                  <Pin className={`h-4 w-4 ${discussion.is_pinned ? 'text-amber-500' : ''}`} />
                </button>
                <button
                  onClick={toggleLock}
                  className="btn-secondary p-2"
                  title={discussion.is_locked ? 'Unlock' : 'Lock'}
                >
                  {discussion.is_locked ? (
                    <Unlock className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </button>
                {(isInstructor || isAuthor) && (
                  <button
                    onClick={deleteDiscussion}
                    className="btn-secondary p-2 text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Original Post */}
        <div className="card">
          <div className="card-body">
            {discussion.body ? (
              <MarkdownRenderer content={discussion.body} />
            ) : (
              <p className="text-slate-500 italic">No additional content</p>
            )}
          </div>
        </div>

        {/* Reply Form (top level) */}
        {!discussion.is_locked && replyTo === null && (
          <div className="card p-4">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <MarkdownEditor
              value={replyContent}
              onChange={setReplyContent}
              placeholder="Write a reply..."
              minHeight="100px"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={() => handleReply(null)}
                className="btn-primary"
                disabled={submitting || !replyContent.trim()}
              >
                <Reply className="h-4 w-4" />
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        )}

        {discussion.is_locked && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <Lock className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-amber-700">This discussion is locked and no longer accepting replies.</p>
          </div>
        )}

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {posts.length} {posts.length === 1 ? 'Reply' : 'Replies'}
          </h2>

          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  discussionLocked={discussion.is_locked}
                  isInstructor={isInstructor}
                  currentUserId={user?.id}
                  onReply={() => setReplyTo(post.id)}
                  depth={0}
                />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <MessageSquare className="h-12 w-12 text-slate-300 mx-auto" />
              <p className="mt-4 text-slate-600">No replies yet. Be the first to respond!</p>
            </div>
          )}
        </div>

        {/* Reply to specific post modal */}
        {replyTo && !discussion.is_locked && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Reply to Post</h3>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <MarkdownEditor
                value={replyContent}
                onChange={setReplyContent}
                placeholder="Write your reply..."
                minHeight="150px"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setReplyTo(null)
                    setReplyContent('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReply(replyTo)}
                  className="btn-primary"
                  disabled={submitting || !replyContent.trim()}
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function PostCard({
  post,
  discussionLocked,
  isInstructor,
  currentUserId,
  onReply,
  depth,
}: {
  post: PostWithReplies
  discussionLocked: boolean
  isInstructor: boolean
  currentUserId?: string
  onReply: () => void
  depth: number
}) {
  const maxDepth = 3
  const isAuthor = post.author_id === currentUserId

  return (
    <div className={depth > 0 ? 'ml-8 border-l-2 border-slate-200 pl-4' : ''}>
      <div className="card p-4">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
              {post.author_id.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {post.author_id.substring(0, 8)}...
              </p>
              <p className="text-xs text-slate-500">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {!discussionLocked && depth < maxDepth && (
            <button
              onClick={onReply}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>
          )}
        </div>

        {/* Post Content */}
        <div className="prose-sm">
          <MarkdownRenderer content={post.body} />
        </div>
      </div>

      {/* Nested Replies */}
      {post.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {post.replies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              discussionLocked={discussionLocked}
              isInstructor={isInstructor}
              currentUserId={currentUserId}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

