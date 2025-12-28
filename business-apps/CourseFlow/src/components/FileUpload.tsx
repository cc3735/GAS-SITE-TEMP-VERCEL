'use client'

/**
 * File Upload Component
 * 
 * Handles file uploads to Supabase Storage with drag-and-drop support.
 * 
 * @module components/FileUpload
 */

import { useState, useRef, useCallback } from 'react'
import { Upload, X, File, Image, FileText, Archive, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UploadedFile {
  name: string
  url: string
  size: number
  type: string
}

interface FileUploadProps {
  onUpload: (files: UploadedFile[]) => void
  existingFiles?: UploadedFile[]
  onRemove?: (url: string) => void
  bucket?: string
  folder?: string
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  label?: string
  required?: boolean
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/zip',
  'text/plain',
]

export default function FileUpload({
  onUpload,
  existingFiles = [],
  onRemove,
  bucket = 'courseflow',
  folder = 'uploads',
  maxFiles = 5,
  maxSizeMB = 50,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  label = 'Upload Files',
  required = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    if (type.includes('pdf') || type.includes('document')) return FileText
    if (type.includes('zip') || type.includes('archive')) return Archive
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit`
    }
    return null
  }

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    if (existingFiles.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    setUploading(true)
    setError(null)

    const uploadedFiles: UploadedFile[] = []

    for (const file of fileArray) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        continue
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError(`Failed to upload ${file.name}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      uploadedFiles.push({
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
      })
    }

    if (uploadedFiles.length > 0) {
      onUpload(uploadedFiles)
    }

    setUploading(false)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
    }
  }, [existingFiles.length])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files)
    }
  }

  const handleRemove = async (url: string) => {
    if (onRemove) {
      onRemove(url)
    }
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            <p className="text-sm text-slate-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className={`h-8 w-8 ${dragActive ? 'text-primary-600' : 'text-slate-400'}`} />
            <p className="text-sm text-slate-600">
              <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">
              Max {maxSizeMB}MB per file. Max {maxFiles} files.
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Uploaded files list */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          {existingFiles.map((file, index) => {
            const FileIcon = getFileIcon(file.type)
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <FileIcon className="h-5 w-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(file.url)
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

