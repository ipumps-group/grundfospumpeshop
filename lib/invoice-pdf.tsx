import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  company: { fontSize: 9, color: '#666', lineHeight: 1.6 },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#003366', marginBottom: 4 },
  invoiceTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#003366', textAlign: 'right' },
  invoiceMeta: { fontSize: 9, color: '#666', textAlign: 'right', lineHeight: 1.6, marginTop: 4 },
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
  clientName: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginBottom: 2 },
})

interface InvoiceOrder {
  id: string
  created_at: string
  total: number
  subtotal?: number
  vat?: number
  reference?: string | null
  shipping_name?: string | null
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
}

function fmt(n: number) {
  return n.toFixed(2) + ' €'
}

export function InvoicePDF({ order, items, customerName, customerEmail }: InvoiceProps) {
  const invoiceNr = `INV-${order.id.slice(0, 8).toUpperCase()}`
  const date = new Date(order.created_at).toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const subtotal = order.subtotal ?? order.total / 1.22
  const vat = order.vat ?? order.total - subtotal

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Päis */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>iPumps OÜ</Text>
            <Text style={styles.company}>
              Reg: 12345678{'\n'}
              KMKR: EE123456789{'\n'}
              info@ipumps.ee{'\n'}
              ipumps.ee
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>ARVE</Text>
            <Text style={styles.invoiceMeta}>
              {invoiceNr}{'\n'}
              Kuupäev: {date}
            </Text>
          </View>
        </View>

        {/* Klient */}
        {(customerName || customerEmail) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Arve saaja</Text>
            {customerName && <Text style={styles.clientName}>{customerName}</Text>}
            {customerEmail && <Text style={styles.clientInfo}>{customerEmail}</Text>}
            {order.shipping_name && <Text style={[styles.clientInfo, { color: '#666', marginTop: 2 }]}>Saaja: {order.shipping_name}</Text>}
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
        <Text style={styles.footer}>Täname ostu eest! · iPumps.ee · info@ipumps.ee</Text>
      </Page>
    </Document>
  )
}

export async function generateInvoicePDF(order: InvoiceOrder, items: InvoiceItem[], customerName?: string, customerEmail?: string): Promise<Uint8Array> {
  const { renderToBuffer } = await import('@react-pdf/renderer')
  const buf = await (renderToBuffer(
    <InvoicePDF order={order} items={items} customerName={customerName} customerEmail={customerEmail} />
  ) as unknown as Promise<Buffer>)
  return new Uint8Array(buf)
}
