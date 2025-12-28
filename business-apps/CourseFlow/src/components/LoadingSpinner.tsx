'use client'

/**
 * Loading Spinner Component
 * 
 * Various loading states for the application.
 * 
 * @module components/LoadingSpinner
 */

import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullPage?: boolean
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  fullPage = false 
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizes[size]} text-primary-600 animate-spin`} />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-32 bg-slate-200 rounded-lg" />
        <div className="h-32 bg-slate-200 rounded-lg" />
        <div className="h-32 bg-slate-200 rounded-lg" />
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse p-4 bg-white rounded-lg border border-slate-200">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-slate-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-slate-200 rounded" />
          <div className="h-3 w-1/2 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-10 bg-slate-200 rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-lg" />
      ))}
    </div>
  )
}

