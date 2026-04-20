'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { Drama } from '@/types'
import { TrailerInput } from './TrailerInput'
import { DriveUploader } from './DriveUploader'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface DramaFormProps {
  drama?: Drama
  mode: 'create' | 'edit'
}

export function DramaForm({ drama, mode }: DramaFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: drama?.title || '',
    titleSinhala: drama?.titleSinhala || '',
    description: drama?.description || '',
    descriptionSinhala: drama?.descriptionSinhala || '',
    year: drama?.year || new Date().getFullYear(),
    rating: drama?.rating || 0,
    genres: drama?.genres?.join(', ') || '',
    trending: drama?.trending || false,
    new: drama?.new || false,
    completed: drama?.completed || false,
    thumbnailFilename: drama?.thumbnailFilename || '',
    bannerFilename: drama?.bannerFilename || '',
    totalEpisodes: drama?.totalEpisodes || 0,
    trailerUrl: drama?.trailerUrl || '',
  })

  const [showThumbnailUploader, setShowThumbnailUploader] = useState(false)
  const [showBannerUploader, setShowBannerUploader] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.title || !formData.description) {
        throw new Error('Title and description are required')
      }

      if (!formData.thumbnailFilename || !formData.bannerFilename) {
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
        completed: formData.completed,
        thumbnailFilename: formData.thumbnailFilename,
        bannerFilename: formData.bannerFilename,
        totalEpisodes: formData.totalEpisodes,
        trailerUrl: formData.trailerUrl,
        type: 'drama',
      }

      const url = mode === 'create' ? '/api/dramas' : `/api/dramas/${drama?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save drama')
      }

      toast({
        title: 'Success',
        description: `Drama ${mode === 'create' ? 'created' : 'updated'} successfully`,
      })

      router.push('/admin/dramas')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save drama',
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
              placeholder="Crash Landing on You"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="titleSinhala">Title (Sinhala)</Label>
            <Input
              id="titleSinhala"
              value={formData.titleSinhala}
              onChange={(e) => setFormData({ ...formData, titleSinhala: e.target.value })}
              placeholder="ක්‍රෑෂ් ලෑන්ඩින් ඔන් යූ"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="description">Description (English) *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="A South Korean heiress crash lands in North Korea..."
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
              placeholder="දකුණු කොරියානු උරුමක්කාරියක්..."
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
            <Label htmlFor="totalEpisodes">Total Episodes</Label>
            <Input
              id="totalEpisodes"
              type="number"
              value={formData.totalEpisodes}
              onChange={(e) => setFormData({ ...formData, totalEpisodes: parseInt(e.target.value) })}
              placeholder="16"
              disabled
            />
            <p className="text-xs text-gray-500">
              Auto-updated when you add episodes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genres">Genres (comma-separated) *</Label>
            <Input
              id="genres"
              value={formData.genres}
              onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
              placeholder="Romance, Comedy, Drama"
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

            <div className="flex items-center space-x-2">
              <Switch
                id="completed"
                checked={formData.completed}
                onCheckedChange={(checked) => setFormData({ ...formData, completed: checked })}
              />
              <Label htmlFor="completed" className="cursor-pointer">Completed</Label>
            </div>
          </div>
        </div>
      </Card>

      {/* Trailer Section */}
      <TrailerInput
        value={formData.trailerUrl}
        onChange={(url) => setFormData({ ...formData, trailerUrl: url })}
      />

      {/* Images */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Images (Google Drive)</h3>
        <p className="text-sm text-gray-600 mb-4">Upload posters and banners to Google Drive</p>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Thumbnail *</Label>
            <Input
              value={formData.thumbnailFilename}
              onChange={(e) => setFormData({ ...formData, thumbnailFilename: e.target.value })}
              placeholder="Google Drive File ID"
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowThumbnailUploader(!showThumbnailUploader)}
            >
              {formData.thumbnailFilename ? 'Replace Thumbnail' : 'Upload Thumbnail'}
            </Button>
            
            {showThumbnailUploader && (
              <DriveUploader
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                onUploadComplete={(file) => {
                  setFormData({ ...formData, thumbnailFilename: file.fileId })
                  setShowThumbnailUploader(false)
                }}
                label="Upload Thumbnail"
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

          {/* Banner */}
          <div className="space-y-2">
            <Label>Banner *</Label>
            <Input
              value={formData.bannerFilename}
              onChange={(e) => setFormData({ ...formData, bannerFilename: e.target.value })}
              placeholder="Google Drive File ID"
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowBannerUploader(!showBannerUploader)}
            >
              {formData.bannerFilename ? 'Replace Banner' : 'Upload Banner'}
            </Button>
            
            {showBannerUploader && (
              <DriveUploader
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                onUploadComplete={(file) => {
                  setFormData({ ...formData, bannerFilename: file.fileId })
                  setShowBannerUploader(false)
                }}
                label="Upload Banner"
              />
            )}

            {formData.bannerFilename && (
              <div className="rounded-md bg-green-50 p-2 border border-green-200">
                <p className="text-xs text-green-800 font-mono break-all">
                  {formData.bannerFilename}
                </p>
              </div>
            )}
          </div>
        </div>
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
          {mode === 'create' ? 'Create Drama' : 'Update Drama'}
        </Button>
      </div>
    </form>
  )
}
