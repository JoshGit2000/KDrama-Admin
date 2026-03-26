'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MovieForm } from '@/components/admin/MovieForm'
import { Movie } from '@/types'
import { Loader2 } from 'lucide-react'

export default function EditMoviePage() {
  const params = useParams()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMovie()
  }, [params.id])

  const fetchMovie = async () => {
    try {
      const response = await fetch(`/api/movies/${params.id}`)
      const data = await response.json()
      setMovie(data)
    } catch (error) {
      console.error('Error fetching movie:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Movie not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Movie</h1>
        <p className="text-gray-600 mt-2">Update movie information</p>
      </div>

      <MovieForm movie={movie} mode="edit" />
    </div>
  )
}