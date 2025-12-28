'use client'

/**
 * Markdown Editor Component
 * 
 * A simple markdown editor with preview toggle.
 * 
 * @module components/MarkdownEditor
 */

import { useState } from 'react'
import { Eye, Edit3, Bold, Italic, List, ListOrdered, Link, Code, Quote } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  label?: string
  required?: boolean
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content here... (Markdown supported)',
  minHeight = '200px',
  label,
  required = false,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false)

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea[data-markdown-editor]') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + before.length + selectedText.length + after.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), title: 'Italic' },
    { icon: Code, action: () => insertMarkdown('`', '`'), title: 'Inline code' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
    { icon: List, action: () => insertMarkdown('\n- '), title: 'Bullet list' },
    { icon: ListOrdered, action: () => insertMarkdown('\n1. '), title: 'Numbered list' },
    { icon: Quote, action: () => insertMarkdown('\n> '), title: 'Quote' },
  ]

  return (
    <div className="space-y-2">
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-1">
            {toolbarButtons.map((button, index) => (
              <button
                key={index}
                type="button"
                onClick={button.action}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                title={button.title}
              >
                <button.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors ${
                !showPreview
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors ${
                showPreview
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          </div>
        </div>

        {/* Editor / Preview */}
        {showPreview ? (
          <div
            className="p-4 bg-white overflow-auto"
            style={{ minHeight }}
          >
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-slate-400 italic">Nothing to preview</p>
            )}
          </div>
        ) : (
          <textarea
            data-markdown-editor
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 text-sm font-mono bg-white resize-y focus:outline-none"
            style={{ minHeight }}
          />
        )}
      </div>
      
      <p className="text-xs text-slate-500">
        Supports Markdown: **bold**, *italic*, `code`, [links](url), lists, and more.
      </p>
    </div>
  )
}

