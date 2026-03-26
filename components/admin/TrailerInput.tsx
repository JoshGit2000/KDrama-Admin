'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Youtube, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TrailerInputProps {
  value: string
  onChange: (url: string) => void
}

export function TrailerInput({ value, onChange }: TrailerInputProps) {
  const [videoId, setVideoId] = useState<string | null>(null)

  // Extract YouTube video ID from URL
  useEffect(() => {
    if (value) {
      const id = extractYouTubeId(value)
      setVideoId(id)
    } else {
      setVideoId(null)
    }
  }, [value])

  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null

    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  const getEmbedUrl = (id: string) => {
    return `https://www.youtube.com/embed/${id}`
  }

  const clearTrailer = () => {
    onChange('')
    setVideoId(null)
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold">Trailer</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trailerUrl">YouTube Trailer URL</Label>
          <div className="flex gap-2">
            <Input
              id="trailerUrl"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ"
              className="flex-1"
            />
            {value && (
              <Button
                type="button"
                variant="outline"
                onClick={clearTrailer}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Paste a YouTube video URL. Supported formats:
            <br />
            • https://www.youtube.com/watch?v=VIDEO_ID
            <br />
            • https://youtu.be/VIDEO_ID
            <br />
            • Just the VIDEO_ID
          </p>
        </div>

        {videoId ? (
          <div className="space-y-3">
            <div className="rounded-md bg-green-50 p-3 border border-green-200">
              <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                ✓ Valid YouTube URL detected
              </p>
              <p className="text-xs text-green-600 mt-1">
                Video ID: <code className="bg-white px-1 py-0.5 rounded">{videoId}</code>
              </p>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Preview</Label>
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Watch on YouTube
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg border"
                  src={getEmbedUrl(videoId)}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        ) : value ? (
          <div className="rounded-md bg-yellow-50 p-3 border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠ Invalid YouTube URL
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Please check the URL format and try again.
            </p>
          </div>
        ) : (
          <div className="rounded-md bg-gray-50 p-8 border-2 border-dashed border-gray-300 text-center">
            <Youtube className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No trailer added</p>
            <p className="text-xs text-gray-500 mt-1">
              Paste a YouTube URL above to add a trailer
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}