/**
 * Google API auth for the weekly report — Pumbapood's OWN credentials only
 * (do NOT point these at the SPS project's service account):
 *
 *   1. GA4 + Google Ads: OAuth refresh-token flow, same credentials the
 *      existing integrations use (lib/ads/ga4.ts, weather-pulse cron):
 *      GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET / GOOGLE_ADS_REFRESH_TOKEN.
 *      The refresh token must carry the analytics.readonly + adwords scopes.
 *   2. Search Console: Pumbapood's service account (must have access to the
 *      pumbapood.ee GSC property): GSC_SERVICE_ACCOUNT_EMAIL / GSC_SERVICE_ACCOUNT_KEY.
 *      Same pattern as lib/gsc/client.ts.
 *
 * GA4_PROPERTY_ID and GSC_SITE_URL select Pumbapood's properties.
 */

import type { ReportPeriod } from "./types"

export type { ReportPeriod }

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"

/* ---------- OAuth refresh-token flow (GA4 + Google Ads) ---------- */

let cachedOAuth: { token: string; expiresAt: number } | null = null

export async function getGoogleOAuthToken(): Promise<string> {
  if (cachedOAuth && Date.now() < cachedOAuth.expiresAt - 60_000) {
    return cachedOAuth.token
  }
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google OAuth credentials not configured (GOOGLE_ADS_CLIENT_ID/SECRET/REFRESH_TOKEN)")
  }

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  })
  if (!res.ok) {
    cachedOAuth = null
    throw new Error(`Google OAuth token exchange failed: ${(await res.text()).slice(0, 300)}`)
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) throw new Error("Google OAuth returned no access_token")
  cachedOAuth = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
  return data.access_token
}

/* ---------- Service-account JWT flow (Search Console) ---------- */

let cachedGsc: { token: string; expiresAt: number } | null = null

export async function getGscAccessToken(): Promise<string> {
  if (cachedGsc && Date.now() < cachedGsc.expiresAt - 60_000) {
    return cachedGsc.token
  }
  const email = process.env.GSC_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GSC_SERVICE_ACCOUNT_KEY
  if (!email || !key) {
    throw new Error("GSC_SERVICE_ACCOUNT_EMAIL and GSC_SERVICE_ACCOUNT_KEY must be configured (Pumbapood service account)")
  }

  const header = { alg: "RS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const claims = {
    iss: email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: OAUTH_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }

  const { createSign } = await import("crypto")
  const sign = createSign("RSA-SHA256")
  const jwtBase = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(claims))}`
  sign.update(jwtBase)
  const signature = sign.sign(key.replace(/\\n/g, "\n"), "base64")
  const jwt = `${jwtBase}.${signature}`

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  })
  if (!res.ok) {
    cachedGsc = null
    throw new Error(`GSC auth failed: ${(await res.text()).slice(0, 300)}`)
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) throw new Error("GSC auth returned no access_token")
  cachedGsc = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
  return data.access_token
}

export async function postJson<T>(url: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${url} -> ${res.status}: ${text.slice(0, 400)}`)
  }
  return (await res.json()) as T
}

/* ---------- shared date-range convention (GA4/GSC/Ads data lags ~2 days) ---------- */

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Last 7 days (ending 2 days ago) vs the 7 days before that. */
export function weeklyPeriod(now: Date = new Date()): ReportPeriod {
  const end = new Date(now)
  end.setDate(end.getDate() - 2)
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - 6)
  return {
    start: isoDate(start),
    end: isoDate(end),
    prevStart: isoDate(prevStart),
    prevEnd: isoDate(prevEnd),
  }
}
