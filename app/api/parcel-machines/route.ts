import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// ─── JWT HELPER ─────────────────────────────────────────────────────────────

function b64url(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function createJWT(payload: object, secret: string): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body   = b64url(JSON.stringify(payload))
  const sig    = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${body}.${sig}`
}

// ─── GET /api/parcel-machines?carrier=omniva&country=EE ─────────────────────
//
// Tagastab Montonio Shipping API kaudu postiautomaadid valitud kandja + riigi järgi.
// Montonio Shipping API: https://sandbox-shipping.montonio.com/api/v2

export async function GET(req: NextRequest) {
  const sandbox   = process.env.MONTONIO_SANDBOX === 'true'
  const accessKey = sandbox
    ? process.env.MONTONIO_ACCESS_KEY
    : process.env.MONTONIO_LIVE_ACCESS_KEY
  const secretKey = sandbox
    ? process.env.MONTONIO_SECRET_KEY
    : process.env.MONTONIO_LIVE_SECRET_KEY

  if (!accessKey || !secretKey) {
    return NextResponse.json({ error: 'API võtmed puuduvad', points: [] }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const carrier = searchParams.get('carrier') || 'omniva'
  const country = searchParams.get('country') || 'EE'

  const jwt = createJWT(
    {
      access_key: accessKey,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    secretKey
  )

  const apiBase = sandbox
    ? 'https://sandbox-shipping.montonio.com/api'
    : 'https://shipping.montonio.com/api'

  try {
    const res = await fetch(
      `${apiBase}/v2/pickup-points?carrierCode=${carrier}&countryCode=${country}&type=parcelMachine`,
      {
        headers: { Authorization: `Bearer ${jwt}` },
        next: { revalidate: 3600 }, // cache 1h
      }
    )

    if (!res.ok) {
      const text = await res.text()
      console.error(`Montonio parcel-machines error [${res.status}]:`, text)
      return NextResponse.json({ points: [], error: `Shipping API: ${res.status}` })
    }

    const data = await res.json()

    // Normalise — Montonio tagastab kas array otse või { data: [...] }
    const raw: unknown[] = Array.isArray(data) ? data : (data?.data ?? data?.pickup_points ?? [])

    const points = raw.map((p: unknown) => {
      const pt = p as Record<string, unknown>
      return {
        uuid:        (pt.uuid ?? pt.id ?? '') as string,
        name:        (pt.name ?? '') as string,
        address:     (pt.streetAddress ?? pt.address ?? pt.address_line1 ?? '') as string,
        city:        (pt.locality ?? pt.city ?? '') as string,
        postal_code: (pt.postalCode ?? pt.postal_code ?? '') as string,
      }
    })

    return NextResponse.json({ points })
  } catch (err) {
    console.error('Parcel-machines fetch error:', err)
    return NextResponse.json({ points: [], error: 'Ühenduse viga' })
  }
}
