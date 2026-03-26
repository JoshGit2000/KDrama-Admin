'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Film, Tv, TrendingUp, Eye } from 'lucide-react'

interface Stats {
  totalMovies: number
  totalDramas: number
  totalViews: number
  trending: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalMovies: 0,
    totalDramas: 0,
    totalViews: 0,
    trending: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [moviesRes, dramasRes] = await Promise.all([
        fetch('/api/movies'),
        fetch('/api/dramas'),
      ])

      const movies = await moviesRes.json()
      const dramas = await dramasRes.json()

      const totalViews = [
        ...movies.map((m: any) => m.views || 0),
        ...dramas.map((d: any) => d.views || 0),
      ].reduce((sum, views) => sum + views, 0)

      const trending = [
        ...movies.filter((m: any) => m.trending),
        ...dramas.filter((d: any) => d.trending),
      ].length

      setStats({
        totalMovies: movies.length,
        totalDramas: dramas.length,
        totalViews,
        trending,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Movies',
      value: stats.totalMovies,
      icon: Film,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Dramas',
      value: stats.totalDramas,
      icon: Tv,
      color: 'bg-purple-500',
    },
    {
      title: 'Trending Items',
      value: stats.trending,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Total Views',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to K-Drama Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} rounded-full p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/movies/create"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <Film className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">Add New Movie</p>
          </a>
          <a
            href="/admin/dramas/create"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center"
          >
            <Tv className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">Add New Drama</p>
          </a>
          <a
            href="/admin/uploads"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
          >
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">Upload to Drive</p>
          </a>
        </div>
      </Card>
    </div>
  )
}