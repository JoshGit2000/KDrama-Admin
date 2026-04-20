'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Episode } from '@/types'
import { DriveUploader } from './DriveUploader'
import { BackblazeUploader } from './BackblazeUploader'
import { SubtitleManagerBackblaze } from './SubtitleManagerBackblaze'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface EpisodeFormProps {
  dramaId: string
  episode?: Episode
  episodeNumber?: number
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EpisodeForm({
  dramaId,
  episode,
  episodeNumber,
  open,
  onClose,
  onSuccess,
}: EpisodeFormProps) {
  const [loading, setLoading] = useState(false)
  const [showUploader, setShowUploader] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    episodeNumber: episode?.episodeNumber || episodeNumber || 1,
    title: episode?.title || '',
    titleSinhala: episode?.titleSinhala || '',
    description: episode?.description || '',
    descriptionSinhala: episode?.descriptionSinhala || '',
    duration: episode?.duration || 0,
    thumbnailFilename: episode?.thumbnailFilename || '',
    // Changed to fileName for Backblaze
    videoFileId_480p: episode?.videoFileId_480p || '',
    videoFileId_720p: episode?.videoFileId_720p || '',
    videoFileId_1080p: episode?.videoFileId_1080p || '',
    subtitles: episode?.subtitles || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.title) {
        throw new Error('Episode title is required')
      }

      if (!formData.videoFileId_480p && !formData.videoFileId_720p && !formData.videoFileId_1080p) {
        throw new Error('At least one video quality is required')
      }

      const payload = {
        episodeNumber: formData.episodeNumber,
        title: formData.title,
        titleSinhala: formData.titleSinhala,
        description: formData.description,
        descriptionSinhala: formData.descriptionSinhala,
        duration: formData.duration,
        thumbnailFilename: formData.thumbnailFilename,
        // Changed to fileName for Backblaze
        videoFileId_480p: formData.videoFileId_480p,
        videoFileId_720p: formData.videoFileId_720p,
        videoFileId_1080p: formData.videoFileId_1080p,
        subtitles: formData.subtitles,
      }

      const url = episode
        ? `/api/dramas/${dramaId}/episodes/${episode.id}`
        : `/api/dramas/${dramaId}/episodes`
      
      const method = episode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save episode')
      }

      onSuccess()
      onClose()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save episode')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {episode ? `Edit Episode ${episode.episodeNumber}` : 'Add New Episode'}
          </DialogTitle>
          <DialogDescription>
            {episode ? 'Update episode information' : 'Add a new episode to this drama'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="episodeNumber">Episode Number *</Label>
                <Input
                  id="episodeNumber"
                  type="number"
                  value={formData.episodeNumber}
                  onChange={(e) => setFormData({ ...formData, episodeNumber: parseInt(e.target.value) })}
                  required
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  placeholder="3600"
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.duration ? `${Math.floor(formData.duration / 60)} minutes` : ''}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title (English) *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Episode 1: The Beginning"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titleSinhala">Title (Sinhala)</Label>
                <Input
                  id="titleSinhala"
                  value={formData.titleSinhala}
                  onChange={(e) => setFormData({ ...formData, titleSinhala: e.target.value })}
                  placeholder="කථාංගය 1: ආරම්භය"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description (English)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Episode description..."
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="descriptionSinhala">Description (Sinhala)</Label>
                <Textarea
                  id="descriptionSinhala"
                  value={formData.descriptionSinhala}
                  onChange={(e) => setFormData({ ...formData, descriptionSinhala: e.target.value })}
                  rows={3}
                  placeholder="කථාංගයේ විස්තරය..."
                />
              </div>
            </div>
          </Card>

          {/* Thumbnail - Still using Google Drive */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Episode Thumbnail (Google Drive)</h3>
            <p className="text-xs text-gray-600 mb-3">Upload episode thumbnail to Google Drive</p>
            
            <div className="space-y-2">
              <Label>Thumbnail File ID</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.thumbnailFilename}
                  onChange={(e) => setFormData({ ...formData, thumbnailFilename: e.target.value })}
                  placeholder="Google Drive File ID (optional)"
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploader(showUploader === 'thumbnail' ? null : 'thumbnail')}
                >
                  {formData.thumbnailFilename ? 'Replace' : 'Upload'}
                </Button>
              </div>

              {showUploader === 'thumbnail' && (
                <DriveUploader
                  accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                  onUploadComplete={(file) => {
                    setFormData({ ...formData, thumbnailFilename: file.fileId })
                    setShowUploader(null)
                  }}
                  label="Upload Thumbnail to Google Drive"
                />
              )}

              {formData.thumbnailFilename && (
                <div className="rounded-md bg-green-50 p-2 border border-green-200">
                  <p className="text-xs text-green-800 font-mono break-all">
                    {formData.thumbnailFilename}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Video Qualities - Now using Backblaze */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Video Files (Backblaze B2)</h3>
            <p className="text-xs text-gray-600 mb-3">Upload video files to Backblaze B2 storage</p>
            
            <div className="space-y-4">
              {/* 480p */}
              <div className="space-y-2">
                <Label>480p (SD) Quality</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.videoFileId_480p}
                    onChange={(e) => setFormData({ ...formData, videoFileId_480p: e.target.value })}
                    placeholder="videos/12345-abc.mp4"
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploader(showUploader === '480p' ? null : '480p')}
                  >
                    {formData.videoFileId_480p ? 'Replace' : 'Upload'}
                  </Button>
                </div>

                {showUploader === '480p' && (
                  <BackblazeUploader
                    accept={{ 'video/*': ['.mp4', '.mkv', '.avi', '.mov'] }}
                    folder="videos"
                    onUploadComplete={(data) => {
                      setFormData({ ...formData, videoFileId_480p: data.fileName })
                      setShowUploader(null)
                    }}
                    label="Upload 480p Video to Backblaze"
                  />
                )}

                {formData.videoFileId_480p && (
                  <div className="rounded-md bg-gray-50 p-2">
                    <code className="text-xs break-all">{formData.videoFileId_480p}</code>
                  </div>
                )}
              </div>

              {/* 720p */}
              <div className="space-y-2">
                <Label>720p (HD) Quality</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.videoFileId_720p}
                    onChange={(e) => setFormData({ ...formData, videoFileId_720p: e.target.value })}
                    placeholder="videos/12345-abc.mp4"
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploader(showUploader === '720p' ? null : '720p')}
                  >
                    {formData.videoFileId_720p ? 'Replace' : 'Upload'}
                  </Button>
                </div>

                {showUploader === '720p' && (
                  <BackblazeUploader
                    accept={{ 'video/*': ['.mp4', '.mkv', '.avi', '.mov'] }}
                    folder="videos"
                    onUploadComplete={(data) => {
                      setFormData({ ...formData, videoFileId_720p: data.fileName })
                      setShowUploader(null)
                    }}
                    label="Upload 720p Video to Backblaze"
                  />
                )}

                {formData.videoFileId_720p && (
                  <div className="rounded-md bg-gray-50 p-2">
                    <code className="text-xs break-all">{formData.videoFileId_720p}</code>
                  </div>
                )}
              </div>

              {/* 1080p */}
              <div className="space-y-2">
                <Label>1080p (Full HD) Quality</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.videoFileId_1080p}
                    onChange={(e) => setFormData({ ...formData, videoFileId_1080p: e.target.value })}
                    placeholder="videos/12345-abc.mp4"
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploader(showUploader === '1080p' ? null : '1080p')}
                  >
                    {formData.videoFileId_1080p ? 'Replace' : 'Upload'}
                  </Button>
                </div>

                {showUploader === '1080p' && (
                  <BackblazeUploader
                    accept={{ 'video/*': ['.mp4', '.mkv', '.avi', '.mov'] }}
                    folder="videos"
                    onUploadComplete={(data) => {
                      setFormData({ ...formData, videoFileId_1080p: data.fileName })
                      setShowUploader(null)
                    }}
                    label="Upload 1080p Video to Backblaze"
                  />
                )}

                {formData.videoFileId_1080p && (
                  <div className="rounded-md bg-gray-50 p-2">
                    <code className="text-xs break-all">{formData.videoFileId_1080p}</code>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Subtitles - Now using Backblaze */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Subtitles (Backblaze B2)</h3>
            <p className="text-xs text-gray-600 mb-3">Upload subtitle files to Backblaze B2 storage</p>
            <SubtitleManagerBackblaze
              subtitles={formData.subtitles}
              onChange={(subtitles) => setFormData({ ...formData, subtitles })}
            />
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {episode ? 'Update Episode' : 'Add Episode'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
