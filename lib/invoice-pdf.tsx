import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { COMPANY } from '@/lib/config'

let LOGO_DATA_URI: string | undefined

async function getLogoDataUri(): Promise<string | undefined> {
  if (LOGO_DATA_URI) return LOGO_DATA_URI
  try {
    const { readFile } = await import('fs/promises')
    const { join } = await import('path')
    const pngPath = join(process.cwd(), 'public', 'PumbapoodLogoBlack.png')
    const pngContent = await readFile(pngPath)
    LOGO_DATA_URI = `data:image/png;base64,${pngContent.toString('base64')}`
    return LOGO_DATA_URI
  } catch {
    return undefined
  }
}

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, alignItems: 'flex-start' },
  logo: { width: 121, marginBottom: 8, marginLeft: -10, alignSelf: 'flex-start' },
  companyDetails: { fontSize: 9, color: '#555', lineHeight: 1.6 },
  companyName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#003366', marginBottom: 2 },
  rightCol: { alignItems: 'flex-end' },
  invoiceTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#003366', textAlign: 'right' },
  invoiceMeta: { fontSize: 9, color: '#555', textAlign: 'right', lineHeight: 1.6, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#666', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, borderBottom: '1pt solid #e5e7eb', paddingBottom: 4 },
  row: { flexDirection: 'row' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#003366', padding: '6 8', borderRadius: 4, marginBottom: 2 },
  tableHeaderText: { color: '#fff', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', padding: '6 8', borderBottom: '0.5pt solid #f0f0f0' },
  tableRowAlt: { flexDirection: 'row', padding: '6 8', borderBottom: '0.5pt solid #f0f0f0', backgroundColor: '#f9fafb' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  totalsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  totalsLabel: { width: 120, textAlign: 'right', color: '#666', paddingRight: 8 },
  totalsValue: { width: 80, textAlign: 'right' },
  totalsBold: { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  totalLine: { borderTop: '1pt solid #003366', paddingTop: 4, marginTop: 2 },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, borderTop: '0.5pt solid #e5e7eb', paddingTop: 8, fontSize: 9, color: '#999', textAlign: 'center' },
  clientInfo: { fontSize: 10, lineHeight: 1.6 },
})

interface InvoiceOrder {
  id: string
  order_number?: string | number | null
  created_at: string
  total: number
  subtotal?: number
  vat?: number
  reference?: string | null
  shipping_name?: string | null
  shipping_address?: Record<string, string> | null
}

interface InvoiceItem {
  product_name: string
  sku?: string | null
  qty: number
  price: number
}

interface InvoiceProps {
  order: InvoiceOrder
  items: InvoiceItem[]
  customerName?: string
  customerEmail?: string
  invoiceType?: 'regular' | 'prepayment'
  logoDataUri?: string
}

function fmt(n: number) {
  return n.toFixed(2) + ' \u20AC'
}

function mapCountry(code: string): string {
  const map: Record<string, string> = {
    EE: 'Eesti',
    LV: 'Läti',
    LT: 'Leedu',
    FI: 'Soome',
    PL: 'Poola',
  }
  return map[code] || code
}

export function InvoicePDF({ order, items, customerName, customerEmail, invoiceType = 'regular', logoDataUri }: InvoiceProps) {
  const invoiceNr = order.order_number ? `INV-${order.order_number}` : `INV-${order.id.slice(0, 8).toUpperCase()}`
  const date = new Date(order.created_at).toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const subtotal = order.subtotal ?? items.reduce((s, it) => s + it.qty * it.price, 0)
  const vat = order.vat ?? order.total - subtotal
  const dueDate = new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const sa = order.shipping_address ?? {} as Record<string, string>

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Päis */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {logoDataUri && <Image src={logoDataUri} style={styles.logo} />}
            <Text style={styles.companyName}>{COMPANY.legalName}</Text>
            <Text style={styles.companyDetails}>
              Reg: {COMPANY.regNr}{'\n'}
              KMKR: {COMPANY.vatId}{'\n'}
              {COMPANY.shopAddress.street}, {COMPANY.shopAddress.locality}{'\n'}
              {COMPANY.shopAddress.postalCode} {COMPANY.shopAddress.region}{'\n'}
              info@pumbapood.ee{'\n'}
              www.pumbapood.ee
            </Text>
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.invoiceTitle}>{invoiceType === 'prepayment' ? 'ETTEMAKSU ARVE' : 'ARVE'}</Text>
            <Text style={styles.invoiceMeta}>
              {invoiceNr}{'\n'}
              IBAN: {COMPANY.bankAccount}{'\n'}
              Kuupäev: {date}{'\n'}
              {COMPANY.bankName}
              {invoiceType === 'prepayment' && `\n\nMaksetähtaeg: ${dueDate}`}
            </Text>
          </View>
        </View>

        {/* Klient */}
        {(customerName || customerEmail || sa.company) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Arve saaja</Text>
            {customerName && (
              <Text style={styles.clientInfo}>
                Nimi: {customerName}
              </Text>
            )}
            {sa.company && (
              <>
                <Text style={styles.clientInfo}>
                  Ettevõtte nimi: {sa.company}
                </Text>
                {(sa.company_street || sa.company_city) && (
                  <Text style={styles.clientInfo}>
                    Ettevõtte aadress: {[
                      sa.company_street,
                      sa.company_postal,
                      sa.company_city,
                      sa.company_county,
                      sa.company_country ? mapCountry(sa.company_country) : '',
                    ].filter(Boolean).join(', ')}
                  </Text>
                )}
              </>
            )}
            {customerEmail && (
              <Text style={styles.clientInfo}>
                {customerEmail}
              </Text>
            )}
          </View>
        )}

        {/* Tarneaadress (kui erineb ettevõtte aadressist) */}
        {sa.delivery_address_differs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tarneaadress</Text>
            <Text style={styles.clientInfo}>
              {sa.carrier_name && `${sa.carrier_name}\n`}
              {sa.street && `${sa.street}\n`}
              {sa.city && `${sa.postal_code ? sa.postal_code + ' ' : ''}${sa.city}\n`}
              {sa.country && mapCountry(sa.country)}
            </Text>
          </View>
        )}

        {/* Tarneaadress (tavaline, kui pole ettevõtet) */}
        {!sa.company && (sa.street || sa.pickup_name) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tarneaadress</Text>
            <Text style={styles.clientInfo}>
              {sa.carrier_name && `${sa.carrier_name}\n`}
              {sa.pickup_name && `${sa.pickup_name}\n`}
              {sa.pickup_address && `${sa.pickup_address}\n`}
              {sa.street && `${sa.street}\n`}
              {sa.city && `${sa.postal_code ? sa.postal_code + ' ' : ''}${sa.city}\n`}
              {sa.pickup_city && `${sa.pickup_postal ? sa.pickup_postal + ' ' : ''}${sa.pickup_city}\n`}
              {sa.country && mapCountry(sa.country)}
            </Text>
          </View>
        )}

        {/* Tooted */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tellimuse sisu</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Nimetus</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Kogus</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Ühikuhind</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Summa</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <View style={styles.col1}>
                <Text>{item.product_name}</Text>
                {item.sku && <Text style={{ color: '#999', fontSize: 8 }}>SKU: {item.sku}</Text>}
              </View>
              <Text style={styles.col2}>{item.qty}</Text>
              <Text style={styles.col3}>{fmt(item.price)}</Text>
              <Text style={styles.col4}>{fmt(item.qty * item.price)}</Text>
            </View>
          ))}
        </View>

        {/* Totaalid */}
        <View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Vahesumma (ilma KM):</Text>
            <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>KM 24%:</Text>
            <Text style={styles.totalsValue}>{fmt(vat)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.totalLine]}>
            <Text style={[styles.totalsLabel, styles.totalsBold]}>Kokku:</Text>
            <Text style={[styles.totalsValue, styles.totalsBold]}>{fmt(order.total)}</Text>
          </View>
        </View>

        {/* Jalus */}
        <Text style={styles.footer}>{COMPANY.legalName} · {COMPANY.bankAccount} · {COMPANY.bankName}</Text>
      </Page>
    </Document>
  )
}

export async function generateInvoicePDF(
  order: InvoiceOrder,
  items: InvoiceItem[],
  customerName?: string,
  customerEmail?: string,
  invoiceType?: 'regular' | 'prepayment',
): Promise<Uint8Array> {
  const logoDataUri = await getLogoDataUri()

  const { renderToBuffer } = await import('@react-pdf/renderer')
  const buf = await (renderToBuffer(
    <InvoicePDF order={order} items={items} customerName={customerName} customerEmail={customerEmail} invoiceType={invoiceType} logoDataUri={logoDataUri} />
  ) as unknown as Promise<Buffer>)
  return new Uint8Array(buf)
}
