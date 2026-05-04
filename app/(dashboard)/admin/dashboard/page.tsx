'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Film,
  Tv,
  TrendingUp,
  Eye,
  Users,
  Globe,
  Zap,
  ShieldAlert,
  RefreshCw,
  WifiOff,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CloudflareDay {
  date: string
  requests: number
  bytes: number
  cachedRequests: number
  threats: number
}

interface CloudflareStats {
  totals: {
    requests: number
    bytes: number
    cachedRequests: number
    threats: number
    cacheHitRate: number
    uncachedRequests: number
  }
  daily: CloudflareDay[]
  available: boolean
}

interface DashboardData {
  totalMovies: number
  totalDramas: number
  totalViews: number
  trendingCount: number
  userCount: number
  cloudflare: CloudflareStats | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function greet(name?: string | null): string {
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return name ? `${greeting}, ${name.split(' ')[0]}` : greeting
}

function formatDay(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── Animated Counter ──────────────────────────────────────────────────────────

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef   = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = null

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, duration])

  return <>{display.toLocaleString()}</>
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-semibold text-gray-800">
            {formatter ? formatter(entry.value, entry.name) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string | number | null
  icon: React.ReactNode
  accent: string        // tailwind bg class for icon bg
  iconColor: string     // tailwind text class for icon
  loading?: boolean
  sub?: string
  unavailable?: boolean
}

function StatCard({ title, value, icon, accent, iconColor, loading, sub, unavailable }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</p>
          <div className="mt-2">
            {loading ? (
              <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
            ) : unavailable ? (
              <span className="text-3xl font-bold text-gray-300">—</span>
            ) : (
              <span className="text-3xl font-bold text-gray-900">
                {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
              </span>
            )}
          </div>
          {sub && !loading && !unavailable && (
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          )}
        </div>
        <div className={`${accent} rounded-xl p-3`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  )
}

// ── Chart Section Wrapper ─────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children, unavailable, loading }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  unavailable?: boolean
  loading?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-5 w-5 text-gray-300 animate-spin" />
            <span className="text-xs text-gray-400">Loading analytics…</span>
          </div>
        </div>
      ) : unavailable ? (
        <div className="h-48 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <WifiOff className="h-6 w-6 text-gray-200" />
            <p className="text-xs text-gray-400 text-center max-w-[200px]">
              Add <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-500">CLOUDFLARE_API_TOKEN</code> and{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-500">CLOUDFLARE_ZONE_ID</code> to <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-500">.env</code> to enable
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData>({
    totalMovies: 0,
    totalDramas: 0,
    totalViews: 0,
    trendingCount: 0,
    userCount: 0,
    cloudflare: null,
  })
  const [loading, setLoading] = useState(true)
  const [cfLoading, setCfLoading] = useState(true)

  useEffect(() => {
    // Fetch media stats + user count in parallel
    Promise.all([
      fetch('/api/movies').then(r => r.json()),
      fetch('/api/dramas').then(r => r.json()),
      fetch('/api/stats/users').then(r => r.json()),
    ]).then(([movies, dramas, users]) => {
      const totalViews = [
        ...movies.map((m: any) => m.views || 0),
        ...dramas.map((d: any) => d.views || 0),
      ].reduce((s: number, v: number) => s + v, 0)

      const trendingCount = [
        ...movies.filter((m: any) => m.trending),
        ...dramas.filter((d: any) => d.trending),
      ].length

      setData(prev => ({
        ...prev,
        totalMovies: movies.length,
        totalDramas: dramas.length,
        totalViews,
        trendingCount,
        userCount: users.count ?? 0,
      }))
    }).catch(console.error).finally(() => setLoading(false))

    // Cloudflare stats separately (may be slower / unavailable)
    fetch('/api/stats/cloudflare')
      .then(r => r.json())
      .then((cf: CloudflareStats) => setData(prev => ({ ...prev, cloudflare: cf })))
      .catch(console.error)
      .finally(() => setCfLoading(false))
  }, [])

  const cf = data.cloudflare
  const cfAvailable = !cfLoading && (cf?.available ?? false)
  const cfUnavailable = !cfLoading && !cfAvailable

  // Prepare chart data
  const chartData = (cf?.daily ?? []).map(d => ({
    date:     formatDate(d.date),
    Requests: d.requests,
    Cached:   d.cachedRequests,
    Uncached: d.requests - d.cachedRequests,
    'Bandwidth (MB)': parseFloat((d.bytes / 1024 / 1024).toFixed(2)),
    Threats:  d.threats,
  }))

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greet(session?.user?.name)}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatDay()}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-700">All systems operational</span>
        </div>
      </div>

      {/* ── Top Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="App Users"
          value={data.userCount}
          icon={<Users className="h-5 w-5" />}
          accent="bg-violet-50"
          iconColor="text-violet-500"
          loading={loading}
          sub="Registered devices"
        />
        <StatCard
          title="Movies"
          value={data.totalMovies}
          icon={<Film className="h-5 w-5" />}
          accent="bg-sky-50"
          iconColor="text-sky-500"
          loading={loading}
        />
        <StatCard
          title="Dramas"
          value={data.totalDramas}
          icon={<Tv className="h-5 w-5" />}
          accent="bg-indigo-50"
          iconColor="text-indigo-500"
          loading={loading}
        />
        <StatCard
          title="Total Views"
          value={data.totalViews}
          icon={<Eye className="h-5 w-5" />}
          accent="bg-amber-50"
          iconColor="text-amber-500"
          loading={loading}
        />
        <StatCard
          title="Trending"
          value={data.trendingCount}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="bg-emerald-50"
          iconColor="text-emerald-500"
          loading={loading}
          sub="Movies + Dramas"
        />
        <StatCard
          title="Cache Hit"
          value={cf?.totals.cacheHitRate != null ? `${cf.totals.cacheHitRate}%` : null}
          icon={<Zap className="h-5 w-5" />}
          accent="bg-rose-50"
          iconColor="text-rose-500"
          loading={cfLoading}
          unavailable={cfUnavailable}
          sub="7-day average"
        />
      </div>

      {/* ── Cloudflare Summary Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={cf ? formatNumber(cf.totals.requests) : null}
          icon={<Globe className="h-5 w-5" />}
          accent="bg-indigo-50"
          iconColor="text-indigo-500"
          loading={cfLoading}
          unavailable={cfUnavailable}
          sub="Last 7 days"
        />
        <StatCard
          title="Bandwidth"
          value={cf ? formatBytes(cf.totals.bytes) : null}
          icon={<ArrowUpRight className="h-5 w-5" />}
          accent="bg-sky-50"
          iconColor="text-sky-500"
          loading={cfLoading}
          unavailable={cfUnavailable}
          sub="Last 7 days"
        />
        <StatCard
          title="Cached Requests"
          value={cf ? formatNumber(cf.totals.cachedRequests) : null}
          icon={<Zap className="h-5 w-5" />}
          accent="bg-emerald-50"
          iconColor="text-emerald-500"
          loading={cfLoading}
          unavailable={cfUnavailable}
          sub="Served from edge"
        />
        <StatCard
          title="Threats Blocked"
          value={cf ? formatNumber(cf.totals.threats) : null}
          icon={<ShieldAlert className="h-5 w-5" />}
          accent="bg-rose-50"
          iconColor="text-rose-500"
          loading={cfLoading}
          unavailable={cfUnavailable}
          sub="Last 7 days"
        />
      </div>

      {/* ── Charts Row 1 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Requests area chart — spans 3 cols */}
        <div className="xl:col-span-3">
          <ChartCard
            title="Web Requests"
            subtitle="Total vs cached — last 7 days"
            loading={cfLoading}
            unavailable={cfUnavailable}
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gradCached" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="Requests" stroke="#6366f1" strokeWidth={2} fill="url(#gradRequests)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="Cached"   stroke="#10b981" strokeWidth={2} fill="url(#gradCached)"   dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Bandwidth area chart — spans 2 cols */}
        <div className="xl:col-span-2">
          <ChartCard
            title="Bandwidth"
            subtitle="Megabytes served — last 7 days"
            loading={cfLoading}
            unavailable={cfUnavailable}
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit=" MB" />
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} MB`} />} />
                <Area type="monotone" dataKey="Bandwidth (MB)" stroke="#0ea5e9" strokeWidth={2} fill="url(#gradBW)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* ── Charts Row 2 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Threats bar chart — spans 3 cols */}
        <div className="xl:col-span-3">
          <ChartCard
            title="Threats Blocked"
            subtitle="Daily security threats — last 7 days"
            loading={cfLoading}
            unavailable={cfUnavailable}
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Threats" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Quick Actions — spans 2 cols */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
            <h3 className="text-sm font-semibold text-gray-800 mb-5">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: '/admin/movies/create',    label: 'Add Movie',    icon: Film,       color: 'text-sky-500',    bg: 'bg-sky-50'    },
                { href: '/admin/dramas/create',    label: 'Add Drama',    icon: Tv,         color: 'text-indigo-500', bg: 'bg-indigo-50' },
                { href: '/admin/notifications',    label: 'Notify Users', icon: Globe,      color: 'text-violet-500', bg: 'bg-violet-50' },
                { href: '/admin/uploads',          label: 'Upload File',  icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              ].map(({ href, label, icon: Icon, color, bg }) => (
                <a
                  key={href}
                  href={href}
                  className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-150"
                >
                  <div className={`${bg} rounded-xl p-2.5 group-hover:scale-105 transition-transform duration-150`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{label}</span>
                </a>
              ))}
            </div>

            {/* Cache breakdown mini bar */}
            {cfAvailable && cf && (
              <div className="mt-5 pt-5 border-t border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Cache Hit Rate</span>
                  <span className="text-xs font-bold text-emerald-600">{cf.totals.cacheHitRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${cf.totals.cacheHitRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>{formatNumber(cf.totals.cachedRequests)} cached</span>
                  <span>{formatNumber(cf.totals.uncachedRequests)} uncached</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}