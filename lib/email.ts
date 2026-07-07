import * as React from 'react';
import { getResend, EMAIL_FROM, EMAIL_REPLY_TO, SITE_URL } from './resend';
import { supabaseAdmin } from './supabase-admin';
import { loadEmailMessages, interpolate } from './email-i18n';
import OrderConfirmation from '@/emails/OrderConfirmation';
import OrderShipped from '@/emails/OrderShipped';
import RefundConfirmation from '@/emails/RefundConfirmation';
import AbandonedCart from '@/emails/AbandonedCart';
import PrepaymentInvoice from '@/emails/PrepaymentInvoice';
import type { Carrier, DeliveryMethod } from './carriers';
import {
  buildStatusUpdateHtml,
  buildNewOrderAdminHtml,
  statusSubject,
} from './email-templates';

// ── Tüübid ────────────────────────────────────────────────────────────────

export type EmailCategory =
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'refund_confirmation'
  | 'abandoned_cart'
  | 'password_reset'
  | 'account_welcome';

/**
 * Transactional mailid saadetakse ka siis, kui aadress on hard bounce'iga
 * suppression listi sattunud (klient võis aadressi vahetada).
 * Spam complaint blokeerib KÕIK, ka transactional.
 */
const TRANSACTIONAL: EmailCategory[] = [
  'order_confirmation',
  'order_shipped',
  'order_delivered',
  'refund_confirmation',
  'password_reset',
];

interface SendResult {
  skipped: boolean;
  reason?: 'suppressed';
  id?: string;
  error?: unknown;
}

// ── Sisemised helperid ────────────────────────────────────────────────────

async function isSuppressed(
  email: string,
  category: EmailCategory
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('email_suppressions')
    .select('reason')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('[email] Suppression check failed', error);
    return false; // Fail-open: saatmine läbi, mitte blokeerida
  }
  if (!data) return false;

  if (data.reason === 'complained') return true;
  if (data.reason === 'manual') return true;
  if (data.reason === 'bounced' && !TRANSACTIONAL.includes(category)) return true;
  return false;
}

// ── Teavituste seaded settings tabelist ──────────────────────────────────

async function getSetting(key: string, fallback: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', key)
      .single()
    return data?.value ?? fallback
  } catch {
    return fallback
  }
}

export async function isNotifEnabled(key: string): Promise<boolean> {
  const val = await getSetting(key, 'true')
  return val !== 'false' && val !== '0'
}

/**
 * Resend nõuab tag'ide nimes/väärtuses ainult [a-zA-Z0-9_-].
 * Sanitize'ime tundmatud sümbolid alakriipsuks.
 */
function sanitizeTag(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 256);
}

interface SendArgs {
  to: string;
  subject: string;
  react: React.ReactElement;
  category: EmailCategory;
  extraTags?: Array<{ name: string; value: string }>;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string }>;
}

async function send({
  to,
  subject,
  react,
  category,
  extraTags = [],
  replyTo,
  attachments,
}: SendArgs): Promise<SendResult> {
  if (!to || !to.includes('@')) {
    console.warn(`[email] Invalid recipient address: "${to}" (${category})`);
    return { skipped: true, reason: 'suppressed' };
  }

  if (await isSuppressed(to, category)) {
    console.log(`[email] Skipped suppressed address: ${to} (${category})`);
    return { skipped: true, reason: 'suppressed' };
  }

  try {
    const result = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: replyTo ?? EMAIL_REPLY_TO,
      subject,
      react,
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
      })),
      tags: [
        { name: 'category', value: category },
        { name: 'environment', value: process.env.NODE_ENV ?? 'development' },
        ...extraTags.map((t) => ({
          name: sanitizeTag(t.name),
          value: sanitizeTag(t.value),
        })),
      ],
    });

    if (result.error) {
      console.error(`[email] Resend error (${category} → ${to})`, result.error);
      return { skipped: false, error: result.error };
    }

    console.log(`[email] Sent ${category} → ${to} (id=${result.data?.id})`);
    return { skipped: false, id: result.data?.id };
  } catch (err) {
    console.error(`[email] Send failed (${category} → ${to})`, err);
    return { skipped: false, error: err };
  }
}

function buildOrderUrl(locale: string, orderNumber: string): string {
  return `${SITE_URL.replace(/\/$/, '')}/${locale}/tellimus/${orderNumber}`;
}

// ── Avalikud funktsioonid ─────────────────────────────────────────────────

interface OrderItemInput {
  name: string;
  quantity: number;
  unitPrice: number;
}

export async function sendOrderConfirmation(data: {
  to: string;
  locale: string;
  customerName: string;
  orderNumber: string;
  items: OrderItemInput[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  shippingAddress: string;
}): Promise<SendResult> {
  const messages = await loadEmailMessages(data.locale);
  const subject = interpolate(messages.orderConfirmation.subject, {
    orderNumber: data.orderNumber,
  });

  return send({
    to: data.to,
    subject,
    category: 'order_confirmation',
    extraTags: [
      { name: 'order_number', value: data.orderNumber },
      { name: 'locale', value: data.locale },
    ],
    react: React.createElement(OrderConfirmation, {
      locale: data.locale,
      messages,
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      items: data.items,
      subtotal: data.subtotal,
      discount: data.discount,
      total: data.total,
      paymentMethod: data.paymentMethod,
      shippingAddress: data.shippingAddress,
      orderUrl: buildOrderUrl(data.locale, data.orderNumber),
      siteUrl: SITE_URL,
      replyToEmail: EMAIL_REPLY_TO,
    }),
  });
}

export async function sendOrderShipped(data: {
  to: string;
  locale: string;
  customerName: string;
  orderNumber: string;
  carrier: Carrier;
  trackingNumber: string;
  trackingUrl: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  items: Array<{ name: string; quantity: number }>;
}): Promise<SendResult> {
  const messages = await loadEmailMessages(data.locale);
  const subject = interpolate(messages.orderShipped.subject, {
    orderNumber: data.orderNumber,
  });

  return send({
    to: data.to,
    subject,
    category: 'order_shipped',
    extraTags: [
      { name: 'order_number', value: data.orderNumber },
      { name: 'carrier', value: data.carrier },
      { name: 'locale', value: data.locale },
    ],
    react: React.createElement(OrderShipped, {
      locale: data.locale,
      messages,
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      trackingUrl: data.trackingUrl,
      deliveryMethod: data.deliveryMethod,
      deliveryAddress: data.deliveryAddress,
      estimatedDelivery: data.estimatedDelivery,
      items: data.items,
      orderUrl: buildOrderUrl(data.locale, data.orderNumber),
      siteUrl: SITE_URL,
      replyToEmail: EMAIL_REPLY_TO,
    }),
  });
}

export async function sendRefundConfirmation(data: {
  to: string;
  locale: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  reason?: string;
}): Promise<SendResult> {
  const messages = await loadEmailMessages(data.locale);
  const subject = interpolate(messages.refundConfirmation.subject, {
    orderNumber: data.orderNumber,
  });

  return send({
    to: data.to,
    subject,
    category: 'refund_confirmation',
    extraTags: [
      { name: 'order_number', value: data.orderNumber },
      { name: 'locale', value: data.locale },
    ],
    react: React.createElement(RefundConfirmation, {
      locale: data.locale,
      messages,
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      amount: data.amount,
      reason: data.reason,
      siteUrl: SITE_URL,
      replyToEmail: EMAIL_REPLY_TO,
    }),
  });
}

export async function sendAbandonedCart(data: {
  to: string;
  locale: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
  }>;
  cartTotal: number;
  cartUrl: string;
}): Promise<SendResult> {
  const messages = await loadEmailMessages(data.locale);

  return send({
    to: data.to,
    subject: messages.abandonedCart.subject,
    category: 'abandoned_cart',
    extraTags: [{ name: 'locale', value: data.locale }],
    react: React.createElement(AbandonedCart, {
      locale: data.locale,
      messages,
      customerName: data.customerName,
      items: data.items,
      cartTotal: data.cartTotal,
      cartUrl: data.cartUrl,
      siteUrl: SITE_URL,
      replyToEmail: EMAIL_REPLY_TO,
    }),
  });
}

export async function sendPrepaymentInvoice(data: {
  to: string;
  locale: string;
  customerName: string;
  orderNumber: string;
  items: OrderItemInput[];
  total: number;
  dueDate: string;
  orderId: string;
}): Promise<SendResult> {
  const messages = await loadEmailMessages(data.locale);
  const subject = interpolate(messages.prepaymentInvoice.subject, {
    orderNumber: data.orderNumber,
  });

  // Generate PDF attachment
  let pdfAttachment: { filename: string; content: Buffer } | undefined
  try {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, created_at, total, shipping_address, email, customer_name')
      .eq('id', data.orderId)
      .single()

    if (order) {
      const { generateInvoicePDF } = await import('@/lib/invoice-pdf')
      const pdfBytes = await generateInvoicePDF(
        {
          id: order.id,
          order_number: order.order_number,
          created_at: order.created_at,
          total: order.total,
          shipping_address: order.shipping_address as Record<string, string> | null ?? undefined,
        },
        data.items.map(it => ({ product_name: it.name, qty: it.quantity, price: it.unitPrice })),
        data.customerName,
        data.to,
        'prepayment',
      )
      pdfAttachment = {
        filename: `arve-${data.orderNumber}.pdf`,
        content: Buffer.from(pdfBytes),
      }
    }
  } catch (err) {
    console.error('[email] Failed to generate invoice PDF for attachment', err)
  }

  return send({
    to: data.to,
    subject,
    category: 'order_confirmation',
    attachments: pdfAttachment ? [pdfAttachment] : undefined,
    extraTags: [
      { name: 'order_number', value: data.orderNumber },
      { name: 'locale', value: data.locale },
    ],
    react: React.createElement(PrepaymentInvoice, {
      locale: data.locale,
      messages,
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      items: data.items,
      total: data.total,
      dueDate: data.dueDate,
      orderUrl: buildOrderUrl(data.locale, data.orderNumber),
      siteUrl: SITE_URL,
      replyToEmail: EMAIL_REPLY_TO,
    }),
  });
}

// ── Staatuse muutuse teavitus kliendile ──────────────────────────────────

interface StatusUpdateData {
  orderId: string
  newStatus: string
  note?: string
}

export async function sendOrderStatusUpdate({ orderId, newStatus, note }: StatusUpdateData): Promise<void> {
  // Check notification toggle
  const notifKey = `notify_${newStatus}`
  if (!(await isNotifEnabled(notifKey))) {
    console.log(`[email] Status update skipped — ${notifKey} disabled`)
    return
  }

  // Load order
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, email, customer_name, shipping_address, total, created_at, montonio_order_id')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    console.error('[email] Order not found for status update', orderId)
    return
  }

  const sa: Record<string, string> = order.shipping_address ?? {}
  let customerEmail: string | null = sa.customer_email ?? order.email ?? null
  let customerName: string | null = sa.full_name ?? sa.customer_name ?? order.customer_name ?? null
  const orderRef = (order.order_number ?? order.montonio_order_id ?? order.id).toString()

  if (!customerEmail) {
    console.warn(`[email] No customer email for order ${orderRef}, skipping status update`)
    return
  }

  // Check suppression
  if (await isSuppressed(customerEmail, 'order_delivered')) {
    console.log(`[email] Skipped suppressed address: ${customerEmail} (status update)`)
    return
  }

  const subject = `Tellimus #${orderRef} — ${statusSubject(newStatus)} — Pump OÜ`
  const html = buildStatusUpdateHtml({
    orderRef,
    customerName,
    newStatus,
    note,
  })

  try {
    const { data, error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: customerEmail,
      subject,
      html,
      tags: [
        { name: 'category', value: 'status_update' },
        { name: 'order_number', value: orderRef },
        { name: 'new_status', value: newStatus },
      ],
    })
    if (error) throw new Error(error.message)
    console.log(`[email] Sent status update (${newStatus}) → ${customerEmail} (id=${data?.id})`)
  } catch (err) {
    console.error(`[email] Status update failed (${newStatus} → ${customerEmail})`, err)
  }
}

// ── Uue tellimuse teavitus adminile ──────────────────────────────────────

export async function sendNewOrderAdmin(orderId: string): Promise<void> {
  // Load order with items
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, email, customer_name, shipping_address, total, created_at, montonio_order_id, order_items(product_name, quantity, unit_price)')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    console.error('[email] Order not found for admin notification', orderId)
    return
  }

  const sa: Record<string, string> = order.shipping_address ?? {}
  const customerEmail = sa.customer_email ?? order.email ?? null
  const customerName = sa.full_name ?? sa.customer_name ?? order.customer_name ?? null
  const orderRef = (order.order_number ?? order.montonio_order_id ?? order.id).toString()
  const adminEmailFromSettings = await getSetting('order_notification_email', '')
  const adminEmail = adminEmailFromSettings || process.env.ADMIN_NOTIFICATION_EMAIL || 'info@pumbapood.ee'

  const items = (order.order_items ?? []) as Array<{ product_name: string; quantity: number; unit_price: number }>

  const html = buildNewOrderAdminHtml({
    orderRef,
    order: { total: order.total, created_at: order.created_at },
    items,
    customerName,
    customerEmail,
    shippingAddress: sa,
  })

  try {
    const { data, error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: adminEmail,
      subject: `Uus tellimus #${orderRef}`,
      html,
      tags: [{ name: 'category', value: 'new_order_admin' }],
    })
    if (error) throw new Error(error.message)
    console.log(`[email] Sent admin notification #${orderRef} → ${adminEmail} (id=${data?.id})`)
  } catch (err) {
    console.error(`[email] Admin notification failed (#${orderRef})`, err)
  }
}