'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, CheckCircle2, XCircle, Loader2, Video, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface BackblazeUploaderProps {
  onUploadComplete: (data: {
    fileName: string
    fileId: string
    publicUrl: string
  }) => void
  accept?: Record<string, string[]>
  folder: 'videos' | 'subtitles'
  label?: string
}

interface UploadResult {
  fileName: string
  fileId: string
  publicUrl: string
  size: number
  contentType: string
}

export function BackblazeUploader({ 
  onUploadComplete, 
  accept, 
  folder,
  label 
}: BackblazeUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [keepOriginalName, setKeepOriginalName] = useState(true)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setCurrentFile(file)
    setUploading(true)
    setError(null)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      formData.append('keepOriginalName', keepOriginalName.toString())

      // Upload
      const response = await fetch('/api/upload/backblaze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      setUploadedFile(result)
      onUploadComplete({
        fileName: result.fileName,
        fileId: result.fileId,
        publicUrl: result.publicUrl,
      })
      setUploading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
    }
  }, [folder, keepOriginalName, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    disabled: uploading,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = () => {
    if (folder === 'videos') {
      return <Video className="h-12 w-12 text-blue-500" />
    }
    return <FileText className="h-12 w-12 text-green-500" />
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {label && <h3 className="text-sm font-medium">{label}</h3>}

        {/* Keep Original Filename Toggle */}
        <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
          <Switch
            id="keepOriginalName"
            checked={keepOriginalName}
            onCheckedChange={setKeepOriginalName}
            disabled={uploading}
          />
          <Label htmlFor="keepOriginalName" className="cursor-pointer text-sm">
            Keep original filename
            <span className="text-xs text-gray-500 ml-2 block sm:inline">
              {keepOriginalName ? '(Original name preserved)' : '(Random name generated)'}
            </span>
          </Label>
        </div>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Uploading {currentFile?.name}...
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(currentFile?.size || 0)}
                </p>
                <p className="text-xs text-gray-400">
                  Please wait, this may take a while for large files
                </p>
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="space-y-3">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-700">Upload Complete!</p>
                <p className="text-xs text-gray-600 mt-1 break-all">{uploadedFile.fileName}</p>
              </div>
              
              <div className="bg-gray-50 rounded-md p-3 text-left space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-700">File Name:</p>
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {uploadedFile.fileName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">File ID:</p>
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {uploadedFile.fileId}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Size:</p>
                  <p className="text-xs text-gray-600">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setUploadedFile(null)
                  setCurrentFile(null)
                }}
              >
                Upload Another
              </Button>
            </div>
          ) : error ? (
            <div className="space-y-3">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-700">Upload Failed</p>
                <p className="text-xs text-gray-600 mt-1">{error}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setError(null)
                  setCurrentFile(null)
                }}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {getFileIcon()}
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Upload to {folder === 'videos' ? 'Videos' : 'Subtitles'} folder
                </p>
                {accept && (
                  <p className="text-xs text-gray-400 mt-1">
                    Accepted: {Object.values(accept).flat().join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}