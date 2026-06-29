/* eslint-disable @typescript-eslint/no-explicit-any */
import { logApiError, upsertDailyInsight } from './admin-queries'

function getConfig() {
  return {
    propertyId: process.env.GA4_PROPERTY_ID,
    accessToken: process.env.GOOGLE_ADS_CLIENT_ID
      ? null
      : null, // Uses Google Ads OAuth for GA4 access
  }
}

// GA4 Data API v1
const GA4_BASE = 'https://analyticsdata.googleapis.com/v1beta'

let cachedGa4Token: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedGa4Token && Date.now() < cachedGa4Token.expiresAt - 60000) {
    return cachedGa4Token.token
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('GA4 requires Google OAuth credentials (use same as Google Ads)')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    cachedGa4Token = null
    throw new Error(`Failed to get GA4 access token: ${await res.text()}`)
  }
  const data = await res.json()
  cachedGa4Token = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  }
  return data.access_token
}

async function runReport(
  requestBody: Record<string, unknown>,
): Promise<any> {
  const propertyId = getConfig().propertyId
  if (!propertyId) throw new Error('GA4 property ID not configured')

  const token = await getAccessToken()

  const res = await fetch(`${GA4_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const errBody = await res.text()
    await logApiError({
      platform: 'ga4',
      endpoint: 'runReport',
      request_body: requestBody as any,
      response_body: { status: res.status, body: errBody },
      status_code: res.status,
      error_message: errBody,
    })
    throw new Error(`GA4 API error (${res.status}): ${errBody}`)
  }

  return await res.json()
}

function getDateRange(dateStart: string, dateEnd: string) {
  return {
    dateRanges: [{ startDate: dateStart, endDate: dateEnd }],
  }
}

// ─── SESSIONS & EVENTS ────────────────────────────────
export async function fetchTrafficMetrics(
  accountId: string,
  dateStart: string,
  dateEnd: string,
): Promise<number> {
  const response = await runReport({
    ...getDateRange(dateStart, dateEnd),
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'newUsers' },
      { name: 'sessionDuration' },
      { name: 'bounceRate' },
      { name: 'screenPageViews' },
      { name: 'screenPageViewsPerSession' },
      { name: 'averageSessionDuration' },
    ],
  })

  const rows = response.rows || []
  for (const row of rows) {
    const dims = row.dimensionValues || []
    const metrics = row.metricValues || []
    const date = dims[0]?.value
    if (!date) continue

    const sessions = parseInt(metrics[0]?.value || '0')
    const totalUsers = parseInt(metrics[1]?.value || '0')
    const newUsers = parseInt(metrics[2]?.value || '0')
    const screenPageViews = parseInt(metrics[5]?.value || '0')
    const bounceRate = parseFloat(metrics[4]?.value || '0')
    const avgSessionDuration = parseFloat(metrics[7]?.value || '0')

    await upsertDailyInsight({
      date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
      platform: 'ga4',
      account_id: accountId,
      impressions: screenPageViews,
      clicks: sessions,
      ctr: 0,
      raw_data: {
        row,
        type: 'traffic',
        sessions,
        totalUsers,
        newUsers,
        screenPageViews,
        bounceRate,
        avgSessionDuration,
      },
    })
  }

  return rows.length
}

// ─── CONVERSIONS & REVENUE ───────────────────────────
export async function fetchConversionMetrics(
  accountId: string,
  dateStart: string,
  dateEnd: string,
): Promise<number> {
  const response = await runReport({
    ...getDateRange(dateStart, dateEnd),
    dimensions: [{ name: 'date' }, { name: 'eventName' }],
    metrics: [
      { name: 'eventCount' },
      { name: 'totalRevenue' },
      { name: 'purchaseRevenue' },
      { name: 'conversionRate' },
      { name: 'eventValue' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          matchType: 'EXACT',
          value: 'purchase',
        },
      },
    },
  })

  const rows = response.rows || []
  for (const row of rows) {
    const dims = row.dimensionValues || []
    const metrics = row.metricValues || []
    const date = dims[0]?.value
    if (!date) continue

    await upsertDailyInsight({
      date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
      platform: 'ga4',
      account_id: accountId,
      conversions: parseInt(metrics[0]?.value || '0'),
      conversion_value: parseFloat(metrics[1]?.value || '0'),
      purchases: parseInt(metrics[0]?.value || '0'),
      raw_data: { row, type: 'conversions' },
    })
  }

  return rows.length
}

// ─── LANDING PAGE PERFORMANCE ─────────────────────────
export async function fetchLandingPageMetrics(
  accountId: string,
  dateStart: string,
  dateEnd: string,
): Promise<any[]> {
  const response = await runReport({
    ...getDateRange(dateStart, dateEnd),
    dimensions: [
      { name: 'landingPage' },
      { name: 'date' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'bounceRate' },
      { name: 'screenPageViewsPerSession' },
      { name: 'averageSessionDuration' },
      { name: 'totalUsers' },
    ],
  })

  return response.rows || []
}

// ─── EVENTS LIST ─────────────────────────────────────
export async function fetchEvents(
  dateStart: string,
  dateEnd: string,
): Promise<any[]> {
  const response = await runReport({
    ...getDateRange(dateStart, dateEnd),
    dimensions: [{ name: 'eventName' }],
    metrics: [
      { name: 'eventCount' },
      { name: 'totalRevenue' },
      { name: 'eventValue' },
    ],
  })

  return response.rows || []
}

// ─── COMPLETE GA4 SYNC ───────────────────────────────
export async function fetchAllMetrics(
  accountId: string,
  dateStart: string,
  dateEnd: string,
): Promise<{ traffic: number; conversions: number }> {
  const [traffic, conversions] = await Promise.all([
    fetchTrafficMetrics(accountId, dateStart, dateEnd),
    fetchConversionMetrics(accountId, dateStart, dateEnd),
  ])

  return { traffic, conversions }
}
