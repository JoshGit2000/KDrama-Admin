'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DriveFile } from '@/types'

interface DriveUploaderProps {
  onUploadComplete: (file: DriveFile) => void
  accept?: Record<string, string[]>
  label?: string
}

export function DriveUploader({ onUploadComplete, accept, label }: DriveUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<DriveFile | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // Get Drive access token from session storage (set during OAuth)
      const accessToken = sessionStorage.getItem('driveAccessToken')
      
      if (!accessToken) {
        throw new Error('Please authenticate with Google Drive first')
      }

      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('accessToken', accessToken)

      // Upload with progress
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          setProgress(percentComplete)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText)
          setUploadedFile(result)
          onUploadComplete(result)
          setUploading(false)
        } else {
          throw new Error('Upload failed')
        }
      })

      xhr.addEventListener('error', () => {
        setError('Upload failed')
        setUploading(false)
      })

      xhr.open('POST', '/api/upload/drive')
      xhr.send(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
    }
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    disabled: uploading,
  })

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {label && <h3 className="text-sm font-medium">{label}</h3>}

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
              <p className="text-sm text-gray-600">Uploading to Google Drive...</p>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500">{Math.round(progress)}%</p>
            </div>
          ) : uploadedFile ? (
            <div className="space-y-2">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <p className="text-sm font-medium text-green-700">Upload Complete!</p>
              <p className="text-xs text-gray-600">{uploadedFile.name}</p>
              <p className="text-xs text-gray-500">File ID: {uploadedFile.fileId}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setUploadedFile(null)
                  setProgress(0)
                }}
              >
                Upload Another
              </Button>
            </div>
          ) : error ? (
            <div className="space-y-2">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <p className="text-sm font-medium text-red-700">Upload Failed</p>
              <p className="text-xs text-gray-600">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setError(null)
                  setProgress(0)
                }}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-gray-500">
                File will be uploaded to Google Drive
              </p>
            </div>
          )}
        </div>

        {uploadedFile && (
          <div className="rounded-md bg-gray-50 p-4 space-y-2">
            <h4 className="text-sm font-medium">File URLs:</h4>
            <div className="space-y-1 text-xs">
              <p className="text-gray-600">
                <span className="font-medium">Download:</span>
                <br />
                <code className="bg-gray-100 px-2 py-1 rounded break-all">
                  {uploadedFile.downloadUrl}
                </code>
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Preview:</span>
                <br />
                <code className="bg-gray-100 px-2 py-1 rounded break-all">
                  {uploadedFile.previewUrl}
                </code>
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}