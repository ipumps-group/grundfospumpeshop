import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// ─── TÜÜBID ─────────────────────────────────────────────────────────────────

interface ParcelPoint {
  uuid:        string
  name:        string
  address:     string
  city:        string
  postal_code: string
}

// ─── OMNIVA avalik API ───────────────────────────────────────────────────────
// https://www.omniva.ee/locations.json — TYPE=0 → pakiautomaat

async function fetchOmniva(country: string): Promise<ParcelPoint[]> {
  const res = await fetch('https://www.omniva.ee/locations.json', {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Omniva API: ${res.status}`)

  const data = await res.json() as Array<{
    ZIP: string; NAME: string; TYPE: string
    A0_NAME: string; A1_NAME: string; A2_NAME: string
    A3_NAME: string; A5_NAME: string; A7_NAME: string
  }>

  return data
    .filter(p => p.A0_NAME === country && p.TYPE === '0')
    .map(p => ({
      uuid:        `omniva-${p.ZIP}-${p.NAME.replace(/\s+/g, '-')}`,
      name:        p.NAME,
      address:     [p.A5_NAME, p.A7_NAME].filter(Boolean).join(' '),
      city:        p.A3_NAME || p.A2_NAME || p.A1_NAME,
      postal_code: p.ZIP,
    }))
    .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name))
}

// ─── MONTONIO Shipping API ───────────────────────────────────────────────────
// NB! JWT payload peab kasutama camelCase: { accessKey } mitte { access_key }
// Töötab kui Montonio Shipping on portaalis seadistatud (kandjad lisatud).

async function fetchMontonio(
  carrier: string,
  country: string,
  accessKey: string,
  secretKey: string
): Promise<ParcelPoint[]> {
  const token = jwt.sign(
    { accessKey, iat: Math.floor(Date.now() / 1000) },
    secretKey,
    { algorithm: 'HS256', expiresIn: '10m' }
  )

  const sandbox = process.env.MONTONIO_SANDBOX === 'true'
  const apiBase = sandbox
    ? 'https://sandbox-shipping.montonio.com'
    : 'https://shipping.montonio.com'

  const res = await fetch(
    `${apiBase}/api/v2/shipping-methods?carrierCode=${carrier}&countryCode=${country}&type=parcelMachine`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 3600 } }
  )
  if (!res.ok) return []

  const data = await res.json() as { shippingMethods?: Array<Record<string, unknown>> }
  return (data.shippingMethods ?? [])
    .flatMap(m => {
      const pts = (m.pickupPoints ?? m.pickup_points ?? []) as Array<Record<string, unknown>>
      return pts.map(p => ({
        uuid:        String(p.uuid ?? p.id ?? ''),
        name:        String(p.name ?? ''),
        address:     String(p.streetAddress ?? p.address ?? ''),
        city:        String(p.locality ?? p.city ?? ''),
        postal_code: String(p.postalCode ?? p.postal_code ?? ''),
      }))
    })
    .sort((a, b) => a.city.localeCompare(b.city))
}

// ─── GET /api/shipping?carrier=omniva&country=EE ─────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const carrier = searchParams.get('carrier') || 'omniva'
  const country = searchParams.get('country') || 'EE'

  const accessKey = process.env.MONTONIO_ACCESS_KEY ?? ''
  const secretKey = process.env.MONTONIO_SECRET_KEY ?? ''

  try {
    let points: ParcelPoint[] = []

    // 1. Proovi Montonio Shipping API (kui portaalis on kandjad seadistatud)
    if (accessKey && secretKey) {
      points = await fetchMontonio(carrier, country, accessKey, secretKey)
    }

    // 2. Fallback: Omniva avalik API (töötab alati)
    if (points.length === 0 && carrier === 'omniva') {
      points = await fetchOmniva(country)
    }

    // DPD/SmartPost/Venipak — vajavad Montonio Shipping seadistust portaalis
    // (nende avalikud API-d ei ole vabalt ligipääsetavad)

    return NextResponse.json({ points, carrier, country })
  } catch (err) {
    console.error('Shipping API error:', err)
    return NextResponse.json(
      { error: 'Postiautomaatide laadimine ebaõnnestus', points: [] },
      { status: 500 }
    )
  }
}
