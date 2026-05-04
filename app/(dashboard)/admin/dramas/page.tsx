'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Edit, List, Trash2, Search, TrendingUp, Sparkles } from 'lucide-react'
import { Drama } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: i === 0 ? '60%' : '40%' }} />
        </TableCell>
      ))}
    </TableRow>
  )
}

export default function DramasPage() {
  const [dramas, setDramas] = useState<Drama[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showOnlyNew, setShowOnlyNew] = useState(false)
  const { toast } = useToast()

  useEffect(() => { fetchDramas() }, [])

  const fetchDramas = async () => {
    try {
      const res = await fetch('/api/dramas')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDramas(Array.isArray(data) ? data : Array.isArray(data.dramas) ? data.dramas : [])
    } catch (error) {
      console.error('Error fetching dramas:', error)
      setDramas([])
      toast({ title: 'Error', description: 'Failed to fetch dramas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const prev = dramas
    setDramas(d => d.filter(x => x.id !== deleteId))
    setDeleteId(null)
    try {
      const res = await fetch(`/api/dramas/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) { setDramas(prev); throw new Error() }
      toast({ title: 'Deleted', description: 'Drama removed successfully' })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete drama', variant: 'destructive' })
    }
  }

  const filtered = dramas.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase())
    const matchNew = showOnlyNew ? d.new : true
    return matchSearch && matchNew
  })

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dramas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${dramas.length} drama${dramas.length !== 1 ? 's' : ''} in catalog`}
          </p>
        </div>
        <Link href="/admin/dramas/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Drama
          </Button>
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium">
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <Switch id="only-new" checked={showOnlyNew} onCheckedChange={setShowOnlyNew} />
          <Label htmlFor="only-new" className="cursor-pointer text-sm text-gray-600 whitespace-nowrap">New releases only</Label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="font-semibold text-gray-700">Title</TableHead>
              <TableHead className="font-semibold text-gray-700">Year</TableHead>
              <TableHead className="font-semibold text-gray-700">Rating</TableHead>
              <TableHead className="font-semibold text-gray-700">Episodes</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-gray-400">
                  {search ? `No dramas matching "${search}"` : showOnlyNew ? 'No new release dramas.' : 'No dramas yet. Add your first drama!'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((drama) => (
                <TableRow key={drama.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium text-gray-900">{drama.title}</TableCell>
                  <TableCell className="text-gray-600">{drama.year}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm">
                      ★ {drama.rating}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">{drama.totalEpisodes} eps</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {drama.trending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
                          <TrendingUp className="h-3 w-3" /> Trending
                        </span>
                      )}
                      {drama.new && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 text-xs font-medium rounded-full border border-sky-100">
                          <Sparkles className="h-3 w-3" /> New
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/dramas/${drama.id}/episodes`}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Episodes">
                          <List className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Link href={`/admin/dramas/${drama.id}/edit`}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="destructive" className="h-8 w-8 p-0" title="Delete" onClick={() => setDeleteId(drama.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 text-xs text-gray-400">
            Showing {filtered.length} of {dramas.length} dramas
            {search && ` matching "${search}"`}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete drama?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the drama and all its episodes. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
