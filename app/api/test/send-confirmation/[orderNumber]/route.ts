import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderConfirmation } from '@/lib/email';

export const runtime = 'nodejs';

async function requireAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['superadmin', 'manager'].includes(profile.role)) return null;
  return user;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderNumber } = await params;
  console.log('[test-confirm] Loading order:', orderNumber);

    const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id, order_number, email, customer_name, locale,
      total, discount_amount, shipping_address,
      order_items ( product_name, quantity, unit_price )
    `)
    .eq('order_number', orderNumber)
    .single();

  if (error || !order) {
    console.error('[test-confirm] Order fetch failed:', error);
    return NextResponse.json({ step: 'fetch_order', error: error?.message ?? 'not found' }, { status: 404 });
  }

  console.log('[test-confirm] Order loaded:', {
    email: order.email,
    locale: order.locale,
    itemsCount: order.order_items?.length,
  });

  if (!order.email) {
    return NextResponse.json({ step: 'validate_email', error: 'no email' }, { status: 400 });
  }

  const items = (order.order_items as Array<{ product_name: string; quantity: number; unit_price: number | string }>).map(it => ({
    name: it.product_name,
    quantity: it.quantity,
    unitPrice: Number(it.unit_price),
  }));
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  const addr = (order.shipping_address ?? {}) as Record<string, unknown>;
  const shippingText = addr.parcel_machine_name
    ? String(addr.parcel_machine_name)
    : addr.street
    ? `${String(addr.street)}${addr.city ? ', ' + String(addr.city) : ''}`
    : 'N/A';

  console.log('[test-confirm] Calling sendOrderConfirmation...');

  try {
    const result = await sendOrderConfirmation({
      to: order.email,
      locale: order.locale ?? 'et',
      customerName: order.customer_name ?? order.email.split('@')[0],
      orderNumber: order.order_number,
      items,
      subtotal,
      discount: Number(order.discount_amount ?? 0),
      total: Number(order.total),
      paymentMethod: 'test',
      shippingAddress: shippingText,
      orderId: order.id,
    });

    console.log('[test-confirm] Send result:', JSON.stringify(result));

    // Extract error properly for JSON response
    let errorInfo = null;
    if (result.error) {
      const e = result.error as { name?: string; message?: string };
      errorInfo = {
        name: e.name,
        message: e.message,
        raw: JSON.parse(JSON.stringify(result.error)),
      };
    }

    return NextResponse.json({
      step: 'complete',
      skipped: result.skipped,
      id: result.id,
      error: errorInfo,
    });
  } catch (err) {
    console.error('[test-confirm] Threw error:', err);
    const e = err as Error;
    return NextResponse.json({
      step: 'send',
      error: { name: e.name, message: e.message, stack: e.stack?.split('\n').slice(0, 10) },
    }, { status: 500 });
  }
}