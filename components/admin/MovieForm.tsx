'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { Movie } from '@/types'
import { QualityManagerBackblaze } from './QualityManagerBackblaze'
import { SubtitleManagerBackblaze } from './SubtitleManagerBackblaze'
import { TrailerInput } from './TrailerInput'
import { DriveUploader } from './DriveUploader'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface MovieFormProps {
  movie?: Movie
  mode: 'create' | 'edit'
}

export function MovieForm({ movie, mode }: MovieFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: movie?.title || '',
    titleSinhala: movie?.titleSinhala || '',
    description: movie?.description || '',
    descriptionSinhala: movie?.descriptionSinhala || '',
    year: movie?.year || new Date().getFullYear(),
    rating: movie?.rating || 0,
    genres: movie?.genres?.join(', ') || '',
    trending: movie?.trending || false,
    new: movie?.new || false,
    thumbnailFileId: movie?.thumbnailFileId || '',
    bannerFileId: movie?.bannerFileId || '',
    duration: movie?.duration || 0,
    // Changed to fileName for Backblaze
    videoFileId_480p: movie?.videoFileId_480p || '',
    videoFileId_720p: movie?.videoFileId_720p || '',
    videoFileId_1080p: movie?.videoFileId_1080p || '',
    subtitles: movie?.subtitles || [],
    trailerUrl: movie?.trailerUrl || '',
  })

  const [showThumbnailUploader, setShowThumbnailUploader] = useState(false)
  const [showBannerUploader, setShowBannerUploader] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.title || !formData.description) {
        throw new Error('Title and description are required')
      }

      if (!formData.videoFileId_480p && !formData.videoFileId_720p && !formData.videoFileId_1080p) {
        throw new Error('At least one video quality is required')
      }

      if (!formData.thumbnailFileId || !formData.bannerFileId) {
        throw new Error('Thumbnail and banner are required')
      }

      const payload = {
        title: formData.title,
        titleSinhala: formData.titleSinhala,
        description: formData.description,
        descriptionSinhala: formData.descriptionSinhala,
        year: formData.year,
        rating: formData.rating,
        genres: formData.genres.split(',').map(g => g.trim()).filter(Boolean),
        trending: formData.trending,
        new: formData.new,
        thumbnailFileId: formData.thumbnailFileId,
        bannerFileId: formData.bannerFileId,
        duration: formData.duration,
        // Changed to fileName for Backblaze
        videoFileId_480p: formData.videoFileId_480p,
        videoFileId_720p: formData.videoFileId_720p,
        videoFileId_1080p: formData.videoFileId_1080p,
        subtitles: formData.subtitles,
        trailerUrl: formData.trailerUrl,
        type: 'movie',
      }

      const url = mode === 'create' ? '/api/movies' : `/api/movies/${movie?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save movie')
      }

      toast({
        title: 'Success',
        description: `Movie ${mode === 'create' ? 'created' : 'updated'} successfully`,
      })

      router.push('/admin/movies')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save movie',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (English) *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Train to Busan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="titleSinhala">Title (Sinhala)</Label>
            <Input
              id="titleSinhala"
              value={formData.titleSinhala}
              onChange={(e) => setFormData({ ...formData, titleSinhala: e.target.value })}
              placeholder="ට්‍රේන් ටු බුසාන්"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="description">Description (English) *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Passengers struggle to survive..."
              required
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="descriptionSinhala">Description (Sinhala)</Label>
            <Textarea
              id="descriptionSinhala"
              value={formData.descriptionSinhala}
              onChange={(e) => setFormData({ ...formData, descriptionSinhala: e.target.value })}
              rows={4}
              placeholder="සොම්බි වෛරසයක්..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Rating (0-10) *</Label>
            <Input
              id="rating"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (seconds) *</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              placeholder="7080"
              required
            />
            <p className="text-xs text-gray-500">
              {formData.duration ? `${Math.floor(formData.duration / 60)} minutes` : ''}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genres">Genres (comma-separated) *</Label>
            <Input
              id="genres"
              value={formData.genres}
              onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
              placeholder="Action, Horror, Thriller"
              required
            />
          </div>

          <div className="col-span-2 flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="trending"
                checked={formData.trending}
                onCheckedChange={(checked) => setFormData({ ...formData, trending: checked })}
              />
              <Label htmlFor="trending" className="cursor-pointer">Trending</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="new"
                checked={formData.new}
                onCheckedChange={(checked) => setFormData({ ...formData, new: checked })}
              />
              <Label htmlFor="new" className="cursor-pointer">New Release</Label>
            </div>
          </div>
        </div>
      </Card>

      {/* Trailer Section */}
      <TrailerInput
        value={formData.trailerUrl}
        onChange={(url) => setFormData({ ...formData, trailerUrl: url })}
      />

      {/* Images - Still using Google Drive */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Images (Google Drive)</h3>
        <p className="text-sm text-gray-600 mb-4">Upload posters and banners to Google Drive</p>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Thumbnail *</Label>
            <Input
              value={formData.thumbnailFileId}
              onChange={(e) => setFormData({ ...formData, thumbnailFileId: e.target.value })}
              placeholder="Google Drive File ID"
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowThumbnailUploader(!showThumbnailUploader)}
            >
              {formData.thumbnailFileId ? 'Replace Thumbnail' : 'Upload Thumbnail'}
            </Button>
            
            {showThumbnailUploader && (
              <DriveUploader
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                onUploadComplete={(file) => {
                  setFormData({ ...formData, thumbnailFileId: file.fileId })
                  setShowThumbnailUploader(false)
                }}
                label="Upload Thumbnail to Google Drive"
              />
            )}

            {formData.thumbnailFileId && (
              <div className="rounded-md bg-green-50 p-2 border border-green-200">
                <p className="text-xs text-green-800 font-mono break-all">
                  {formData.thumbnailFileId}
                </p>
              </div>
            )}
          </div>

          {/* Banner */}
          <div className="space-y-2">
            <Label>Banner *</Label>
            <Input
              value={formData.bannerFileId}
              onChange={(e) => setFormData({ ...formData, bannerFileId: e.target.value })}
              placeholder="Google Drive File ID"
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowBannerUploader(!showBannerUploader)}
            >
              {formData.bannerFileId ? 'Replace Banner' : 'Upload Banner'}
            </Button>
            
            {showBannerUploader && (
              <DriveUploader
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                onUploadComplete={(file) => {
                  setFormData({ ...formData, bannerFileId: file.fileId })
                  setShowBannerUploader(false)
                }}
                label="Upload Banner to Google Drive"
              />
            )}

            {formData.bannerFileId && (
              <div className="rounded-md bg-green-50 p-2 border border-green-200">
                <p className="text-xs text-green-800 font-mono break-all">
                  {formData.bannerFileId}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Video Qualities - Now using Backblaze */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Video Files (Backblaze B2)</h3>
        <p className="text-sm text-gray-600 mb-4">Upload video files to Backblaze B2 storage</p>
        <QualityManagerBackblaze
          videoFileId_480p={formData.videoFileId_480p}
          videoFileId_720p={formData.videoFileId_720p}
          videoFileId_1080p={formData.videoFileId_1080p}
          onChange={(quality, fileName) => {
            setFormData({
              ...formData,
              [`videoFileId_${quality}`]: fileName,
            })
          }}
        />
      </Card>

      {/* Subtitles - Now using Backblaze */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Subtitles (Backblaze B2)</h3>
        <p className="text-sm text-gray-600 mb-4">Upload subtitle files to Backblaze B2 storage</p>
        <SubtitleManagerBackblaze
          subtitles={formData.subtitles}
          onChange={(subtitles) => setFormData({ ...formData, subtitles })}
        />
      </Card>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Movie' : 'Update Movie'}
        </Button>
      </div>
    </form>
  )
}