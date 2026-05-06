import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderShipped } from '@/lib/email';
import {
  buildTrackingUrl,
  type Carrier,
  type DeliveryMethod,
} from '@/lib/carriers';

export const runtime = 'nodejs';

// ── Auth: ainult superadmin + manager ─────────────────────────────────────
async function requireAdmin(): Promise<{ userId: string; role: string } | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          // read-only API route — ei ole vaja cookie'sid uuendada
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Loe profiilist roll (kasutab RLS'i, aga auth.uid() = user.id ikka leiab enda rea)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) return null;
  if (!['superadmin', 'manager'].includes(profile.role)) return null;

  return { userId: user.id, role: profile.role };
}

// ── POST: märgi tellimus saadetuks ─────────────────────────────────────────

interface ShipRequestBody {
  carrier: Carrier;
  deliveryMethod: DeliveryMethod;
  trackingNumber: string;
  estimatedDelivery?: string;
  deliveryAddressOverride?: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  email: string | null;
  customer_name: string | null;
  locale: string | null;
  shipping_address: unknown;
  order_items: Array<{ product_name: string; quantity: number }>;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse body
  const { id } = await params;
  let body: ShipRequestBody;
  try {
    body = (await req.json()) as ShipRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const carrier = body.carrier;
  const deliveryMethod = body.deliveryMethod;
  const trackingNumber = String(body.trackingNumber ?? '').trim();

  if (!carrier || !deliveryMethod) {
    return NextResponse.json(
      { error: 'Missing carrier or deliveryMethod' },
      { status: 400 }
    );
  }
  if (!trackingNumber) {
    return NextResponse.json(
      { error: 'Tracking number required' },
      { status: 400 }
    );
  }

  // 3. Leia tellimus
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select(
      `
      id, order_number, status, email, customer_name, locale, shipping_address,
      order_items ( product_name, quantity )
    `
    )
    .eq('id', id)
    .single<OrderRow>();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'paid') {
    return NextResponse.json(
      { error: `Cannot ship order in status '${order.status}' — only 'paid' orders can be shipped` },
      { status: 400 }
    );
  }

  // 4. Uuenda tellimust
  const trackingUrl = buildTrackingUrl(carrier, trackingNumber);

  const { error: updErr } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'shipped',
      shipped_at: new Date().toISOString(),
      carrier,
      delivery_method: deliveryMethod,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
    })
    .eq('id', order.id);

  if (updErr) {
    console.error('[ship] Order update failed', updErr);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  // 5. Lisa manuaalne rida order_status_history'sse (et näidata WHO changed it)
  // Trigger lisab ise 'Auto: paid -> shipped', aga me kirjutame lisainfoga üle
  await supabaseAdmin.from('order_status_history').insert({
    order_id: order.id,
    status: 'shipped',
    note: `Manuaalselt märgitud saadetuks · ${carrier.toUpperCase()} · ${trackingNumber}`,
    changed_by: admin.userId,
  });

  // 6. Saada OrderShipped mail
  let emailResult: unknown = { skipped: true, reason: 'no_email' };
  if (order.email) {
    const addr = (order.shipping_address ?? {}) as Record<string, unknown>;
    const deliveryAddress =
      body.deliveryAddressOverride ??
      (addr.parcel_machine_name
        ? String(addr.parcel_machine_name)
        : addr.street
        ? `${String(addr.street)}${addr.city ? ', ' + String(addr.city) : ''}`
        : undefined);

    try {
      emailResult = await sendOrderShipped({
        to: order.email,
        locale: order.locale ?? 'et',
        customerName: order.customer_name ?? order.email.split('@')[0],
        orderNumber: order.order_number,
        carrier,
        trackingNumber,
        trackingUrl,
        deliveryMethod,
        deliveryAddress,
        estimatedDelivery: body.estimatedDelivery,
        items: order.order_items.map((it) => ({
          name: it.product_name,
          quantity: it.quantity,
        })),
      });
    } catch (emailErr) {
      console.error('[ship] Email failed (non-blocking)', emailErr);
      emailResult = { skipped: false, error: String(emailErr) };
    }
  }

  return NextResponse.json({
    success: true,
    orderNumber: order.order_number,
    trackingNumber,
    trackingUrl,
    emailResult,
  });
}