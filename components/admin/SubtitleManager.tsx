'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Subtitle } from '@/types'
import { DriveUploader } from './DriveUploader'

interface SubtitleManagerProps {
  subtitles: Subtitle[]
  onChange: (subtitles: Subtitle[]) => void
}

export function SubtitleManager({ subtitles, onChange }: SubtitleManagerProps) {
  const [showUploader, setShowUploader] = useState<string | null>(null)

  // Ensure we always have English and Sinhala subtitle slots
  const ensureSubtitles = () => {
    const english = subtitles.find(s => s.language === 'english') || {
      language: 'english' as const,
      label: 'English',
      fileId: '',
    }
    
    const sinhala = subtitles.find(s => s.language === 'sinhala') || {
      language: 'sinhala' as const,
      label: 'සිංහල',
      fileId: '',
    }

    return [english, sinhala]
  }

  const currentSubtitles = ensureSubtitles()

  const updateSubtitle = (language: 'english' | 'sinhala', fileId: string) => {
    const updated = currentSubtitles.map(sub => 
      sub.language === language 
        ? { ...sub, fileId }
        : sub
    )
    
    // Only include subtitles that have fileIds
    const filtered = updated.filter(s => s.fileId)
    onChange(filtered)
  }

  const removeSubtitle = (language: 'english' | 'sinhala') => {
    const updated = currentSubtitles.map(sub => 
      sub.language === language 
        ? { ...sub, fileId: '' }
        : sub
    )
    
    const filtered = updated.filter(s => s.fileId)
    onChange(filtered)
  }

  return (
    <div className="space-y-4">
      <Label>Subtitles</Label>

      {/* English Subtitle */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">English Subtitle</h4>
            {currentSubtitles[0].fileId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSubtitle('english')}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>File ID</Label>
            <div className="flex gap-2">
              <Input
                value={currentSubtitles[0].fileId}
                onChange={(e) => updateSubtitle('english', e.target.value)}
                placeholder="Google Drive File ID"
                className="font-mono text-sm"
              />
              
            </div>
          </div>

          {showUploader === 'english' && (
            <DriveUploader
              accept={{ 'text/*': ['.vtt', '.srt'] }}
              onUploadComplete={(file) => {
                updateSubtitle('english', file.fileId)
                setShowUploader(null)
              }}
              label="Upload English Subtitle (.vtt or .srt)"
            />
          )}

          {currentSubtitles[0].fileId && (
            <div className="rounded-md bg-green-50 p-3 border border-green-200">
              <p className="text-xs text-green-800 font-medium">✓ English subtitle uploaded</p>
              <p className="text-xs text-green-600 mt-1 font-mono break-all">
                {currentSubtitles[0].fileId}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Sinhala Subtitle */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Sinhala Subtitle (සිංහල උපසිරැසි)</h4>
            {currentSubtitles[1].fileId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSubtitle('sinhala')}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>File ID</Label>
            <div className="flex gap-2">
              <Input
                value={currentSubtitles[1].fileId}
                onChange={(e) => updateSubtitle('sinhala', e.target.value)}
                placeholder="Google Drive File ID"
                className="font-mono text-sm"
              />
              
            </div>
          </div>

          {showUploader === 'sinhala' && (
            <DriveUploader
              accept={{ 'text/*': ['.vtt', '.srt'] }}
              onUploadComplete={(file) => {
                updateSubtitle('sinhala', file.fileId)
                setShowUploader(null)
              }}
              label="Upload Sinhala Subtitle (.vtt or .srt)"
            />
          )}

          {currentSubtitles[1].fileId && (
            <div className="rounded-md bg-green-50 p-3 border border-green-200">
              <p className="text-xs text-green-800 font-medium">✓ සිංහල උපසිරැසි උඩුගත කරන ලදී</p>
              <p className="text-xs text-green-600 mt-1 font-mono break-all">
                {currentSubtitles[1].fileId}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}