'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Edit, Trash2, Play, ArrowLeft } from 'lucide-react'
import { Drama, Episode } from '@/types'
import { EpisodeForm } from '@/components/admin/EpisodeForm'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function EpisodesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [drama, setDrama] = useState<Drama | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEpisode, setEditingEpisode] = useState<Episode | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchDrama()
    fetchEpisodes()
  }, [params.id])

  const fetchDrama = async () => {
    try {
      const response = await fetch(`/api/dramas/${params.id}`)
      const data = await response.json()
      setDrama(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch drama',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEpisodes = async () => {
    try {
      const response = await fetch(`/api/dramas/${params.id}/episodes`)
      const data = await response.json()
      setEpisodes(data)
    } catch (error) {
      console.error('Failed to fetch episodes:', error)
    }
  }

  const handleAddEpisode = () => {
    setEditingEpisode(undefined)
    setShowForm(true)
  }

  const handleEditEpisode = (episode: Episode) => {
    setEditingEpisode(episode)
    setShowForm(true)
  }

  const handleDeleteEpisode = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/dramas/${params.id}/episodes/${deleteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast({
        title: 'Success',
        description: 'Episode deleted successfully',
      })

      fetchDrama()
      fetchEpisodes()
      setDeleteId(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete episode',
        variant: 'destructive',
      })
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!drama) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Drama not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/dramas')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{drama.title}</h1>
          <p className="text-gray-600 mt-2">
            Manage episodes • {drama.totalEpisodes} episodes
          </p>
        </div>
        <Button onClick={handleAddEpisode}>
          <Plus className="mr-2 h-4 w-4" />
          Add Episode
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Ep #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Videos</TableHead>
              <TableHead>Subtitles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {episodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Play className="h-12 w-12 text-gray-400" />
                    <p className="text-gray-600">No episodes yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddEpisode}
                    >
                      Add First Episode
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              episodes.map((episode) => (
                <TableRow key={episode.id}>
                  <TableCell className="font-medium">
                    {episode.episodeNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{episode.title}</p>
                      {episode.titleSinhala && (
                        <p className="text-sm text-gray-500">
                          {episode.titleSinhala}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(episode.duration)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {episode.videoFileId_480p && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          480p
                        </span>
                      )}
                      {episode.videoFileId_720p && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          720p
                        </span>
                      )}
                      {episode.videoFileId_1080p && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          1080p
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {episode.subtitles?.some(s => s.language === 'english') && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          EN
                        </span>
                      )}
                      {episode.subtitles?.some(s => s.language === 'sinhala') && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          SI
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEpisode(episode)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(episode.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Episode Form Dialog */}
      <EpisodeForm
        dramaId={params.id as string}
        episode={editingEpisode}
        episodeNumber={episodes.length + 1}
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingEpisode(undefined)
        }}
        onSuccess={() => {
          fetchDrama()
          fetchEpisodes()
          toast({
            title: 'Success',
            description: `Episode ${editingEpisode ? 'updated' : 'added'} successfully`,
          })
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episode?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the episode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEpisode}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}