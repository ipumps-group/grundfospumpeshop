import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { rateLimit, STRICT_RATE } from '@/lib/rate-limit'

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

  return NextResponse.json({ ok: true })
}
