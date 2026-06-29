import { NextRequest, NextResponse } from 'next/server'
import { sendMetaEvent } from '@/lib/meta-capi'

interface LeadBody {
  event_id?: string
  email?: string
  phone?: string
  event_source_url?: string
  advertising_consent?: boolean
  fbp?: string
  fbc?: string
}

export async function POST(req: NextRequest) {
  const expectedOrigin = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const origin = req.headers.get('origin')
  if (expectedOrigin && origin && origin !== expectedOrigin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  let body: LeadBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.advertising_consent || !body.event_id || body.event_id.length > 100) {
    return NextResponse.json({ sent: false })
  }

  try {
    const sent = await sendMetaEvent({
      eventName: 'Lead',
      eventId: body.event_id,
      eventSourceUrl: body.event_source_url,
      email: body.email,
      phone: body.phone,
      fbp: body.fbp,
      fbc: body.fbc,
      currency: 'EUR',
    })
    return NextResponse.json({ sent })
  } catch (error) {
    console.error('[tracking/lead] Meta Lead failed', error)
    return NextResponse.json({ sent: false }, { status: 502 })
  }
}
