/**
 * @deprecated Use lib/email.ts instead — this file is no longer in use.
 * Kept temporarily for reference. All callers migrated to sendOrderStatusUpdate(),
 * sendNewOrderAdmin() etc. in lib/email.ts.
 */

import { supabaseAdmin } from './supabase-admin'
import { getResend } from './resend'
import {
  buildOrderConfirmationHtml,
  buildStatusUpdateHtml,
  buildNewOrderAdminHtml,
  statusSubject,
} from './email-templates'
import { COMPANY } from './config'

type EmailType = 'orderConfirmation' | 'statusUpdate' | 'newOrderAdmin'

interface StatusUpdateOptions {
  newStatus: string
  note?: string
}

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

async function isNotifEnabled(key: string): Promise<boolean> {
  const val = await getSetting(key, 'true')
  return val !== 'false' && val !== '0'
}

export async function sendOrderEmail(
  orderId: string,
  type: EmailType,
  options?: StatusUpdateOptions,
): Promise<void> {
const logEntry: Record<string, unknown> = { order_id: orderId, type }

  try {
    // Load order with items using raw fetch (avoids Supabase client hanging)
    let order: any = null
    let orderErr: any = null
    
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const orderUrl = `${sbUrl}/rest/v1/orders?id=eq.${orderId}&select=*`
     
    const res = await fetch(orderUrl, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      }
    })
    const data = await res.json()
    order = data?.[0]
    if (!res.ok) orderErr = new Error(res.statusText)

    if (orderErr || !order) {
      throw new Error(`Order not found: ${orderErr?.message}`)
    }
    
    console.log('[sendOrderEmail] Order found, id:', order.id)

    const sa: Record<string, string> = order.shipping_address ?? {}
    console.log('[sendOrderEmail] order loaded, shipping_address:', JSON.stringify(sa))

    // Resolve customer email and name
    let customerEmail: string | null = sa.customer_email ?? null
    console.log('[sendOrderEmail] customerEmail from sa:', customerEmail)
    let customerName: string | null =
      sa.full_name ?? sa.customer_name ?? null

    if (order.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', order.user_id)
        .single()
      if (profile) {
        customerEmail ??= profile.email
        customerName  ??= profile.full_name
      }
    }

    const orderRef = (order.montonio_order_id ?? order.id).toString().slice(-8).toUpperCase()
    const items = (order.order_items ?? []) as Array<{
      product_name: string
      quantity: number
      unit_price: number
    }>

    // Hardcoded for now to test
    const fromName = COMPANY.legalName
    const fromAddress = 'info@pumbapood.ee'
    const adminEmail = 'info@pumbapood.ee'
    const from = `${fromName} <${fromAddress}>`
    console.log('[sendOrderEmail] Settings loaded - from:', from, 'adminEmail:', adminEmail)

    if (type === 'orderConfirmation') {
      if (!(await isNotifEnabled('notif_order_confirmation'))) return
      if (!customerEmail) throw new Error('No customer email')

      const html = buildOrderConfirmationHtml({
        orderRef,
        customerName,
        customerEmail,
        order: {
          total: order.total,
          created_at: order.created_at,
          shipping_address: sa,
        },
        items,
        companyName: fromName,
      })

      const { data, error } = await getResend().emails.send({
        from,
        to: customerEmail,
        subject: `Tellimus #${orderRef} vastu võetud — Pump OÜ`,
        html,
      })

      if (error) throw new Error(error.message)
      logEntry.status = 'sent'
      logEntry.recipient = customerEmail
      logEntry.resend_id = (data as { id?: string })?.id

    } else if (type === 'statusUpdate') {
      if (!customerEmail) throw new Error('No customer email')
      if (!options?.newStatus) throw new Error('newStatus required')

      // Check per-status notification setting
      const notifKey = `notify_${options.newStatus}`
      const notifEnabled = await isNotifEnabled(notifKey)
      console.log('[sendOrderEmail] statusUpdate - status:', options.newStatus, 'key:', notifKey, 'enabled:', notifEnabled)
      if (!notifEnabled) {
        console.log('[sendOrderEmail] NOTIF DISABLED for', options.newStatus, '- returning early')
        return
      }

      const subject = `Tellimus #${orderRef} — ${statusSubject(options.newStatus)} — Pump OÜ`

      console.log('[sendOrderEmail] Building HTML for statusUpdate')
      const html = buildStatusUpdateHtml({
        orderRef,
        customerName,
        newStatus: options.newStatus,
        note: options.note,
      })

      console.log('[sendOrderEmail] Sending via Resend, to:', customerEmail, 'from:', from)
      const { data, error } = await getResend().emails.send({
        from,
        to: customerEmail,
        subject,
        html,
      })
      
      console.log('[sendOrderEmail] Resend result:', { error, data })

      if (error) throw new Error(error.message)
      logEntry.status = 'sent'
      logEntry.recipient = customerEmail
      logEntry.resend_id = (data as { id?: string })?.id

    } else if (type === 'newOrderAdmin') {
      const html = buildNewOrderAdminHtml({
        orderRef,
        order: { total: order.total, created_at: order.created_at },
        items,
        customerName,
        customerEmail,
        shippingAddress: sa,
      })

      const { data, error } = await getResend().emails.send({
        from,
        to: adminEmail,
        subject: `Uus tellimus #${orderRef}`,
        html,
      })

      if (error) throw new Error(error.message)
      logEntry.status = 'sent'
      logEntry.recipient = adminEmail
      logEntry.resend_id = (data as { id?: string })?.id
    }

  } catch (err) {
    logEntry.status = 'error'
    logEntry.error = err instanceof Error ? err.message : String(err)
    console.error('[sendOrderEmail]', type, orderId, logEntry.error)
  } finally {
    // Log regardless of success/failure (silent fail)
    try { 
      await supabaseAdmin.from('email_logs').insert(logEntry)
    } catch { /* table may not exist */ }
  }
}
