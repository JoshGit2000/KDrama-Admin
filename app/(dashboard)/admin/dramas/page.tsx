'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Edit, List } from 'lucide-react'
import { Drama } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function DramasPage() {
  const [dramas, setDramas] = useState<Drama[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnlyNewReleases, setShowOnlyNewReleases] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchDramas()
  }, [])

  const fetchDramas = async () => {
    try {
      const response = await fetch('/api/dramas')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Add validation to ensure data is an array
      if (Array.isArray(data)) {
        setDramas(data)
      } else if (data && Array.isArray(data.dramas)) {
        // In case API returns { dramas: [...] }
        setDramas(data.dramas)
      } else {
        console.error('Unexpected data format:', data)
        setDramas([])
        toast({
          title: 'Error',
          description: 'Received invalid data format from server',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching dramas:', error)
      setDramas([]) // Set empty array on error
      toast({
        title: 'Error',
        description: 'Failed to fetch dramas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredDramas = showOnlyNewReleases
    ? dramas.filter((drama) => drama.new)
    : dramas

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dramas</h1>
          <p className="text-gray-600 mt-2">Manage all dramas and their episodes</p>
        </div>
        <Link href="/admin/dramas/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Drama
          </Button>
        </Link>
      </div>

      <Card>
        <div className="flex items-center justify-end px-6 pt-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="only-new-releases"
              checked={showOnlyNewReleases}
              onCheckedChange={setShowOnlyNewReleases}
            />
            <Label htmlFor="only-new-releases" className="cursor-pointer">
              Only New Releases
            </Label>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Episodes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredDramas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {showOnlyNewReleases
                    ? 'No new release dramas found.'
                    : 'No dramas found. Add your first drama!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredDramas.map((drama) => (
                <TableRow key={drama.id}>
                  <TableCell className="font-medium">{drama.title}</TableCell>
                  <TableCell>{drama.year}</TableCell>
                  <TableCell>{drama.rating}/10</TableCell>
                  <TableCell>{drama.totalEpisodes} episodes</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {drama.trending && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Trending
                        </span>
                      )}
                      {drama.new && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          New
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/dramas/${drama.id}/episodes`}>
                        <Button size="sm" variant="outline">
                          <List className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/dramas/${drama.id}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
