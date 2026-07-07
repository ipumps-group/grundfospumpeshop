import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendNewOrderAdmin, sendPrepaymentInvoice, sendOrderPending } from '@/lib/email'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// ─── JWT ─────────────────────────────────────────────────────────────────────

function b64url(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function createMontonioJWT(payload: object, secret: string): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body   = b64url(JSON.stringify(payload))
  const sig    = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${body}.${sig}`
}

// ─── TÜÜBID ──────────────────────────────────────────────────────────────────

interface CartItem {
  id: number
  slug: string
  name: string
  price: number
  qty: number
}

interface CheckoutBody {
  customer: {
    first_name: string
    last_name:  string
    email:      string
    phone:      string
    company?:   string
    reg_code?:  string
    vat_number?: string
    company_country?: string
    company_street?: string
    company_city?: string
    company_county?: string
    company_postal?: string
    delivery_address_differs?: boolean
  }
  shipping: {
    carrier:              string
    carrier_name:         string
    country:              string
    pickup_point_uuid:    string
    pickup_point_name:    string
    pickup_point_address: string
    pickup_point_city:    string
    pickup_point_postal:  string
  }
  notes?:     string
  coupon_id?: string
  items: CartItem[]
  delivery_method?: string
  create_account?: boolean
  password?: string
  payment_type?: 'bank_link' | 'invoice'
  tracking?: {
    advertising_consent?: boolean
    fbp?: string
    fbc?: string
    event_source_url?: string
  }
}

// ─── POST /api/checkout ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Derive user_id from session cookie, NEVER from request body ─────────────
  let user_id: string | null = null
  try {
    const cookieStore = await cookies()
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    )
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (user) user_id = user.id
  } catch { /* guest checkout if no session */ }

  // ── Retry existing order — generate new Montonio payment link ─────────────────
  try {
    const preview = await req.clone().json()
    if (preview?.retry_order_id && !preview?.items) {
      const { data: retryOrder, error: retryErr } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, total, email, customer_name, montonio_order_id, shipping_address, status')
        .eq('id', preview.retry_order_id)
        .single()

      if (retryErr || !retryOrder || !['pending', 'cancelled'].includes(retryOrder.status)) {
        return NextResponse.json({ error: 'Tellimust ei leitud või makset ei saa uuesti proovida' }, { status: 400 })
      }

      // Set back to pending for retry
      if (retryOrder.status === 'cancelled') {
        await supabaseAdmin.from('orders').update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', retryOrder.id)
        await supabaseAdmin.from('order_status_history').insert({
          order_id: retryOrder.id,
          status: 'pending',
          note: 'Klient proovib uuesti maksta',
          changed_by: 'system',
        })
      }

      const { data: retryItems } = await supabaseAdmin
        .from('order_items')
        .select('product_id, product_name, quantity, unit_price')
        .eq('order_id', retryOrder.id)

      const sa = retryOrder.shipping_address ?? {} as Record<string, string>
      const sandbox2 = process.env.MONTONIO_SANDBOX === 'true'
      const ak2 = sandbox2 ? process.env.MONTONIO_ACCESS_KEY : process.env.MONTONIO_LIVE_ACCESS_KEY
      const sk2 = sandbox2 ? process.env.MONTONIO_SECRET_KEY : process.env.MONTONIO_LIVE_SECRET_KEY
      const siteUrl2 = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pumbapood.ee').replace(/\/$/, '')

      if (!ak2 || !sk2) {
        return NextResponse.json({ error: 'Montonio API võtmed puuduvad' }, { status: 500 })
      }

      const retryPayload = {
        accessKey: ak2,
        merchantReference: retryOrder.order_number,
        returnUrl: `${siteUrl2}/checkout/success?ref=${retryOrder.order_number}`,
        notificationUrl: `${siteUrl2}/api/webhooks/montonio`,
        locale: 'et',
        currency: 'EUR',
        grandTotal: retryOrder.total,
        payment: { method: 'paymentInitiation', amount: retryOrder.total, currency: 'EUR' },
        billingAddress: {
          firstName: sa.customer_name?.split(' ')[0] ?? '',
          lastName: sa.customer_name?.split(' ').slice(1).join(' ') ?? '',
          email: sa.customer_email ?? retryOrder.email ?? '',
          phone: sa.customer_phone ?? '',
        },
        shippingAddress: {
          firstName: sa.customer_name?.split(' ')[0] ?? '',
          lastName: sa.customer_name?.split(' ').slice(1).join(' ') ?? '',
          email: sa.customer_email ?? retryOrder.email ?? '',
          phone: sa.customer_phone ?? '',
          addressLine1: `${sa.carrier_name ?? ''}: ${sa.pickup_name ?? ''}`,
          addressLine2: sa.pickup_address ?? '',
          city: sa.pickup_city ?? '',
          country: sa.country ?? 'EE',
          postalCode: sa.pickup_postal ?? '',
        },
        lineItems: (retryItems ?? []).map(it => ({
          productCode: String(it.product_id ?? ''),
          name: it.product_name,
          price: Number((it.unit_price * 1.24).toFixed(2)),
          quantity: it.quantity,
          finalPrice: Number((it.unit_price * it.quantity * 1.24).toFixed(2)),
        })),
      }

      const retryToken = createMontonioJWT(retryPayload, sk2)
      const retryApiUrl = sandbox2
        ? 'https://sandbox-stargate.montonio.com/api/orders'
        : 'https://stargate.montonio.com/api/orders'

      const retryRes = await fetch(retryApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: retryToken }),
      })

      if (!retryRes.ok) {
        const err = await retryRes.text()
        console.error('Montonio retry viga:', err)
        return NextResponse.json({ error: 'Makselingi loomine ebaõnnestus', detail: err }, { status: 502 })
      }

      const retryData = await retryRes.json() as { paymentUrl?: string; uuid?: string }

      if (!retryData.paymentUrl) {
        return NextResponse.json({ error: 'Montonio ei tagastanud makselinki' }, { status: 502 })
      }

      if (retryData.uuid) {
        await supabaseAdmin.from('orders')
          .update({ montonio_order_id: retryData.uuid, updated_at: new Date().toISOString() })
          .eq('id', retryOrder.id)
      }

      return NextResponse.json({ payment_url: retryData.paymentUrl, ref: retryOrder.order_number })
    }
  } catch { /* not a retry request, continue to normal flow */ }

  // ── Debug: Log all Montonio env vars ──────────────────────────────────────────
  const envCheck = {
    MONTONIO_SANDBOX: process.env.MONTONIO_SANDBOX,
    MONTONIO_ACCESS_KEY: process.env.MONTONIO_ACCESS_KEY ? `SET (${process.env.MONTONIO_ACCESS_KEY.substring(0,20)})` : 'MISSING',
    MONTONIO_SECRET_KEY: process.env.MONTONIO_SECRET_KEY ? `SET (${process.env.MONTONIO_SECRET_KEY.substring(0,20)})` : 'MISSING',
    MONTONIO_LIVE_ACCESS_KEY: process.env.MONTONIO_LIVE_ACCESS_KEY ? `SET (${process.env.MONTONIO_LIVE_ACCESS_KEY.substring(0,20)})` : 'MISSING',
    MONTONIO_LIVE_SECRET_KEY: process.env.MONTONIO_LIVE_SECRET_KEY ? `SET (${process.env.MONTONIO_LIVE_SECRET_KEY.substring(0,20)})` : 'MISSING',
  }
  console.log('[CHECKOUT] Montonio ENV check:', envCheck)

  const sandbox   = process.env.MONTONIO_SANDBOX === 'true'
  const accessKey = sandbox
    ? process.env.MONTONIO_ACCESS_KEY
    : process.env.MONTONIO_LIVE_ACCESS_KEY
  const secretKey = sandbox
    ? process.env.MONTONIO_SECRET_KEY
    : process.env.MONTONIO_LIVE_SECRET_KEY
  const siteUrl   = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pumbapood.ee').replace(/\/$/, '')

  console.log('[CHECKOUT] Using key mode:', { 
    sandbox, 
    accessKey: accessKey ? `SET (${accessKey.substring(0,20)})` : 'MISSING',
    secretKey: secretKey ? `SET (${secretKey.substring(0,20)})` : 'MISSING',
  })

  if (!accessKey || !secretKey) {
    return NextResponse.json({ error: 'Montonio API võtmed puuduvad' }, { status: 500 })
  }

  let body: CheckoutBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const { customer, shipping, notes, coupon_id, items, delivery_method, create_account, password, payment_type, tracking } = body

  if (!customer?.first_name || !customer?.last_name || !customer?.email ||
      !customer?.phone || !items?.length || !shipping?.carrier) {
    return NextResponse.json({ error: 'Puuduvad kohustuslikud väljad' }, { status: 422 })
  }

  // pickup_point_uuid is no longer required (parcel machine delivery removed)

  const VAT_RATE = 0.24
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)

  // ── Kupong ──────────────────────────────────────────────────────────────────
  let discountAmount = 0
  let couponCode: string | null = null

  if (coupon_id) {
    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('id, code, type, value, min_order_amount, usage_limit, used_count, valid_from, valid_until, active')
      .eq('id', coupon_id)
      .single()

    if (coupon && coupon.active) {
      const now = Date.now()
      const fromOk  = !coupon.valid_from  || new Date(coupon.valid_from).getTime()  <= now
      const untilOk = !coupon.valid_until || new Date(coupon.valid_until).getTime() >= now
      const limitOk = coupon.usage_limit === null || coupon.used_count < coupon.usage_limit
      const minOk   = subtotal >= (coupon.min_order_amount ?? 0)

      if (fromOk && untilOk && limitOk && minOk) {
        discountAmount = coupon.type === 'percent'
          ? Number((subtotal * coupon.value / 100).toFixed(2))
          : Math.min(Number(coupon.value), subtotal)
        couponCode = coupon.code
      }
    }
  }

  const grandTotal  = Number(((subtotal - discountAmount) * (1 + VAT_RATE)).toFixed(2))
  const merchantRef = `IPUMPS-${Date.now()}`
  const metaPurchaseEventId = crypto.randomUUID()

  // ── 1. Salvesta tellimus DB-sse ────────────────────────────────────────────

  const shippingAddress = {
    carrier:         shipping.carrier,
    carrier_name:    shipping.carrier_name,
    country:         shipping.country,
    pickup_uuid:     shipping.pickup_point_uuid,
    pickup_name:     shipping.pickup_point_name,
    pickup_address:  shipping.pickup_point_address,
    pickup_city:     shipping.pickup_point_city,
    pickup_postal:   shipping.pickup_point_postal,
    customer_name:   `${customer.first_name} ${customer.last_name}`,
    customer_email:  customer.email,
    customer_phone:  customer.phone,
    ...(customer.company && { company: customer.company }),
    ...(customer.reg_code && { reg_code: customer.reg_code }),
    ...(customer.vat_number && { vat_number: customer.vat_number }),
    ...(customer.company_country && { company_country: customer.company_country }),
    ...(customer.company_street && { company_street: customer.company_street }),
    ...(customer.company_city && { company_city: customer.company_city }),
    ...(customer.company_county && { company_county: customer.company_county }),
    ...(customer.company_postal && { company_postal: customer.company_postal }),
    ...(customer.delivery_address_differs !== undefined && { delivery_address_differs: customer.delivery_address_differs }),
    ...(notes && { notes }),
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id:          user_id || null,
      status:           'pending',
      total:            grandTotal,
      email:            customer.email,
      customer_name:    `${customer.first_name} ${customer.last_name}`,
      locale:           'et', // TODO: get from request context
      phone:            customer.phone,
      advertising_consent: tracking?.advertising_consent === true,
      meta_fbp:         tracking?.fbp?.slice(0, 255) || null,
      meta_fbc:         tracking?.fbc?.slice(0, 255) || null,
      meta_event_source_url: tracking?.event_source_url?.slice(0, 2048) || null,
      meta_purchase_event_id: metaPurchaseEventId,
      montonio_order_id: merchantRef,
      shipping_address: shippingAddress,
      ...(couponCode && { coupon_code: couponCode, discount_amount: discountAmount }),
    })
    .select('id, order_number')
    .single()

  if (orderError || !order) {
    console.error('Tellimuse salvestamine ebaõnnestus:', orderError)
    return NextResponse.json({ error: 'Tellimuse salvestamine ebaõnnestus' }, { status: 500 })
  }

  const orderId = order.id
  const orderNumber = order.order_number // DB generates this

  // Salvesta tooted
  const orderItems = items.map(item => ({
    order_id:     orderId,
    product_id:   item.id,
    product_name: item.name,
    quantity:     item.qty,
    unit_price:   item.price,
  }))

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Toodete salvestamine ebaõnnestus:', itemsError)
    // Jätka sellegipoolest — põhitellimus on salvestatud
  }

  // Staatuse ajalugu: ootel
  await supabaseAdmin.from('order_status_history').insert({
    order_id:   orderId,
    status:     'pending',
    note:       'Tellimus loodud, ootan makset',
    changed_by: 'system',
  })

  // Kupong — salvesta kasutus + uuenda loendur
  if (coupon_id && couponCode) {
    await supabaseAdmin.from('coupon_usage').insert({
      coupon_id,
      order_id: orderId,
      user_id:  null,
    })
    const { data: couponRow } = await supabaseAdmin
      .from('coupons').select('used_count').eq('id', coupon_id).single()
    if (couponRow) {
      await supabaseAdmin.from('coupons')
        .update({ used_count: couponRow.used_count + 1 })
        .eq('id', coupon_id)
    }
  }

  // ── Konto loomine (kui soovitud) ─────────────────────────────────────────────
  let accountCreated = false
  if (create_account && password && password.length >= 6) {
    try {
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: customer.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `${customer.first_name} ${customer.last_name}` },
      })

      if (createErr) {
        console.warn('[checkout] Account creation failed (non-blocking):', createErr.message)
        if (createErr.message?.includes('already') || createErr.status === 422) {
          const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
          const match = existing?.users?.find(u => u.email?.toLowerCase() === customer.email.toLowerCase())
          if (match) {
            await supabaseAdmin.from('orders').update({ user_id: match.id, updated_at: new Date().toISOString() }).eq('id', orderId)
            // Update profile phone if empty
            const { data: existingProfile } = await supabaseAdmin.from('profiles').select('phone').eq('id', match.id).single()
            if (existingProfile && !existingProfile.phone && customer.phone) {
              await supabaseAdmin.from('profiles').update({ phone: customer.phone, updated_at: new Date().toISOString() }).eq('id', match.id)
            }
            console.log('[checkout] Linked order to existing user:', match.id)
          }
        }
      } else if (newUser?.user) {
        await supabaseAdmin.from('orders').update({ user_id: newUser.user.id, updated_at: new Date().toISOString() }).eq('id', orderId)

        // Save phone to profile
        await supabaseAdmin.from('profiles').upsert({
          id: newUser.user.id,
          email: customer.email,
          full_name: `${customer.first_name} ${customer.last_name}`,
          phone: customer.phone,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

        accountCreated = true
        console.log('[checkout] Account created and linked to order:', newUser.user.id)
      }
    } catch (err) {
      console.error('[checkout] Account creation error (non-blocking):', err)
    }
  }

  // ── Ettemaksu arve — loo tellimus ilma Montoniota ─────────────────────────
  if (payment_type === 'invoice') {
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' })

    await sendPrepaymentInvoice({
      to: customer.email,
      locale: 'et',
      customerName: `${customer.first_name} ${customer.last_name}`,
      orderNumber: orderNumber.toString(),
      items: items.map(i => ({ name: i.name, quantity: i.qty, unitPrice: i.price })),
      total: grandTotal,
      dueDate,
      orderId,
    })

    // Send admin notification about new order
    await sendNewOrderAdmin(orderId)

    return NextResponse.json({ invoice_sent: true, ref: orderNumber, created_account: accountCreated })
  }

  // ── 2. Loo Montonio makselink ──────────────────────────────────────────────

  console.log('Montonio config:', {
    sandbox,
    accessKey: accessKey ? 'SET' : 'MISSING',
    secretKey: secretKey ? 'SET' : 'MISSING',
    siteUrl,
    grandTotal,
  })

  const payload = {
    // Auth & Order identification
    accessKey:          accessKey,
    merchantReference: orderNumber, // Use DB-generated order_number
    returnUrl:        `${siteUrl}/checkout/success?ref=${orderNumber}`,
    notificationUrl: `${siteUrl}/api/webhooks/montonio`,
    
    // Order details
    locale:      'et',
    currency:    'EUR',
    grandTotal:  grandTotal,
    
    // Payment method
    payment: {
      method: 'paymentInitiation',
      amount: grandTotal,
      currency: 'EUR',
    },
    
    // Customer info
    billingAddress: {
      firstName: customer.first_name,
      lastName:  customer.last_name,
      email:     customer.email,
      phone:     customer.phone,
    },

    shippingAddress: {
      firstName:   customer.first_name,
      lastName:    customer.last_name,
      email:      customer.email,
      phone:      customer.phone,
      addressLine1: `${shipping.carrier_name}: ${shipping.pickup_point_name}`,
      addressLine2: shipping.pickup_point_address,
      city:         shipping.pickup_point_city,
      country:      shipping.country,
      postalCode:  shipping.pickup_point_postal,
    },

    lineItems: items.map(item => ({
      productCode: String(item.id),
      name:       item.name,
      price:      Number((item.price * (1 + VAT_RATE)).toFixed(2)),
      quantity:   item.qty,
      finalPrice: Number((item.price * item.qty * (1 + VAT_RATE)).toFixed(2)),
    })),
  }

  const token  = createMontonioJWT(payload, secretKey)
  const apiUrl = sandbox
    ? 'https://sandbox-stargate.montonio.com/api/orders'
    : 'https://stargate.montonio.com/api/orders'

  // ── Debug: Log request details ─────────────────────────────────────────────
  console.log('[CHECKOUT] Montonio request:', {
    apiUrl,
    payload: { ...payload, accessKey: payload.accessKey ? `SET (${payload.accessKey.substring(0,20)})` : 'MISSING' },
    tokenPreview: token.substring(0, 80) + '...',
  })

  try {
    // Official format: POST /orders with { data: token }
    const res = await fetch(apiUrl, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ data: token }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Montonio orders API viga (status %d):', res.status, err)
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return NextResponse.json({ error: 'Makselingi loomine ebaõnnestus', detail: err }, { status: 502 })
    }

    const data = await res.json() as { paymentUrl?: string; uuid?: string }

    if (!data.paymentUrl) {
      console.error('Montonio response missing paymentUrl:', data)
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return NextResponse.json({ error: 'Montonio ei tagastanud makselinki' }, { status: 502 })
    }

    // Salvesta Montonio Order UUID
    if (data.uuid) {
      await supabaseAdmin.from('orders')
        .update({ montonio_order_id: data.uuid, updated_at: new Date().toISOString() })
        .eq('id', orderId)
    }

    // Send pending notification to customer
    await sendOrderPending({
      to: customer.email,
      customerName: `${customer.first_name} ${customer.last_name}`,
      orderNumber: orderNumber.toString(),
      items: items.map(i => ({ product_name: i.name, quantity: i.qty, unit_price: i.price })),
      total: grandTotal,
      customerEmail: customer.email,
    })

    // Send admin notification about new order (fire-and-forget)
    await sendNewOrderAdmin(orderId)

    return NextResponse.json({ payment_url: data.paymentUrl, ref: orderNumber, created_account: accountCreated })
  } catch (err) {
    console.error('Checkout viga:', err)
    await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId)
    return NextResponse.json({ error: 'Serveri viga, proovi uuesti' }, { status: 500 })
  }
}
