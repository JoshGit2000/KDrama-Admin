'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DriveUploader } from '@/components/admin/DriveUploader'
import { useToast } from '@/hooks/use-toast'
import { DriveFile } from '@/types'
import { ExternalLink, Copy, CheckCircle2 } from 'lucide-react'

export default function UploadsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<DriveFile[]>([])
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if Drive token exists
    const token = sessionStorage.getItem('driveAccessToken')
    setIsAuthenticated(!!token)
  }, [])

  const handleAuthClick = async () => {
    try {
      const response = await fetch('/api/upload/auth')
      const { authUrl } = await response.json()
      
      // Open OAuth window
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2
      
      const authWindow = window.open(
        authUrl,
        'Google Drive Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      // Listen for auth completion
      window.addEventListener('message', (event) => {
        if (event.data.type === 'DRIVE_AUTH_SUCCESS') {
          sessionStorage.setItem('driveAccessToken', event.data.token)
          setIsAuthenticated(true)
          authWindow?.close()
          toast({
            title: 'Success',
            description: 'Connected to Google Drive successfully',
          })
        }
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to authenticate with Google Drive',
        variant: 'destructive',
      })
    }
  }

  const handleUploadComplete = (file: DriveFile) => {
    setUploadedFiles([file, ...uploadedFiles])
    toast({
      title: 'Success',
      description: `${file.name} uploaded successfully`,
    })
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
    toast({
      title: 'Copied',
      description: 'URL copied to clipboard',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Google Drive Uploads</h1>
        <p className="text-gray-600 mt-2">Upload media files to Google Drive</p>
      </div>

      {!isAuthenticated ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg className="h-16 w-16 text-gray-400" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.01 1.485c-.403 0-.802.086-1.153.25l-7.42 4.283c-.702.406-1.14 1.174-1.14 2v8.571c0 .826.438 1.594 1.14 2l7.42 4.283c.351.164.75.25 1.153.25.403 0 .802-.086 1.153-.25l7.42-4.283c.702-.406 1.14-1.174 1.14-2V8.018c0-.826-.438-1.594-1.14-2l-7.42-4.283c-.351-.164-.75-.25-1.153-.25z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Connect to Google Drive</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Authenticate with Google Drive to upload videos, images, and subtitles
            </p>
            <Button size="lg" onClick={handleAuthClick}>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.01 1.485c-.403 0-.802.086-1.153.25l-7.42 4.283c-.702.406-1.14 1.174-1.14 2v8.571c0 .826.438 1.594 1.14 2l7.42 4.283c.351.164.75.25 1.153.25.403 0 .802-.086 1.153-.25l7.42-4.283c.702-.406 1.14-1.174 1.14-2V8.018c0-.826-.438-1.594-1.14-2l-7.42-4.283c-.351-.164-.75-.25-1.153-.25z"
                />
              </svg>
              Connect to Google Drive
            </Button>
          </div>
        </Card>
      ) : (
        <>
            <DriveUploader
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
              onUploadComplete={handleUploadComplete}
              label="Upload Image"
            />

          {uploadedFiles.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recently Uploaded Files</h2>
              <div className="space-y-4">
                {uploadedFiles.map((file) => (
                  <div key={file.fileId} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.mimeType}
                        </p>
                      </div>
                      <a
                        href={file.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs break-all">
                          {file.downloadUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(file.downloadUrl)}
                        >
                          {copiedUrl === file.downloadUrl ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs break-all">
                          {file.previewUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(file.previewUrl)}
                        >
                          {copiedUrl === file.previewUrl ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}