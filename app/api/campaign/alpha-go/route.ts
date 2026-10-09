import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { rateLimit, STRICT_RATE } from '@/lib/rate-limit'
import { getResend, EMAIL_FROM, EMAIL_REPLY_TO, SITE_URL } from '@/lib/resend'
import { createClient } from '@supabase/supabase-js'
import AlphaGoInstaller from '@/emails/AlphaGoInstaller'
import AlphaGoReseller from '@/emails/AlphaGoReseller'
import * as React from 'react'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/campaign/alpha-go — saada ALPHA GO kampaania e-kiri
// Body: { type: 'installer' | 'reseller', to: string, customerName?: string, dryRun?: boolean }
export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch (e) { return e as NextResponse }
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, STRICT_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { type = 'installer', to, customerName, dryRun = true } = await req.json().catch(() => ({}))

  if (!to || !to.includes('@')) {
    return NextResponse.json({ error: 'Missing or invalid "to" address' }, { status: 400 })
  }

  const subject = type === 'reseller'
    ? 'Grundfos ALPHA GO hulgihinnad — ametlik edasimüüja Eestis'
    : 'Uus Grundfos ALPHA GO — kaks pumpa saja asemel'

  const component = type === 'reseller' ? AlphaGoReseller : AlphaGoInstaller
  const react = React.createElement(component, {
    customerName: customerName || undefined,
    siteUrl: SITE_URL,
    replyToEmail: EMAIL_REPLY_TO,
  })

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      message: 'Dry run — e-kirja EI saadetud. Saatmiseks kasuta dryRun: false',
      subject,
      type,
      to,
    })
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject,
      react,
      tags: [
        { name: 'category', value: 'campaign_alpha_go' },
        { name: 'campaign_type', value: type },
      ],
    })
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, dryRun: false, id: data?.id, subject, to })
  } catch (err: any) {
    console.error('[campaign-alpha-go] Send failed:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET /api/campaign/alpha-go — test-vorm
export async function GET() {
  try { await requireAdmin() } catch (e) { return e as NextResponse }
  const html = `<!DOCTYPE html>
<html><head><title>ALPHA GO kampaania</title></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:20px;">
  <h1>ALPHA GO kampaania e-kiri</h1>
  <form method="POST" action="/api/campaign/alpha-go" style="display:flex;flex-direction:column;gap:12px;">
    <label>Tüüp:
      <select name="type">
        <option value="installer">Paigaldaja (ALPHA GO äpp + asendus)</option>
        <option value="reseller">Edasimüüja (hulgihinnad + B2B)</option>
      </select>
    </label>
    <label>Saaja e-post: <input name="to" type="email" required style="width:100%;padding:8px;"></label>
    <label>Kliendi nimi (valikuline): <input name="customerName" type="text" style="width:100%;padding:8px;"></label>
    <label><input type="checkbox" name="dryRun" checked> Dry run (ära saada, ainult testi)</label>
    <button type="submit" style="padding:12px 24px;background:#003366;color:#fff;border:none;border-radius:6px;cursor:pointer;">Saada test</button>
  </form>
</body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html' } })
}
