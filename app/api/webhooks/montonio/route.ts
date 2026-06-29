import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '@/lib/email';
import { sendMetaEvent } from '@/lib/meta-capi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Montonio Payments webhook payload (JWT-allkirjastatud).
 * Vt: https://docs.montonio.com/api/stargate/guides/payments
 */
interface MontonioPayload {
  accessKey: string;
  merchantReference: string; // → orders.order_number
  paymentStatus: 'PAID' | 'AUTHORIZED' | 'VOIDED' | 'ABANDONED';
  paymentUuid: string;
  paymentMethod?: string;
  amount?: number;
  currency?: string;
  orderUuid?: string;
}

interface OrderItemRow {
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number | string;
}

function getMontonioKeys() {
  const useSandbox = process.env.MONTONIO_SANDBOX === 'true';
  return {
    accessKey: useSandbox
      ? process.env.MONTONIO_ACCESS_KEY
      : process.env.MONTONIO_LIVE_ACCESS_KEY,
    secretKey: useSandbox
      ? process.env.MONTONIO_SECRET_KEY
      : process.env.MONTONIO_LIVE_SECRET_KEY,
  };
}

/**
 * Konverdib jsonb shipping_address inimloetavaks tekstiks mailile.
 * Toetab nii pakiautomaadi kui koduaadressi formaate.
 */
function formatShippingAddress(addr: unknown): string {
  if (!addr || typeof addr !== 'object') return '';
  const a = addr as Record<string, unknown>;

  // Pakiautomaat — eelistame nime, kui olemas
  if (a.parcel_machine_name) {
    const name = String(a.parcel_machine_name);
    const city = a.city ? `, ${String(a.city)}` : '';
    return `${name}${city}`;
  }

  // Tavaaadress
  const lines: string[] = [];
  if (a.name) lines.push(String(a.name));
  if (a.street) lines.push(String(a.street));
  if (a.zip && a.city) lines.push(`${String(a.zip)} ${String(a.city)}`);
  else if (a.city) lines.push(String(a.city));
  if (a.country) lines.push(String(a.country));

  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  const { accessKey, secretKey } = getMontonioKeys();
  if (!secretKey || !accessKey) {
    console.error('[montonio-webhook] Missing Montonio keys (check MONTONIO_SANDBOX env)');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  // 1. Loe payload
  let body: { orderToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const token = body.orderToken;
  if (!token) {
    return NextResponse.json({ error: 'Missing orderToken' }, { status: 400 });
  }

  // 2. Verifitseeri JWT
  let payload: MontonioPayload;
  try {
    payload = jwt.verify(token, secretKey, { algorithms: ['HS256'] }) as MontonioPayload;
  } catch (err) {
    console.error('[montonio-webhook] JWT verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Lisaks: kontrolli accessKey'd
  if (payload.accessKey !== accessKey) {
    console.error('[montonio-webhook] Access key mismatch');
    return NextResponse.json({ error: 'Access key mismatch' }, { status: 401 });
  }

  // 4. Logi sündmus alati (audit + debug)
  await supabaseAdmin.from('payment_events').insert({
    provider: 'montonio',
    payment_uuid: payload.paymentUuid,
    merchant_reference: payload.merchantReference,
    status: payload.paymentStatus,
    payload: payload as unknown as Record<string, unknown>,
  });

  // 5. Handle ABANDONED / VOIDED — send pending reminder email
  if (payload.paymentStatus === 'ABANDONED' || payload.paymentStatus === 'VOIDED') {
    const { data: orderForPending } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, email')
      .eq('order_number', payload.merchantReference)
      .single();

    if (orderForPending && orderForPending.status === 'pending' && orderForPending.email) {
      await sendOrderStatusUpdate({ orderId: orderForPending.id, newStatus: 'pending' });
    }
    console.log(
      `[montonio-webhook] Status ${payload.paymentStatus} for ${payload.merchantReference} — pending email sent`
    );
    return NextResponse.json({ received: true, status: payload.paymentStatus });
  }

  // 6. Käitleme ainult PAID staatust
  if (payload.paymentStatus !== 'PAID') {
    console.log(
      `[montonio-webhook] Status ${payload.paymentStatus} for ${payload.merchantReference} — no action`
    );
    return NextResponse.json({ received: true, status: payload.paymentStatus });
  }

  // 7. Leia tellimus
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select(
      `
      id, order_number, status, email, customer_name, locale,
      total, discount_amount, shipping_address, phone, advertising_consent,
      meta_fbp, meta_fbc, meta_event_source_url, meta_purchase_event_id, meta_purchase_sent_at,
      order_items ( product_id, product_name, quantity, unit_price )
    `
    )
    .eq('order_number', payload.merchantReference)
    .single();

  if (orderErr || !order) {
    console.error(
      '[montonio-webhook] Order not found',
      payload.merchantReference,
      orderErr
    );
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // 7. Idempotentsus — Montonio võib retry'da
  const alreadyProcessed = ['paid', 'shipped', 'delivered'].includes(order.status);
  if (alreadyProcessed && order.meta_purchase_sent_at) {
    console.log(
      `[montonio-webhook] Order ${order.order_number} already processed (${order.status})`
    );
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  // 8. Uuenda staatust → 'paid'
  if (!alreadyProcessed) {
    const { error: updErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_uuid: payload.paymentUuid,
        payment_method: payload.paymentMethod ?? null,
      })
      .eq('id', order.id);

    if (updErr) {
      console.error('[montonio-webhook] Order update failed', updErr);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
  }

  if (order.meta_purchase_event_id && !order.meta_purchase_sent_at) {
    try {
      const items = (order.order_items as OrderItemRow[]).map(item => ({
        id: String(item.product_id || item.product_name),
        quantity: item.quantity,
        item_price: Number((Number(item.unit_price) * 1.24).toFixed(2)),
      }))

      const sent = await sendMetaEvent({
        eventName: 'Purchase',
        eventId: order.meta_purchase_event_id,
        eventSourceUrl: order.meta_event_source_url,
        email: order.advertising_consent ? order.email : null,
        phone: order.advertising_consent ? order.phone : null,
        fbp: order.meta_fbp,
        fbc: order.meta_fbc,
        value: Number(order.total),
        currency: payload.currency || 'EUR',
        orderId: order.order_number,
        contents: items,
      });
      if (sent) {
        await supabaseAdmin.from('orders')
          .update({ meta_purchase_sent_at: new Date().toISOString() })
          .eq('id', order.id)
          .is('meta_purchase_sent_at', null);
      }
    } catch (trackingError) {
      console.error('[montonio-webhook] Meta Purchase failed (non-blocking)', trackingError);
    }
  }

  // Sildu payment_event order_id'ga (audit trail)
  await supabaseAdmin
    .from('payment_events')
    .update({ order_id: order.id })
    .eq('payment_uuid', payload.paymentUuid);

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  // 9. Saada OrderConfirmation mail
  if (!order.email) {
    console.warn(
      `[montonio-webhook] Order ${order.order_number} has no email, skipping confirmation`
    );
    return NextResponse.json({ received: true, emailSkipped: 'no_email' });
  }

  const items = (order.order_items as OrderItemRow[]).map((it) => ({
    name: it.product_name,
    quantity: it.quantity,
    unitPrice: Number(it.unit_price),
  }));
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const discount = Number(order.discount_amount ?? 0);
  const total = Number(order.total);
  const shippingAddressText = formatShippingAddress(order.shipping_address);

  try {
    await sendOrderConfirmation({
      to: order.email,
      locale: order.locale ?? 'et',
      customerName: order.customer_name ?? order.email.split('@')[0],
      orderNumber: order.order_number,
      items,
      subtotal,
      discount,
      total,
      paymentMethod: payload.paymentMethod,
      shippingAddress: shippingAddressText,
    });
  } catch (emailErr) {
    // Tellimus on juba paid — ei tohi webhook'i fail'iks teha,
    // muidu Montonio retry'b lõpmatult.
    console.error('[montonio-webhook] Confirmation email failed (non-blocking)', emailErr);
  }

  return NextResponse.json({ received: true });
}
