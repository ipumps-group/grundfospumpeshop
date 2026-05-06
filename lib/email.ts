import * as React from 'react';
import { getResend, EMAIL_FROM, EMAIL_REPLY_TO, SITE_URL } from './resend';
import { supabaseAdmin } from './supabase-admin';
import { loadEmailMessages, interpolate } from './email-i18n';
import OrderConfirmation from '@/emails/OrderConfirmation';
import OrderShipped from '@/emails/OrderShipped';
import RefundConfirmation from '@/emails/RefundConfirmation';
import AbandonedCart from '@/emails/AbandonedCart';
import type { Carrier, DeliveryMethod } from './carriers';

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
}

async function send({
  to,
  subject,
  react,
  category,
  extraTags = [],
  replyTo,
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