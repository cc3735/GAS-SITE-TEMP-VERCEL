'use client'

/**
 * Markdown Renderer Component
 * 
 * Renders markdown content with syntax highlighting and styling.
 * 
 * @module components/MarkdownRenderer
 */

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose-courseflow ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom heading styles
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-slate-900 mb-4 mt-6 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-slate-800 mb-3 mt-5">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-slate-800 mb-2 mt-4">{children}</h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="text-slate-600 leading-relaxed mb-4">{children}</p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 ml-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-600 ml-4">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-600">{children}</li>
          ),
          // Code
          code: ({ className, children, ...props }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              )
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm">
              {children}
            </pre>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary-500 pl-4 italic text-slate-600 my-4">
              {children}
            </blockquote>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary-600 hover:text-primary-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-slate-600 border-t border-slate-200">
              {children}
            </td>
          ),
          // Horizontal rule
          hr: () => <hr className="my-6 border-slate-200" />,
          // Images
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ''}
              className="max-w-full h-auto rounded-lg my-4"
            />
          ),
          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-800">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

