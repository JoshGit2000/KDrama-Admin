'use client'

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartSection, Tip, countryFlag, fmtBytes, fmtN } from '@/components/admin/dashboard-widgets'
import { MapPin } from 'lucide-react'

interface CFPoint { date: string; requests: number; bytes: number; cachedRequests: number; threats: number; errors4xx: number; errors5xx: number; pageViews: number; uniques: number }
interface CFCountry { country: string; requests: number }
interface CFStats {
  totals: { requests: number; bytes: number; cachedRequests: number; threats: number; cacheHitRate: number; uncachedRequests: number; errors4xx: number; errors5xx: number; pageViews: number; uniqueVisitors: number }
  series: CFPoint[]; countries: CFCountry[]; period: string; available: boolean
}

interface Props {
  cf: CFStats | null
  cfLoad: boolean
  cfNa: boolean
  cfOk: boolean
  period: string
  periodLabel: string
  collapsed: Set<string>
  onToggle: (key: string) => void
  spk: { cached: number[]; requests: number[] }
}

export default function DashboardCharts({ cf, cfLoad, cfNa, cfOk, period, periodLabel, collapsed, onToggle, spk }: Props) {
  const s = cf?.series ?? []

  const chartData = s.map(d => ({
    date: d.date,
    Requests: d.requests,
    Cached: d.cachedRequests,
    'BW (MB)': parseFloat((d.bytes / 1024 / 1024).toFixed(2)),
    Threats: d.threats,
    Errors: d.errors4xx + d.errors5xx,
    Visitors: d.uniques,
  }))

  const maxCountry = cf?.countries?.[0]?.requests ?? 1
  const totalCountryReq = cf?.countries?.reduce((s, c) => s + c.requests, 0) ?? 1

  return (
    <>
      {/* Requests + Bandwidth */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3">
          <ChartSection id="requests" title="Web Requests" sub={`Total vs cached — ${periodLabel.toLowerCase()}`} loading={cfLoad} na={cfNa} collapsed={collapsed.has('requests')} onToggle={() => onToggle('requests')}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={.15}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtN}/>
                <Tooltip content={<Tip/>}/>
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }}/>
                <Area type="monotone" dataKey="Requests" stroke="#6366f1" strokeWidth={2} fill="url(#gR)" dot={false} activeDot={{ r: 4 }}/>
                <Area type="monotone" dataKey="Cached" stroke="#10b981" strokeWidth={2} fill="url(#gC)" dot={false} activeDot={{ r: 4 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartSection>
        </div>
        <div className="xl:col-span-2">
          <ChartSection id="bandwidth" title="Bandwidth" sub={`MB served — ${periodLabel.toLowerCase()}`} loading={cfLoad} na={cfNa} collapsed={collapsed.has('bandwidth')} onToggle={() => onToggle('bandwidth')}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={.15}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip fmt={(v: number) => `${v} MB`}/>}/>
                <Area type="monotone" dataKey="BW (MB)" stroke="#0ea5e9" strokeWidth={2} fill="url(#gB)" dot={false} activeDot={{ r: 4 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartSection>
        </div>
      </div>

      {/* Threats */}
      <ChartSection id="threats" title="Threats Blocked" sub={`Security threats blocked — ${periodLabel.toLowerCase()}`} loading={cfLoad} na={cfNa} collapsed={collapsed.has('threats')} onToggle={() => onToggle('threats')}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
            <Tooltip content={<Tip/>}/>
            <Bar dataKey="Threats" fill="#eab308" radius={[4, 4, 0, 0]} maxBarSize={40}/>
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Errors + Visitors */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartSection id="errors" title="HTTP Errors" sub={`4xx + 5xx — ${periodLabel.toLowerCase()}`} loading={cfLoad} na={cfNa} collapsed={collapsed.has('errors')} onToggle={() => onToggle('errors')}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="Errors" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
        <ChartSection id="visitors" title="Unique Visitors" sub={`${periodLabel.toLowerCase()}`} loading={cfLoad} na={cfNa} collapsed={collapsed.has('visitors')} onToggle={() => onToggle('visitors')}>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={.15}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtN}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey="Visitors" stroke="#a855f7" strokeWidth={2} fill="url(#gV)" dot={false} activeDot={{ r: 4 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      {/* Regions + Quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3">
          <ChartSection id="regions" title="Top Regions" sub="Requests by country" loading={cfLoad} na={cfNa || (cfOk && period === '24h')} collapsed={collapsed.has('regions')} onToggle={() => onToggle('regions')}>
            {cfOk && period !== '24h' && cf?.countries && cf.countries.length > 0 ? (
              <div className="space-y-1">
                {cf.countries.slice(0, 8).map((c, i) => {
                  const pct = Math.round((c.requests / totalCountryReq) * 100)
                  const barW = Math.round((c.requests / maxCountry) * 100)
                  return (
                    <div key={c.country} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${i % 2 === 0 ? 'bg-gray-50/60' : ''}`}>
                      <span className="text-xs text-gray-400 w-5 text-center font-bold">{i + 1}</span>
                      <span className="text-lg w-7 flex-shrink-0">{countryFlag(c.country)}</span>
                      <span className="text-sm font-medium text-gray-700 w-32 truncate">{c.country}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${barW}%` }}/>
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                      <span className="text-xs font-semibold text-gray-700 w-12 text-right">{fmtN(c.requests)}</span>
                    </div>
                  )
                })}
              </div>
            ) : cfOk && period !== '24h' ? (
              <div className="h-40 flex items-center justify-center text-xs text-gray-400">No region data</div>
            ) : null}
          </ChartSection>
        </div>
        {/* Quick actions slot — rendered by parent */}
        <div className="xl:col-span-2" id="quick-actions-slot" />
      </div>
    </>
  )
}
