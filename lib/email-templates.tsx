// E-kirja HTML templateid — tagastavad HTML stringid Resendile saatmiseks

const PRIMARY = '#003366'
const LIGHT_BG = '#f8fafc'

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="et">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:${LIGHT_BG};font-family:Arial,Helvetica,sans-serif;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT_BG};padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:${PRIMARY};padding:28px 32px;">
            <div style="color:#fff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">iPumps</div>
            <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:2px;">Grundfos pumbad Eestis</div>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:13px;color:#64748b;">
              iPumps — <a href="https://ipumps.ee" style="color:${PRIMARY};">ipumps.ee</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending:    'Ootel',
    paid:       'Makstud',
    processing: 'Töötlemisel',
    shipped:    'Saadetud',
    delivered:  'Kohale toimetatud',
    cancelled:  'Tühistatud',
    failed:     'Ebaõnnestunud',
  }
  return map[status] ?? status
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending:    '#94a3b8',
    paid:       '#16a34a',
    processing: '#2563eb',
    shipped:    '#d97706',
    delivered:  '#16a34a',
    cancelled:  '#dc2626',
    failed:     '#dc2626',
  }
  return map[status] ?? '#94a3b8'
}

// ─── Tellimuse kinnitus kliendile ─────────────────────────────────────────────

interface OrderConfirmationData {
  orderRef: string
  customerName: string | null
  customerEmail?: string
  order: {
    total: number
    created_at: string
    shipping_address: Record<string, string> | null
  }
  items: Array<{ product_name: string; quantity: number; unit_price: number }>
  companyName: string
}

export function buildOrderConfirmationHtml(d: OrderConfirmationData): string {
  const sa = d.order.shipping_address ?? {}
  const subtotal = d.items.reduce((s, item) => s + item.quantity * item.unit_price, 0)
  const total = Number(d.order.total)
  const vat = Number((total - subtotal).toFixed(2))
  
  const orderUrl = `https://pumbapood.ee/tellimus/${d.orderRef}${d.customerEmail ? `?email=${encodeURIComponent(d.customerEmail)}` : ''}`

  const itemsHtml = d.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:15px;">${item.product_name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:15px;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:15px;text-align:right;">${(item.quantity * item.unit_price).toFixed(2)} €</td>
    </tr>`).join('')

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#1a202c;">Tellimus vastu võetud! ✓</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;">
      Tere${d.customerName ? `, <strong>${d.customerName}</strong>` : ''}! Teie tellimus on edukalt registreeritud.
    </p>

    <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:13px;color:#64748b;margin-bottom:4px;">Tellimuse number</div>
      <div style="font-size:18px;font-weight:bold;color:${PRIMARY};">#${d.orderRef}</div>
      <div style="font-size:13px;color:#64748b;margin-top:4px;">${new Date(d.order.created_at).toLocaleDateString('et-EE', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>

    <h3 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a202c;">Tellitud tooted</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr style="background:#f8fafc;">
        <th style="padding:8px 0;font-size:13px;font-weight:600;color:#64748b;text-align:left;">Toode</th>
        <th style="padding:8px 0;font-size:13px;font-weight:600;color:#64748b;text-align:center;">Kogus</th>
        <th style="padding:8px 0;font-size:13px;font-weight:600;color:#64748b;text-align:right;">Summa</th>
      </tr>
      ${itemsHtml}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;font-size:14px;color:#64748b;">Vahesumma (km-ta)</td>
        <td style="padding:4px 0;font-size:14px;text-align:right;">${subtotal.toFixed(2)} €</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:14px;color:#64748b;">Käibemaks 24%</td>
        <td style="padding:4px 0;font-size:14px;text-align:right;">${vat.toFixed(2)} €</td>
      </tr>
      <tr style="border-top:2px solid #f1f5f9;">
        <td style="padding:12px 0 4px;font-size:17px;font-weight:bold;color:#1a202c;">Kokku</td>
        <td style="padding:12px 0 4px;font-size:17px;font-weight:bold;text-align:right;color:${PRIMARY};">${d.order.total.toFixed(2)} €</td>
      </tr>
    </table>

    ${(sa.carrier_name || sa.pickup_name) ? `
    <div style="background:#eff6ff;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:13px;font-weight:600;color:${PRIMARY};margin-bottom:6px;">📦 Tarneinfo</div>
      ${sa.carrier_name ? `<div style="font-size:14px;font-weight:600;">${sa.carrier_name}: ${sa.pickup_name || ''}</div>` : ''}
      ${sa.pickup_address ? `<div style="font-size:13px;color:#64748b;">${sa.pickup_address}, ${sa.pickup_city || ''} ${sa.pickup_postal || ''}</div>` : ''}
    </div>` : ''}

    <div style="margin:24px 0;">
      <a href="${orderUrl}" style="display:inline-block;background:${PRIMARY};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Vaata tellimust</a>
    </div>

    <p style="margin:0;font-size:14px;color:#64748b;">
      Küsimuste korral võtke ühendust: <a href="mailto:info@pumbapood.ee" style="color:${PRIMARY};">info@pumbapood.ee</a>
    </p>`

  return layout(content)
}

// ─── Staatuse muutuse teavitus kliendile ──────────────────────────────────────

interface StatusUpdateData {
  orderRef: string
  customerName: string | null
  newStatus: string
  note?: string
}

export function buildStatusUpdateHtml(d: StatusUpdateData): string {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#1a202c;">Tellimuse staatus on uuendatud</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;">
      Tere${d.customerName ? `, <strong>${d.customerName}</strong>` : ''}!
    </p>

    <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:13px;color:#64748b;margin-bottom:4px;">Tellimuse number</div>
      <div style="font-size:17px;font-weight:bold;color:#1a202c;">#${d.orderRef}</div>
    </div>

    <div style="margin-bottom:24px;">
      <div style="font-size:13px;color:#64748b;margin-bottom:8px;">Uus staatus</div>
      <span style="display:inline-block;background:${statusColor(d.newStatus)}22;color:${statusColor(d.newStatus)};padding:6px 14px;border-radius:20px;font-size:15px;font-weight:600;">
        ${statusLabel(d.newStatus)}
      </span>
    </div>

    ${d.note ? `
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <div style="font-size:13px;font-weight:600;color:#92400e;margin-bottom:4px;">Märkus</div>
      <div style="font-size:15px;color:#78350f;">${d.note}</div>
    </div>` : ''}

    <p style="margin:0;font-size:14px;color:#64748b;">
      Küsimuste korral võtke ühendust: <a href="mailto:info@ipumps.ee" style="color:${PRIMARY};">info@ipumps.ee</a>
    </p>`

  return layout(content)
}

// ─── Uue tellimuse teavitus adminile ─────────────────────────────────────────

interface NewOrderAdminData {
  orderRef: string
  order: { total: number; created_at: string }
  items: Array<{ product_name: string; quantity: number; unit_price: number }>
  customerName: string | null
  customerEmail: string | null
  customerPhone?: string | null
  shippingAddress?: Record<string, string> | null
}

export function buildNewOrderAdminHtml(d: NewOrderAdminData): string {
  const itemsHtml = d.items.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;">${item.product_name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:right;">${(item.quantity * item.unit_price).toFixed(2)} €</td>
    </tr>`).join('')

  const sa = d.shippingAddress ?? {}

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#1a202c;">🛒 Uus tellimus saabunud</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;">
      ${new Date(d.order.created_at).toLocaleString('et-EE')}
    </p>

    <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:13px;color:#64748b;margin-bottom:4px;">Tellimuse number</div>
      <div style="font-size:18px;font-weight:bold;color:${PRIMARY};">#${d.orderRef}</div>
    </div>

    <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:13px;font-weight:600;color:#64748b;margin-bottom:8px;">Kliendi andmed</div>
      ${d.customerName ? `<div style="font-size:15px;font-weight:600;">${d.customerName}</div>` : ''}
      ${d.customerEmail ? `<div style="font-size:14px;color:#64748b;">${d.customerEmail}</div>` : ''}
      ${sa.customer_phone ? `<div style="font-size:14px;color:#64748b;">${sa.customer_phone}</div>` : ''}
      ${sa.company ? `<div style="font-size:14px;color:#64748b;">${sa.company}</div>` : ''}
    </div>

    <h3 style="margin:0 0 10px;font-size:15px;font-weight:600;">Tellitud tooted</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itemsHtml}
    </table>

    <div style="text-align:right;font-size:17px;font-weight:bold;color:${PRIMARY};margin-bottom:24px;">
      Kokku: ${d.order.total.toFixed(2)} €
    </div>

    ${(sa.carrier_name || sa.pickup_name) ? `
    <div style="font-size:13px;color:#64748b;margin-bottom:4px;">Tarne</div>
    <div style="font-size:14px;">${sa.carrier_name}: ${sa.pickup_name || ''}</div>
    <div style="font-size:13px;color:#64748b;">${sa.pickup_address || ''}, ${sa.pickup_city || ''}</div>` : ''}`

  return layout(content)
}
