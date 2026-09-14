import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Weather-pulse: adjusts the Unilift CC Google Ads campaign daily budget
// based on the Open-Meteo rain forecast for Estonia (Tallinn, Tartu, Pärnu, Rakvere).
// Runs daily via Vercel Cron (see vercel.json). Protected by CRON_SECRET.

const CAMPAIGN_ID = '24203046624' // Unilift CC + Drenaaž - EE 2026 sügis
const CAMPAIGN_START = '2026-09-08'
const CAMPAIGN_END = '2026-11-30'
const TIERS = [
  { minRain48h: 10.0, budget: 18.0, label: 'tugev vihm' },
  { minRain48h: 4.0, budget: 14.0, label: 'vihmane' },
  { minRain48h: 0.0, budget: 10.0, label: 'põhiline' },
]
const CITIES = [
  { name: 'Tallinn', latitude: 59.437, longitude: 24.7536 },
  { name: 'Tartu', latitude: 58.378, longitude: 26.729 },
  { name: 'Pärnu', latitude: 58.3859, longitude: 24.4971 },
  { name: 'Rakvere', latitude: 59.3464, longitude: 26.3558 },
]
const MIN_PROBABILITY = 30

async function googleAccessToken(): Promise<string> {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    grant_type: 'refresh_token',
  })
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: p.toString(),
  })
  const d = await r.json()
  if (!d.access_token) throw new Error('Google OAuth failed')
  return d.access_token
}

async function gaql(token: string, customerId: string, query: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    'Content-Type': 'application/json',
  }
  const login = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')
  if (login) headers['login-customer-id'] = login
  const r = await fetch(`https://googleads.googleapis.com/v24/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })
  return (await r.json()).results || []
}

async function cityForecast(c: { name: string; latitude: number; longitude: number }) {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${c.latitude}&longitude=${c.longitude}&daily=precipitation_sum,precipitation_probability_max&timezone=Europe%2FTallinn&forecast_days=3`
  const d = await (await fetch(u)).json()
  const days = d.daily
  return {
    city: c.name,
    rain48: (days.precipitation_sum[0] || 0) + (days.precipitation_sum[1] || 0),
    prob: Math.max(days.precipitation_probability_max[0] || 0, days.precipitation_probability_max[1] || 0),
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Tallinn' })
  if (today < CAMPAIGN_START || today > CAMPAIGN_END) {
    return NextResponse.json({ skipped: true, reason: `Campaign not active (${CAMPAIGN_START} – ${CAMPAIGN_END})`, today })
  }

  try {
    const forecasts = await Promise.all(CITIES.map(cityForecast))
    let maxRain48 = 0, maxProb = 0, driver = ''
    for (const f of forecasts) {
      if (f.rain48 > maxRain48) { maxRain48 = f.rain48; maxProb = f.prob; driver = f.city }
    }

    let tier = TIERS[TIERS.length - 1]
    if (maxProb >= MIN_PROBABILITY) {
      for (const t of TIERS) if (maxRain48 >= t.minRain48h) { tier = t; break }
    }

    const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID || '2639481819').replace(/-/g, '')
    const token = await googleAccessToken()
    const rows = await gaql(token, customerId, `SELECT campaign.campaign_budget, campaign_budget.amount_micros FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}`)
    const budgetRn = rows[0]?.campaignBudget?.resourceName || rows[0]?.campaign?.campaignBudget
    const currentEur = Number(rows[0]?.campaignBudget?.amountMicros || 0) / 1_000_000

    if (!budgetRn) throw new Error('Campaign budget not found')

    if (Math.abs(currentEur - tier.budget) < 0.01) {
      return NextResponse.json({ changed: false, today, budget: currentEur, tier: tier.label, rain48h: maxRain48, driver, forecasts })
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      'Content-Type': 'application/json',
    }
    const login = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')
    if (login) headers['login-customer-id'] = login

    const r = await fetch(`https://googleads.googleapis.com/v24/customers/${customerId}/campaignBudgets:mutate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operations: [{
          update: { resourceName: budgetRn, amountMicros: String(Math.round(tier.budget * 1_000_000)) },
          updateMask: 'amount_micros',
        }],
      }),
    })
    const body = await r.json()
    if (!r.ok) throw new Error(JSON.stringify(body).slice(0, 300))

    return NextResponse.json({ changed: true, today, from: currentEur, to: tier.budget, tier: tier.label, rain48h: maxRain48, driver, forecasts })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
