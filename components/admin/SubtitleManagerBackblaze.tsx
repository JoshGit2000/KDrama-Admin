'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Subtitle } from '@/types'
import { BackblazeUploader } from './BackblazeUploader'

interface SubtitleManagerBackblazeProps {
  subtitles: Subtitle[]
  onChange: (subtitles: Subtitle[]) => void
}

export function SubtitleManagerBackblaze({ subtitles, onChange }: SubtitleManagerBackblazeProps) {
  const [showUploader, setShowUploader] = useState<string | null>(null)

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
            <Label>File Name</Label>
            <div className="flex gap-2">
              <Input
                value={currentSubtitles[0].fileId}
                onChange={(e) => updateSubtitle('english', e.target.value)}
                placeholder="subtitles/12345-en.vtt"
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploader(showUploader === 'english' ? null : 'english')}
              >
                {currentSubtitles[0].fileId ? 'Replace' : 'Upload'}
              </Button>
            </div>
          </div>

          {showUploader === 'english' && (
            <BackblazeUploader
              accept={{ 'text/*': ['.vtt', '.srt'] }}
              folder="subtitles"
              onUploadComplete={(data) => {
                updateSubtitle('english', data.fileId)
                setShowUploader(null)
              }}
              label="Upload English Subtitle to Backblaze"
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
            <Label>File Name</Label>
            <div className="flex gap-2">
              <Input
                value={currentSubtitles[1].fileId}
                onChange={(e) => updateSubtitle('sinhala', e.target.value)}
                placeholder="subtitles/12345-si.vtt"
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploader(showUploader === 'sinhala' ? null : 'sinhala')}
              >
                {currentSubtitles[1].fileId ? 'Replace' : 'Upload'}
              </Button>
            </div>
          </div>

          {showUploader === 'sinhala' && (
            <BackblazeUploader
              accept={{ 'text/*': ['.vtt', '.srt'] }}
              folder="subtitles"
              onUploadComplete={(data) => {
                updateSubtitle('sinhala', data.fileId)
                setShowUploader(null)
              }}
              label="Upload Sinhala Subtitle to Backblaze"
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
