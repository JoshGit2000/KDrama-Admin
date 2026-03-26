'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DramaForm } from '@/components/admin/DramaForm'
import { Drama } from '@/types'
import { Loader2 } from 'lucide-react'

export default function EditDramaPage() {
  const params = useParams()
  const [drama, setDrama] = useState<Drama | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDrama()
  }, [params.id])

  const fetchDrama = async () => {
    try {
      const response = await fetch(`/api/dramas/${params.id}`)
      const data = await response.json()
      setDrama(data)
    } catch (error) {
      console.error('Error fetching drama:', error)
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

  if (!drama) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Drama not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Drama</h1>
        <p className="text-gray-600 mt-2">Update drama information</p>
      </div>

      <DramaForm drama={drama} mode="edit" />
    </div>
  )
}