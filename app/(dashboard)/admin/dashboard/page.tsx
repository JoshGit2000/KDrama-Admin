'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { Film, Tv, TrendingUp, Users, Globe, Zap, ShieldAlert, ArrowUpRight, AlertTriangle, RefreshCw, Clock } from 'lucide-react'
import {
  StatCard, ChartSection, Spark,
  calcTrend, fmtBytes, fmtN, fmtDate, greet, today, timeAgo,
} from '@/components/admin/dashboard-widgets'

// ── Recharts loaded only on the client — removes ~500 KB from initial bundle ─
const DashboardCharts = dynamic(
  () => import('@/components/admin/dashboard-charts'),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading charts…</div> }
)

type Period = '24h' | '7d' | '30d'
interface CFPoint { date: string; requests: number; bytes: number; cachedRequests: number; threats: number; errors4xx: number; errors5xx: number; pageViews: number; uniques: number }
interface CFCountry { country: string; requests: number }
interface CFStats {
  totals: { requests: number; bytes: number; cachedRequests: number; threats: number; cacheHitRate: number; uncachedRequests: number; errors4xx: number; errors5xx: number; pageViews: number; uniqueVisitors: number }
  series: CFPoint[]; countries: CFCountry[]; period: Period; available: boolean
}

const PERIODS: { label: string; value: Period }[] = [
  { label: '24 Hours', value: '24h' },
  { label: '7 Days',   value: '7d'  },
  { label: '30 Days',  value: '30d' },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const [period, setPeriod] = useState<Period>('7d')
  const [media, setMedia] = useState({ movies: 0, dramas: 0, trending: 0, users: 0 })
  const [mLoading, setMLoading] = useState(true)
  const [cf, setCf] = useState<CFStats | null>(null)
  const [cfLoad, setCfLoad] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (key: string) => setCollapsed(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n
  })

  // ── Movies + dramas ───────────────────────────────────────────────────────
  useEffect(() => {
    setMLoading(true)
    Promise.all([
      fetch('/api/movies').then(r => r.json()),
      fetch('/api/dramas').then(r => r.json()),
    ]).then(([mv, dr]) => {
      const trending = [...mv, ...dr].filter((x: any) => x.trending).length
      setMedia(p => ({ ...p, movies: mv.length, dramas: dr.length, trending }))
    }).catch(console.error).finally(() => setMLoading(false))
  }, [])

  // ── User count — polls every 30 s ─────────────────────────────────────────
  const fetchUsers = useCallback(() => {
    fetch('/api/stats/users').then(r => r.json())
      .then((d: any) => setMedia(p => ({ ...p, users: d.count ?? 0 })))
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchUsers()
    const iv = setInterval(fetchUsers, 30_000)
    const onVis = () => { if (document.visibilityState === 'visible') fetchUsers() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', fetchUsers)
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', fetchUsers) }
  }, [fetchUsers])

  // ── Cloudflare analytics ──────────────────────────────────────────────────
  const fetchCF = useCallback((p: Period, force = false) => {
    setCfLoad(true)
    const url = `/api/stats/cloudflare?period=${p}${force ? `&t=${Date.now()}` : ''}`
    fetch(url).then(r => r.json()).then(d => { setCf(d); setLastUpdated(new Date()) })
      .catch(console.error).finally(() => setCfLoad(false))
  }, [])

  useEffect(() => { fetchCF(period) }, [period, fetchCF])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchCF(period, true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const cfOk = !cfLoad && (cf?.available ?? false)
  const cfNa = !cfLoad && !cfOk
  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? '7 Days'
  const s = cf?.series ?? []

  const spk = {
    requests: s.map(d => d.requests),
    bytes:    s.map(d => d.bytes),
    cached:   s.map(d => d.cachedRequests),
    visitors: s.map(d => d.uniques),
    threats:  s.map(d => d.threats),
    errors:   s.map(d => d.errors4xx + d.errors5xx),
  }

  const trend = {
    requests: calcTrend(spk.requests),
    bytes:    calcTrend(spk.bytes),
    cached:   calcTrend(spk.cached),
    visitors: calcTrend(spk.visitors),
    threats:  calcTrend(spk.threats),
    errors:   calcTrend(spk.errors),
  }

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900 p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.2),transparent_60%)] pointer-events-none" />
        <div className="relative flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">{greet(session?.user?.name)}</h1>
            <p className="text-sm text-indigo-200/70 mt-0.5">{today()}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-200/60">
                <Clock className="h-3 w-3" />{timeAgo(lastUpdated)}
              </div>
            )}
            <button onClick={handleRefresh} disabled={cfLoad}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="flex bg-white/10 rounded-xl overflow-hidden border border-white/10">
              {PERIODS.map(p => (
                <button key={p.value} onClick={() => setPeriod(p.value)}
                  className={`px-4 py-2 text-xs font-semibold transition-all duration-150 ${period === p.value ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-300">Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── App stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="App Users"     value={media.users}              icon={<Users className="h-5 w-5"/>}      accent="bg-violet-50"  ic="text-violet-500"  loading={mLoading} sub="Registered devices"/>
        <StatCard title="Movies"        value={media.movies}             icon={<Film className="h-5 w-5"/>}       accent="bg-sky-50"     ic="text-sky-500"     loading={mLoading}/>
        <StatCard title="Dramas"        value={media.dramas}             icon={<Tv className="h-5 w-5"/>}         accent="bg-indigo-50"  ic="text-indigo-500"  loading={mLoading}/>
        <StatCard title="Trending"      value={media.trending}           icon={<TrendingUp className="h-5 w-5"/>} accent="bg-emerald-50" ic="text-emerald-500" loading={mLoading} sub="Movies + Dramas"/>
      </div>

      {/* ── CF traffic cards (4) ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Requests"  value={cf ? fmtN(cf.totals.requests) : null}          icon={<Globe className="h-5 w-5"/>}        accent="bg-indigo-50"  ic="text-indigo-500"  loading={cfLoad} na={cfNa} sub={periodLabel} spark={spk.requests}  sparkColor="#6366f1" trend={trend.requests}/>
        <StatCard title="Bandwidth" value={cf ? fmtBytes(cf.totals.bytes) : null}          icon={<ArrowUpRight className="h-5 w-5"/>}  accent="bg-sky-50"     ic="text-sky-500"     loading={cfLoad} na={cfNa} sub={periodLabel} spark={spk.bytes}     sparkColor="#0ea5e9" trend={trend.bytes}/>
        <StatCard title="Cached"    value={cf ? fmtN(cf.totals.cachedRequests) : null}     icon={<Zap className="h-5 w-5"/>}           accent="bg-emerald-50" ic="text-emerald-500" loading={cfLoad} na={cfNa} sub="From edge"   spark={spk.cached}    sparkColor="#10b981" trend={trend.cached}/>
        <StatCard title="Cache Hit" value={cf ? `${cf.totals.cacheHitRate}%` : null}       icon={<Zap className="h-5 w-5"/>}           accent="bg-teal-50"    ic="text-teal-500"    loading={cfLoad} na={cfNa}/>
      </div>

      {/* ── CF security / visitor cards (3) ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Unique Visitors" value={cf ? fmtN(cf.totals.uniqueVisitors) : null}                          icon={<Users className="h-5 w-5"/>}        accent="bg-purple-50" ic="text-purple-500" loading={cfLoad} na={cfNa} sub={periodLabel} spark={spk.visitors} sparkColor="#a855f7" trend={trend.visitors}/>
        <StatCard title="Threats Blocked" value={cf ? fmtN(cf.totals.threats) : null}                                 icon={<ShieldAlert className="h-5 w-5"/>}   accent="bg-yellow-50" ic="text-yellow-500" loading={cfLoad} na={cfNa} sub="Blocked"      spark={spk.threats}  sparkColor="#eab308" trend={trend.threats}/>
        <StatCard title="Errors"          value={cf ? fmtN(cf.totals.errors4xx + cf.totals.errors5xx) : null}         icon={<AlertTriangle className="h-5 w-5"/>} accent="bg-rose-50"   ic="text-rose-500"   loading={cfLoad} na={cfNa} sub="4xx + 5xx"    spark={spk.errors}   sparkColor="#f43f5e" trend={trend.errors} danger/>
      </div>

      {/* ── Charts (lazy-loaded — recharts not in initial bundle) ─────────── */}
      <DashboardCharts
        cf={cf}
        cfLoad={cfLoad}
        cfNa={cfNa}
        cfOk={cfOk}
        period={period}
        periodLabel={periodLabel}
        collapsed={collapsed}
        onToggle={toggle}
        spk={spk}
      />

      {/* ── Quick Actions + Cache stats ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/movies/create', label: 'Add Movie',    icon: Film,          color: 'text-sky-500',     bg: 'bg-sky-50' },
            { href: '/admin/dramas/create', label: 'Add Drama',    icon: Tv,            color: 'text-indigo-500',  bg: 'bg-indigo-50' },
            { href: '/admin/notifications', label: 'Notify Users', icon: Users,         color: 'text-violet-500',  bg: 'bg-violet-50' },
            { href: '/admin/uploads',       label: 'Upload File',  icon: ArrowUpRight,  color: 'text-emerald-500', bg: 'bg-emerald-50' },
          ].map(({ href, label, icon: Icon, color, bg }) => (
            <a key={href} href={href} className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-150">
              <div className={`${bg} rounded-xl p-2.5 group-hover:scale-105 transition-transform`}><Icon className={`h-5 w-5 ${color}`}/></div>
              <span className="text-xs font-medium text-gray-600">{label}</span>
            </a>
          ))}
        </div>

        {cfOk && cf && (
          <div className="mt-5 pt-5 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Cache Hit Rate</span>
                <span className="text-xs font-bold text-emerald-600">{cf.totals.cacheHitRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-700" style={{ width: `${cf.totals.cacheHitRate}%` }}/>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{fmtN(cf.totals.cachedRequests)} cached</span>
                <span>{fmtN(cf.totals.uncachedRequests)} uncached</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Total Errors</span>
                <span className={`text-xs font-bold ${cf.totals.errors4xx + cf.totals.errors5xx > 50 ? 'text-rose-600' : 'text-gray-600'}`}>
                  {fmtN(cf.totals.errors4xx + cf.totals.errors5xx)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-rose-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(((cf.totals.errors4xx + cf.totals.errors5xx) / Math.max(cf.totals.requests, 1)) * 100 * 10, 100)}%` }}/>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{fmtN(cf.totals.errors4xx)} client (4xx)</span>
                <span>{fmtN(cf.totals.errors5xx)} server (5xx)</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}