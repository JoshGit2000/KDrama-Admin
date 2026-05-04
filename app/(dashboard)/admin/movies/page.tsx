'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Eye, Search, TrendingUp, Sparkles } from 'lucide-react'
import { Movie } from '@/types'
import { useToast } from '@/hooks/use-toast'
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

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  useEffect(() => { fetchMovies() }, [])

  const fetchMovies = async () => {
    try {
      const res = await fetch('/api/movies')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMovies(Array.isArray(data) ? data : Array.isArray(data.movies) ? data.movies : [])
    } catch (error) {
      console.error('Error fetching movies:', error)
      setMovies([])
      toast({ title: 'Error', description: 'Failed to fetch movies', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const prev = movies
    setMovies(m => m.filter(x => x.id !== deleteId))
    setDeleteId(null)
    try {
      const res = await fetch(`/api/movies/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) { setMovies(prev); throw new Error() }
      toast({ title: 'Deleted', description: 'Movie removed successfully' })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete movie', variant: 'destructive' })
    }
  }

  const filtered = movies.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.genres ?? []).some(g => g.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movies</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${movies.length} movie${movies.length !== 1 ? 's' : ''} in catalog`}
          </p>
        </div>
        <Link href="/admin/movies/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Movie
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by title or genre…"
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="font-semibold text-gray-700">Title</TableHead>
              <TableHead className="font-semibold text-gray-700">Year</TableHead>
              <TableHead className="font-semibold text-gray-700">Rating</TableHead>
              <TableHead className="font-semibold text-gray-700">Genres</TableHead>
              <TableHead className="font-semibold text-gray-700">Views</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                  {search ? `No movies matching "${search}"` : 'No movies yet. Add your first movie!'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((movie) => (
                <TableRow key={movie.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium text-gray-900">{movie.title}</TableCell>
                  <TableCell className="text-gray-600">{movie.year}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm">
                      ★ {movie.rating}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">{(movie.genres ?? []).join(', ')}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
                      <Eye className="h-3.5 w-3.5" />
                      {(movie.views || 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {movie.trending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
                          <TrendingUp className="h-3 w-3" /> Trending
                        </span>
                      )}
                      {movie.new && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 text-xs font-medium rounded-full border border-sky-100">
                          <Sparkles className="h-3 w-3" /> New
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/movies/${movie.id}/edit`}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => setDeleteId(movie.id)}>
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
            Showing {filtered.length} of {movies.length} movies
            {search && ` matching "${search}"`}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete movie?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the movie and cannot be undone.
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