'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { BackblazeUploader } from './BackblazeUploader'
import { ExternalLink } from 'lucide-react'

interface QualityManagerBackblazeProps {
  videoFileId_480p: string
  videoFileId_720p: string
  videoFileId_1080p: string
  onChange: (quality: '480p' | '720p' | '1080p', fileName: string) => void
}

export function QualityManagerBackblaze({
  videoFileId_480p,
  videoFileId_720p,
  videoFileId_1080p,
  onChange,
}: QualityManagerBackblazeProps) {
  const [showUploader, setShowUploader] = useState<string | null>(null)

  const qualities = [
    { quality: '480p' as const, fileName: videoFileId_480p, label: '480p (SD)' },
    { quality: '720p' as const, fileName: videoFileId_720p, label: '720p (HD)' },
    { quality: '1080p' as const, fileName: videoFileId_1080p, label: '1080p (Full HD)' },
  ]

  const getPublicUrl = (fileName: string) => {
    if (!fileName) return ''
    const endpoint = process.env.NEXT_PUBLIC_BACKBLAZE_ENDPOINT || 'https://s3.us-west-000.backblazeb2.com'
    const bucketName = process.env.NEXT_PUBLIC_BACKBLAZE_BUCKET_NAME || 'kdrama-storage'
    return `${endpoint}/file/${bucketName}/${fileName}`
  }

  return (
    <div className="space-y-4">
      <Label>Video Qualities</Label>

      {qualities.map(({ quality, fileName, label }) => (
        <Card key={quality} className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{label}</h4>
              {fileName && (
                <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>
              )}
            </div>

            <div className="space-y-2">
              <Label>File Name (in videos/ folder)</Label>
              <div className="flex gap-2">
                <Input
                  value={fileName}
                  onChange={(e) => onChange(quality, e.target.value)}
                  placeholder="videos/12345-abc.mp4"
                  className="font-mono text-sm"
                  readOnly={!!fileName}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploader(showUploader === quality ? null : quality)}
                >
                  {fileName ? 'Replace' : 'Upload'}
                </Button>
              </div>
            </div>

            {showUploader === quality && (
              <BackblazeUploader
                accept={{ 'video/*': ['.mp4', '.mkv', '.avi', '.mov'] }}
                folder="videos"
                onUploadComplete={(data) => {
                  onChange(quality, data.fileName)
                  setShowUploader(null)
                }}
                label={`Upload ${label} Video to Backblaze`}
              />
            )}

            {fileName && (
              <div className="rounded-md bg-gray-50 p-3 space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-700">File Name:</p>
                  <code className="text-xs bg-white px-2 py-1 rounded border block break-all mt-1">
                    {fileName}
                  </code>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Public URL:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-white px-2 py-1 rounded border block break-all">
                      {getPublicUrl(fileName)}
                    </code>
                    <a
                      href={getPublicUrl(fileName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}