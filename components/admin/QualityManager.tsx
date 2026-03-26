'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { DriveUploader } from './DriveUploader'

interface QualityManagerProps {
  videoFileId_480p: string
  videoFileId_720p: string
  videoFileId_1080p: string
  onChange: (quality: '480p' | '720p' | '1080p', fileId: string) => void
}

export function QualityManager({
  videoFileId_480p,
  videoFileId_720p,
  videoFileId_1080p,
  onChange,
}: QualityManagerProps) {
  const [showUploader, setShowUploader] = useState<string | null>(null)

  const qualities = [
    { quality: '480p' as const, fileId: videoFileId_480p, label: '480p (SD)' },
    { quality: '720p' as const, fileId: videoFileId_720p, label: '720p (HD)' },
    { quality: '1080p' as const, fileId: videoFileId_1080p, label: '1080p (Full HD)' },
  ]

  return (
    <div className="space-y-4">
      <Label>Video Qualities</Label>

      {qualities.map(({ quality, fileId, label }) => (
        <Card key={quality} className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{label}</h4>
              {fileId && (
                <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Google Drive File ID</Label>
              <div className="flex gap-2">
                <Input
                  value={fileId}
                  onChange={(e) => onChange(quality, e.target.value)}
                  placeholder="Enter File ID or upload"
                  className="font-mono text-sm"
                />
                
              </div>
            </div>

            {showUploader === quality && (
              <DriveUploader
                accept={{ 'video/*': ['.mp4', '.mkv', '.avi', '.mov'] }}
                onUploadComplete={(file) => {
                  onChange(quality, file.fileId)
                  setShowUploader(null)
                }}
                label={`Upload ${label} Video`}
              />
            )}

            {fileId && (
              <div className="rounded-md bg-gray-50 p-3 space-y-1">
                <p className="text-xs font-medium text-gray-700">File ID:</p>
                <code className="text-xs bg-white px-2 py-1 rounded border block break-all">
                  {fileId}
                </code>
                <div className="pt-2 space-y-1">
                  <p className="text-xs text-gray-600">Preview URL:</p>
                  <code className="text-xs bg-white px-2 py-1 rounded border block break-all">
                    https://drive.google.com/uc?export=preview&id={fileId}
                  </code>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}

      {!videoFileId_480p && !videoFileId_720p && !videoFileId_1080p && (
        <p className="text-center text-sm text-gray-500 py-4">
          Upload at least one video quality
        </p>
      )}
    </div>
  )
}