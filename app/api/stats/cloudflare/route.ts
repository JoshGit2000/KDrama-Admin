import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cache'

const CF_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CFPeriod = '24h' | '7d' | '30d'

export interface CFPeriodPoint {
  date: string        // ISO date or ISO hour string
  requests: number
  bytes: number
  cachedRequests: number
  threats: number
  errors4xx: number
  errors5xx: number
  pageViews: number
  uniques: number
}

export interface CFCountry {
  country: string
  requests: number
}

export interface CFStats {
  totals: {
    requests: number
    bytes: number
    cachedRequests: number
    threats: number
    cacheHitRate: number
    uncachedRequests: number
    errors4xx: number
    errors5xx: number
    pageViews: number
    uniqueVisitors: number
  }
  series: CFPeriodPoint[]
  countries: CFCountry[]
  period: CFPeriod
  available: boolean
}

function emptyStats(period: CFPeriod): CFStats {
  return {
    totals: {
      requests: 0, bytes: 0, cachedRequests: 0, threats: 0,
      cacheHitRate: 0, uncachedRequests: 0, errors4xx: 0, errors5xx: 0,
      pageViews: 0, uniqueVisitors: 0,
    },
    series: [],
    countries: [],
    period,
    available: false,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function periodRange(period: CFPeriod): { since: string; until: string; useHourly: boolean; days: number } {
  const now = new Date()
  const since = new Date(now)
  let useHourly = false
  let days = 7

  if (period === '24h') {
    since.setHours(since.getHours() - 24)
    useHourly = true
    days = 1
  } else if (period === '7d') {
    since.setDate(since.getDate() - 7)
    days = 7
  } else {
    since.setDate(since.getDate() - 30)
    days = 30
  }

  return {
    since: since.toISOString().split('T')[0],
    until: now.toISOString().split('T')[0],
    useHourly,
    days,
  }
}

function count4xx(statusMap: any[]): number {
  if (!Array.isArray(statusMap)) return 0
  return statusMap
    .filter((s: any) => s.edgeResponseStatus >= 400 && s.edgeResponseStatus < 500)
    .reduce((sum: number, s: any) => sum + (s.requests ?? 0), 0)
}

function count5xx(statusMap: any[]): number {
  if (!Array.isArray(statusMap)) return 0
  return statusMap
    .filter((s: any) => s.edgeResponseStatus >= 500)
    .reduce((sum: number, s: any) => sum + (s.requests ?? 0), 0)
}

// ── GraphQL queries ───────────────────────────────────────────────────────────

const DAILY_QUERY = `
  query ZoneDailyAnalytics($zoneId: String!, $since: String!, $until: String!) {
    viewer {
      zones(filter: { zoneTag: $zoneId }) {
        httpRequests1dGroups(
          limit: 35
          filter: { date_geq: $since, date_leq: $until }
          orderBy: [date_ASC]
        ) {
          dimensions { date }
          sum {
            requests
            bytes
            cachedRequests
            cachedBytes
            threats
            pageViews
            responseStatusMap { edgeResponseStatus requests }
          }
          uniq { uniques }
        }
        topCountries: httpRequests1dGroups(
          limit: 35
          filter: { date_geq: $since, date_leq: $until }
          orderBy: [date_ASC]
        ) {
          dimensions { date clientCountryName }
          sum { requests }
        }
      }
    }
  }
`

// For 24h we use the hourly dataset (free plan supports up to 72h)
const HOURLY_QUERY = `
  query ZoneHourlyAnalytics($zoneId: String!, $since: String!, $until: String!) {
    viewer {
      zones(filter: { zoneTag: $zoneId }) {
        httpRequests1hGroups(
          limit: 25
          filter: { date_geq: $since, date_leq: $until }
          orderBy: [datetimeHour_ASC]
        ) {
          dimensions { datetimeHour }
          sum {
            requests
            bytes
            cachedRequests
            cachedBytes
            threats
            pageViews
            responseStatusMap { edgeResponseStatus requests }
          }
          uniq { uniques }
        }
      }
    }
  }
`

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const period = (request.nextUrl.searchParams.get('period') ?? '7d') as CFPeriod
  const cacheKey = `cloudflare-analytics-${period}`

  // Serve from cache (10-min TTL)
  const cached = cacheGet<CFStats>(cacheKey)
  if (cached) return NextResponse.json(cached)

  const token  = process.env.CLOUDFLARE_API_TOKEN
  const zoneId = process.env.CLOUDFLARE_ZONE_ID

  if (!token || !zoneId || token === 'your_cloudflare_api_token_here') {
    console.warn('[Cloudflare] Missing or placeholder credentials')
    return NextResponse.json(emptyStats(period))
  }

  try {
    const { since, until, useHourly } = periodRange(period)
    const query = useHourly ? HOURLY_QUERY : DAILY_QUERY

    const res = await fetch(CF_GRAPHQL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { zoneId, since, until } }),
    })

    if (!res.ok) {
      console.error('[Cloudflare] HTTP error:', res.status, await res.text())
      return NextResponse.json(emptyStats(period))
    }

    const json = await res.json()

    if (json.errors?.length) {
      console.error('[Cloudflare] GraphQL errors:', JSON.stringify(json.errors))
      return NextResponse.json(emptyStats(period))
    }

    const zone = json.data?.viewer?.zones?.[0]

    // ── Parse series ────────────────────────────────────────────────────────
    const rawGroups: any[] = useHourly
      ? (zone?.httpRequests1hGroups ?? [])
      : (zone?.httpRequests1dGroups ?? [])

    if (!rawGroups.length) {
      const s = { ...emptyStats(period), available: true }
      cacheSet(cacheKey, s)
      return NextResponse.json(s)
    }

    const series: CFPeriodPoint[] = rawGroups.map((g: any) => {
      const statusMap = g.sum?.responseStatusMap ?? []
      return {
        date:           useHourly ? g.dimensions.datetimeHour : g.dimensions.date,
        requests:       g.sum?.requests        ?? 0,
        bytes:          g.sum?.bytes           ?? 0,
        cachedRequests: g.sum?.cachedRequests  ?? 0,
        threats:        g.sum?.threats         ?? 0,
        errors4xx:      count4xx(statusMap),
        errors5xx:      count5xx(statusMap),
        pageViews:      g.sum?.pageViews       ?? 0,
        uniques:        g.uniq?.uniques        ?? 0,
      }
    })

    // ── Aggregate totals ────────────────────────────────────────────────────
    const totals = series.reduce(
      (acc, d) => ({
        requests:        acc.requests        + d.requests,
        bytes:           acc.bytes           + d.bytes,
        cachedRequests:  acc.cachedRequests  + d.cachedRequests,
        threats:         acc.threats         + d.threats,
        errors4xx:       acc.errors4xx       + d.errors4xx,
        errors5xx:       acc.errors5xx       + d.errors5xx,
        pageViews:       acc.pageViews       + d.pageViews,
        uniqueVisitors:  acc.uniqueVisitors  + d.uniques,
      }),
      { requests: 0, bytes: 0, cachedRequests: 0, threats: 0,
        errors4xx: 0, errors5xx: 0, pageViews: 0, uniqueVisitors: 0 }
    )

    const cacheHitRate = totals.requests > 0
      ? Math.round((totals.cachedRequests / totals.requests) * 100)
      : 0

    // ── Parse country breakdown (daily only) ────────────────────────────────
    let countries: CFCountry[] = []
    if (!useHourly) {
      const countryMap: Record<string, number> = {}
      const topCountries: any[] = zone?.topCountries ?? []
      topCountries.forEach((g: any) => {
        const name = g.dimensions?.clientCountryName
        if (name) {
          countryMap[name] = (countryMap[name] ?? 0) + (g.sum?.requests ?? 0)
        }
      })
      countries = Object.entries(countryMap)
        .map(([country, requests]) => ({ country, requests }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10)
    }

    const stats: CFStats = {
      totals: {
        ...totals,
        cacheHitRate,
        uncachedRequests: totals.requests - totals.cachedRequests,
      },
      series,
      countries,
      period,
      available: true,
    }

    cacheSet(cacheKey, stats)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[Cloudflare] Fetch error:', error)
    return NextResponse.json(emptyStats(period))
  }
}
