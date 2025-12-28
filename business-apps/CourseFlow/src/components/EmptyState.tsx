'use client'

/**
 * Empty State Component
 * 
 * Display when no content is available.
 * 
 * @module components/EmptyState
 */

import { ReactNode } from 'react'
import { LucideIcon, FileText, Users, MessageSquare, Video, FolderOpen } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export default function EmptyState({ 
  icon: Icon = FolderOpen, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      )}
      {action && (
        action.href ? (
          <Link href={action.href} className="btn-primary">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="btn-primary">
            {action.label}
          </button>
        )
      )}
    </div>
  )
}

// Preset empty states for common scenarios
export function NoAssignments({ courseId, canCreate }: { courseId: string; canCreate: boolean }) {
  return (
    <EmptyState
      icon={FileText}
      title="No assignments yet"
      description={canCreate 
        ? "Create your first assignment to get started with the learning journey."
        : "Your instructor hasn't posted any assignments yet. Check back soon!"
      }
      action={canCreate ? {
        label: "Create Assignment",
        href: `/courses/${courseId}/assignments/new`
      } : undefined}
    />
  )
}

export function NoDiscussions({ courseId, canCreate }: { courseId: string; canCreate: boolean }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No discussions yet"
      description={canCreate
        ? "Start a discussion to engage with your students."
        : "Be the first to start a discussion in this course!"
      }
      action={{
        label: canCreate ? "Create Discussion" : "Start Discussion",
        href: `/courses/${courseId}/discussions/new`
      }}
    />
  )
}

export function NoSessions({ courseId, canCreate }: { courseId: string; canCreate: boolean }) {
  return (
    <EmptyState
      icon={Video}
      title="No live sessions"
      description={canCreate
        ? "Schedule a live session to teach in real-time."
        : "No live sessions have been scheduled yet."
      }
      action={canCreate ? {
        label: "Schedule Session",
        href: `/courses/${courseId}/sessions/new`
      } : undefined}
    />
  )
}

export function NoEnrollments({ courseId }: { courseId: string }) {
  return (
    <EmptyState
      icon={Users}
      title="No students enrolled"
      description="Share your course link or enrollment code to get students enrolled."
      action={{
        label: "Share Course",
        href: `/courses/${courseId}/settings`
      }}
    />
  )
}

export function NoSubmissions({ assignmentTitle }: { assignmentTitle: string }) {
  return (
    <EmptyState
      icon={FileText}
      title="No submissions yet"
      description={`No students have submitted work for "${assignmentTitle}" yet.`}
    />
  )
}

