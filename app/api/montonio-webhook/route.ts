import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ─── JWT verifitseerimine ─────────────────────────────────────────────────────

function verifyMontonioJWT(token: string, secret: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const sig = crypto
      .createHmac('sha256', secret)
      .update(`${parts[0]}.${parts[1]}`)
      .digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    if (sig !== parts[2]) return null

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())

    // Kontrolli aegumist
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

// ─── Staatuse teisendus ───────────────────────────────────────────────────────

function mapStatus(montonioStatus: string): string {
  switch (montonioStatus?.toUpperCase()) {
    case 'PAID':
    case 'AUTHORIZED': return 'paid'
    case 'CANCELLED':
    case 'EXPIRED':    return 'cancelled'
    default:           return 'pending'
  }
}

// ─── POST /api/montonio-webhook ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { orderToken?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const { orderToken } = body
  if (!orderToken) {
    return NextResponse.json({ error: 'orderToken puudub' }, { status: 400 })
  }

  // Proovi verifitseerida mõlema võtmega (sandbox + live)
  const sandbox     = process.env.MONTONIO_SANDBOX === 'true'
  const primaryKey  = sandbox ? process.env.MONTONIO_SECRET_KEY! : process.env.MONTONIO_LIVE_SECRET_KEY!
  const fallbackKey = sandbox ? process.env.MONTONIO_LIVE_SECRET_KEY! : process.env.MONTONIO_SECRET_KEY!

  let payload = verifyMontonioJWT(orderToken, primaryKey)
  if (!payload) payload = verifyMontonioJWT(orderToken, fallbackKey)

  if (!payload) {
    console.error('Montonio webhook: JWT verifitseerimine ebaõnnestus')
    return NextResponse.json({ error: 'Vigane allkiri' }, { status: 401 })
  }

  const merchantRef    = payload.merchantReference as string
  const orderUuid      = payload.uuid as string
  const montonioStatus = (payload.paymentStatus ?? payload.status ?? '') as string
  const newStatus      = mapStatus(montonioStatus)

  if (!merchantRef && !orderUuid) {
    return NextResponse.json({ error: 'merchantReference või uuid puudub' }, { status: 400 })
  }

  // ── Leia tellimus (kas merchantReference või uuid järgi) ────────────────

  let order: { id: string; status: string; shipping_address: Record<string, unknown> } | null = null
  let findError: { message: string } | null = null

  if (orderUuid) {
    // First try by Montonio UUID
    const result = await supabaseAdmin
      .from('orders')
      .select('id, status, shipping_address')
      .eq('montonio_order_id', orderUuid)
      .single()
    order = result.data
    findError = result.error
  }
  
  if (!order && merchantRef) {
    // Fallback: try by merchantReference (IPUMPS- timestamp)
    const result = await supabaseAdmin
      .from('orders')
      .select('id, status, shipping_address')
      .eq('montonio_order_id', merchantRef)
      .single()
    order = result.data
    findError = result.error
  }

  if (findError || !order) {
    console.error('Montonio webhook: tellimust ei leitud:', merchantRef)
    // Tagasta 200, et Montonio ei prooviks uuesti
    return NextResponse.json({ ok: true })
  }

  // Idempotentsus: kui staatus on juba sama, ära tee topelt kirjeid
  if (order.status === newStatus) {
    return NextResponse.json({ ok: true })
  }

  // ── Uuenda tellimuse staatus ──────────────────────────────────────────────

  await supabaseAdmin
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', order.id)

  // ── Staatuse ajalugu ──────────────────────────────────────────────────────

  const statusNote = newStatus === 'paid'
    ? 'Makse edukalt kinnitatud'
    : newStatus === 'cancelled'
    ? 'Makse tühistatud või aegunud'
    : `Staatuse uuendus: ${montonioStatus}`

  await supabaseAdmin.from('order_status_history').insert({
    order_id:   order.id,
    status:     newStatus,
    note:       statusNote,
    changed_by: 'montonio',
  })

  // ── Seo tellimus kasutajaga (kui on registreeritud) ───────────────────────

  const customerEmail = (order.shipping_address as Record<string, string>)?.customer_email
  if (customerEmail && newStatus === 'paid') {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .single()

    if (profile?.id) {
      await supabaseAdmin
        .from('orders')
        .update({ user_id: profile.id })
        .eq('id', order.id)
    }
  }

  console.log(`Webhook: tellimus ${merchantRef} → ${newStatus}`)
  return NextResponse.json({ ok: true })
}
