import { NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cache'

const CACHE_KEY = 'cloudflare-analytics'
const CF_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql'

export interface CloudflareDay {
  date: string
  requests: number
  bytes: number
  cachedRequests: number
  threats: number
}

export interface CloudflareStats {
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

const EMPTY_STATS: CloudflareStats = {
  totals: { requests: 0, bytes: 0, cachedRequests: 0, threats: 0, cacheHitRate: 0, uncachedRequests: 0 },
  daily: [],
  available: false,
}

export async function GET() {
  // Serve from cache (10-minute TTL on analytics — Cloudflare rate limits 300 req/5min)
  const cached = cacheGet<CloudflareStats>(CACHE_KEY)
  if (cached) {
    return NextResponse.json(cached)
  }

  const token  = process.env.CLOUDFLARE_API_TOKEN
  const zoneId = process.env.CLOUDFLARE_ZONE_ID

  if (!token || !zoneId || token === 'your_cloudflare_api_token_here') {
    console.warn('[Cloudflare] Missing or placeholder API credentials — returning empty stats')
    return NextResponse.json(EMPTY_STATS)
  }

  try {
    // Last 7 days at daily granularity
    const now   = new Date()
    const since = new Date(now)
    since.setDate(since.getDate() - 7)

    const sinceISO = since.toISOString().split('T')[0]
    const untilISO = now.toISOString().split('T')[0]

    const query = `
      query ZoneAnalytics($zoneId: String!, $since: String!, $until: String!) {
        viewer {
          zones(filter: { zoneTag: $zoneId }) {
            httpRequests1dGroups(
              limit: 10
              filter: { date_geq: $since, date_leq: $until }
              orderBy: [date_ASC]
            ) {
              date: dimensions { date }
              sum {
                requests
                bytes
                cachedRequests
                cachedBytes
                threats
              }
            }
          }
        }
      }
    `

    const res = await fetch(CF_GRAPHQL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { zoneId, since: sinceISO, until: untilISO },
      }),
    })

    if (!res.ok) {
      console.error('[Cloudflare] HTTP error:', res.status, await res.text())
      return NextResponse.json(EMPTY_STATS)
    }

    const json = await res.json()

    if (json.errors?.length) {
      console.error('[Cloudflare] GraphQL errors:', JSON.stringify(json.errors))
      return NextResponse.json(EMPTY_STATS)
    }

    const groups: any[] = json.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? []

    if (!groups.length) {
      console.warn('[Cloudflare] No data returned (zone may have no traffic yet)')
      const stats: CloudflareStats = { ...EMPTY_STATS, available: true }
      cacheSet(CACHE_KEY, stats)
      return NextResponse.json(stats)
    }

    const daily: CloudflareDay[] = groups.map((g: any) => ({
      date:           g.date.date,
      requests:       g.sum.requests       ?? 0,
      bytes:          g.sum.bytes          ?? 0,
      cachedRequests: g.sum.cachedRequests ?? 0,
      threats:        g.sum.threats        ?? 0,
    }))

    const totals = daily.reduce(
      (acc, d) => ({
        requests:        acc.requests        + d.requests,
        bytes:           acc.bytes           + d.bytes,
        cachedRequests:  acc.cachedRequests  + d.cachedRequests,
        threats:         acc.threats         + d.threats,
      }),
      { requests: 0, bytes: 0, cachedRequests: 0, threats: 0 }
    )

    const cacheHitRate = totals.requests > 0
      ? Math.round((totals.cachedRequests / totals.requests) * 100)
      : 0

    const stats: CloudflareStats = {
      totals: {
        ...totals,
        cacheHitRate,
        uncachedRequests: totals.requests - totals.cachedRequests,
      },
      daily,
      available: true,
    }

    // Cache for 10 minutes
    cacheSet(CACHE_KEY, stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[Cloudflare] Fetch error:', error)
    return NextResponse.json(EMPTY_STATS)
  }
}
