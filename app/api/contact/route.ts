import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { rateLimit, STRICT_RATE } from '@/lib/rate-limit'
import { getResend, EMAIL_FROM, EMAIL_REPLY_TO } from '@/lib/resend'
import { COMPANY } from '@/lib/config'

interface ContactBody {
  pageId?: string | null
  name?: string
  email?: string
  phone?: string | null
  address?: string | null
  message?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function fieldRow(label: string, value: string | null) {
  if (!value) return ''
  return `<tr>
    <td style="padding:8px 12px;color:#6b7280;font-size:14px;vertical-align:top;white-space:nowrap">${label}</td>
    <td style="padding:8px 12px;color:#111827;font-size:14px">${esc(value).replace(/\n/g, '<br>')}</td>
  </tr>`
}

function buildSubmissionTable(d: { name: string; email: string; phone: string | null; address: string | null; message: string }) {
  return `<table style="border-collapse:collapse;width:100%;background:#f9fafb;border-radius:8px">
    ${fieldRow('Nimi', d.name)}
    ${fieldRow('E-post', d.email)}
    ${fieldRow('Telefon', d.phone)}
    ${fieldRow('Aadress', d.address)}
    ${fieldRow('Sõnum', d.message)}
  </table>`
}

function wrapHtml(title: string, intro: string, table: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#003366;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <div style="font-size:18px;font-weight:bold">${esc(COMPANY.legalName)} — pumbapood.ee</div>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px">
      <h1 style="margin:0 0 12px;font-size:18px;color:#111827">${title}</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#4b5563">${intro}</p>
      ${table}
      <p style="margin:16px 0 0;font-size:13px;color:#9ca3af">${esc(COMPANY.legalName)} · ${COMPANY.phone} · ${COMPANY.email}</p>
    </div>
  </div>
</body></html>`
}

async function sendAndLog(opts: {
  to: string
  subject: string
  html: string
  replyTo?: string
  type: string
}) {
  const logEntry: Record<string, unknown> = { type: opts.type, recipient: opts.to }
  try {
    const { data, error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: opts.to,
      replyTo: opts.replyTo ?? EMAIL_REPLY_TO,
      subject: opts.subject,
      html: opts.html,
    })
    if (error) throw new Error(error.message)
    logEntry.status = 'sent'
    logEntry.resend_id = data?.id
  } catch (err) {
    logEntry.status = 'error'
    logEntry.error = err instanceof Error ? err.message : String(err)
    console.error('[contact] email failed:', logEntry.error)
  }
  try { await supabaseAdmin.from('email_logs').insert(logEntry) } catch { /* silent */ }
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s || s.length > max) return null
  return s
}

// POST /api/contact — kontaktivormi / hinnapakkumise esitused.
// Kirjutab service_role'iga (bypass RLS), et brauseripoolsed anon-key/RLS
// probleemid vormi ei blokeeriks. Tõeline viga logitakse Vercel funktsiooni logi.
export async function POST(req: NextRequest) {
  // Same-origin kontroll: origin host peab klappima päringu hostiga
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  if (rateLimit(`contact:${ip}`, STRICT_RATE.maxRequests).blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: ContactBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = str(body.name, 200)
  const email = str(body.email, 320)
  const message = str(body.message, 5000)
  const phone = str(body.phone, 50)
  const address = str(body.address, 300)
  const pageId = typeof body.pageId === 'string' && UUID_RE.test(body.pageId) ? body.pageId : null

  if (!name || !email || !EMAIL_RE.test(email) || !message) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('contact_submissions').insert({
    page_id: pageId,
    name,
    email,
    phone,
    address,
    message,
  })

  if (error) {
    console.error('[contact] insert failed:', error)
    return NextResponse.json(
      { error: 'Insert failed', code: error.code ?? null },
      { status: 500 },
    )
  }

  // Saada teavitus poele + sama kiri kinnituseks kliendile.
  // E-posti viga EI tohi vormi saatmist nurjata — andmed on juba tabelis.
  try {
    const { data: recipientSetting } = await supabaseAdmin
      .from('settings').select('value').eq('key', 'order_notification_email').single()
    const adminEmail = recipientSetting?.value?.trim() || COMPANY.email

    const submission = { name, email, phone, address, message }
    const table = buildSubmissionTable(submission)

    await Promise.all([
      sendAndLog({
        to: adminEmail,
        replyTo: email,
        subject: `Uus päring kontaktivormist — ${name}`,
        html: wrapHtml(
          'Uus päring kontaktivormist',
          'Päring salvestati andmebaasi (contact_submissions). Vasta kliendile vajutades "Reply".',
          table,
        ),
        type: 'contact_form_admin',
      }),
      sendAndLog({
        to: email,
        subject: `Sinu päring on vastu võetud — ${COMPANY.legalName}`,
        html: wrapHtml(
          'Täname, sinu sõnum on jõudnud meieni!',
          'Võtame sinuga ühendust esimesel võimalusel. Allpool on sinu saadetud sõnumi koopia.',
          table,
        ),
        type: 'contact_form_customer',
      }),
    ])
  } catch (err) {
    console.error('[contact] email sending failed:', err)
  }

  return NextResponse.json({ ok: true })
}
