import type { GscQueryData, GscPageData } from './types'

const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3'

function getConfig() {
  const email = process.env.GSC_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GSC_SERVICE_ACCOUNT_KEY
  const siteUrl = process.env.GSC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://pumbapood.ee'

  if (!email || !key) throw new Error('GSC_SERVICE_ACCOUNT_EMAIL and GSC_SERVICE_ACCOUNT_KEY must be configured')
  return { email, key: key.replace(/\\n/g, '\n'), siteUrl }
}

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token
  }

  const config = getConfig()

  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const claims = {
    iss: config.email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const { createSign } = await import('crypto')
  const sign = createSign('RSA-SHA256')
  const jwtBase = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(claims))}`
  sign.update(jwtBase)
  const signature = sign.sign(config.key, 'base64')
  const jwt = `${jwtBase}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GSC auth failed: ${err}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  }
  return data.access_token
}

async function querySearchAnalytics(
  accessToken: string,
  siteUrl: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>[]> {
  const url = `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GSC API error (${res.status}): ${err}`)
  }

  const json = await res.json()
  return json.rows || []
}

const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 1000

async function queryWithRetry(
  accessToken: string,
  siteUrl: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>[]> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await querySearchAnalytics(accessToken, siteUrl, body)
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, INITIAL_BACKOFF_MS * Math.pow(2, attempt)))
        continue
      }
      throw err
    }
  }
  return []
}

export async function fetchQueries(
  dateStart: string,
  dateEnd: string,
  limit = 1000,
): Promise<GscQueryData[]> {
  const accessToken = await getAccessToken()
  const config = getConfig()

  const rows = await queryWithRetry(accessToken, config.siteUrl, {
    startDate: dateStart,
    endDate: dateEnd,
    dimensions: ['query'],
    rowLimit: limit,
    dimensionFilterGroups: [],
    aggregationType: 'auto',
  })

  return rows.map(row => {
    const keys = (row.keys as string[]) || []
    return {
      query: keys[0] || '',
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0),
      avg_position: Number(row.position || 0),
    }
  })
}

export async function fetchPages(
  dateStart: string,
  dateEnd: string,
  limit = 1000,
): Promise<GscPageData[]> {
  const accessToken = await getAccessToken()
  const config = getConfig()

  const rows = await queryWithRetry(accessToken, config.siteUrl, {
    startDate: dateStart,
    endDate: dateEnd,
    dimensions: ['page'],
    rowLimit: limit,
    dimensionFilterGroups: [],
    aggregationType: 'auto',
  })

  return rows.map(row => {
    const keys = (row.keys as string[]) || []
    return {
      page: keys[0] || '',
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0),
      avg_position: Number(row.position || 0),
    }
  })
}

export async function testConnection(): Promise<{
  success: boolean
  siteUrl: string
  error?: string
}> {
  try {
    const accessToken = await getAccessToken()
    const config = getConfig()

    const url = `${GSC_API_BASE}/sites/${encodeURIComponent(config.siteUrl)}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, siteUrl: config.siteUrl, error: err }
    }

    const data = await res.json()
    return {
      success: true,
      siteUrl: config.siteUrl,
      error: data.permissionLevel ? undefined : 'Site not verified or no permission',
    }
  } catch (err: any) {
    return { success: false, siteUrl: '', error: err.message }
  }
}
