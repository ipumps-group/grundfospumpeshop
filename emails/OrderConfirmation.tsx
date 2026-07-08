import {
  Html, Head, Body, Container, Heading, Text, Section, Row, Column,
  Hr, Button, Preview,
} from '@react-email/components';
import type { EmailMessages } from '@/lib/email-i18n';
import { interpolate } from '@/lib/email-i18n';

export interface OrderConfirmationProps {
  locale: string;
  messages: EmailMessages;
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  shippingAddress: string;
  orderUrl: string;
  siteUrl: string;
  replyToEmail: string;
}

const formatPrice = (n: number) =>
  n.toFixed(2).replace('.', ',') + ' €';

export default function OrderConfirmation({
  locale, messages, customerName, orderNumber, items,
  subtotal, discount, total, paymentMethod, shippingAddress,
  orderUrl, siteUrl, replyToEmail,
}: OrderConfirmationProps) {
  const t = messages;

  return (
    <Html lang={locale}>
      <Head />
      <Preview>
        {interpolate(t.orderConfirmation.preview, {
          orderNumber,
          total: formatPrice(total),
        })}
      </Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.header}>
            <Heading style={s.h1}>{t.orderConfirmation.heading}</Heading>
          </Section>

          <Section style={s.content}>
            <Text style={s.greeting}>
              {interpolate(t.common.greeting, { name: customerName })}
            </Text>
            <Text
              style={s.paragraph}
              dangerouslySetInnerHTML={{
                __html: interpolate(t.orderConfirmation.intro, { orderNumber }),
              }}
            />

            <Hr style={s.hr} />

            <Heading as="h2" style={s.h2}>
              {t.orderConfirmation.itemsHeading}
            </Heading>
            <Section style={s.itemsBox}>
              {items.map((item, i) => (
                <Row key={i} style={s.itemRow}>
                  <Column style={s.itemName}>
                    {item.name}
                    <Text style={s.itemMeta}>
                      {item.quantity} {t.common.quantity} × {formatPrice(item.unitPrice)}
                    </Text>
                  </Column>
                  <Column align="right" style={s.itemTotal}>
                    {formatPrice(item.quantity * item.unitPrice)}
                  </Column>
                </Row>
              ))}
            </Section>

            <Section style={{ marginTop: '16px' }}>
              <Row style={s.summaryRow}>
                <Column style={s.summaryLabel}>{t.common.subtotal}</Column>
                <Column align="right" style={s.summaryValue}>
                  {formatPrice(subtotal)}
                </Column>
              </Row>
              {discount > 0 && (
                <Row style={s.summaryRow}>
                  <Column style={s.summaryLabel}>{t.common.discount}</Column>
                  <Column align="right" style={s.summaryValue}>
                    −{formatPrice(discount)}
                  </Column>
                </Row>
              )}
            </Section>

            <Hr style={s.hr} />

            <Row style={s.totalRow}>
              <Column style={s.totalLabel}>{t.common.total}</Column>
              <Column align="right" style={s.totalValue}>
                {formatPrice(total)}
              </Column>
            </Row>

            {paymentMethod && (
              <Text style={s.metaText}>
                <strong>{t.orderConfirmation.paymentMethod}:</strong> {paymentMethod}
              </Text>
            )}

            <Hr style={s.hr} />

            <Heading as="h2" style={s.h2}>
              {t.orderConfirmation.shippingHeading}
            </Heading>
            <Text style={{ ...s.paragraph, whiteSpace: 'pre-line' }}>
              {shippingAddress}
            </Text>
            <Text style={s.paragraphSmall}>
              {t.orderConfirmation.shippingNote}
            </Text>

            {t.orderConfirmation.invoiceAttached && (
              <Text style={s.invoiceNote}>
                {t.orderConfirmation.invoiceAttached}
              </Text>
            )}

            <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
              <Button href={orderUrl} style={s.button}>
                {t.common.viewOrder}
              </Button>
            </Section>

            <Text style={s.paragraphSmall}>
              {interpolate(t.common.questions, { email: replyToEmail })}
            </Text>
          </Section>

          <Section style={s.footer}>
            <Text style={s.footerText}>
              {interpolate(t.common.footer, {
                site: siteUrl.replace(/^https?:\/\//, ''),
              })}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const s = {
  body: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif', backgroundColor: '#f4f4f7', margin: 0, padding: '20px 0' },
  container: { backgroundColor: '#ffffff', maxWidth: '600px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden' as const },
  header: { backgroundColor: '#003366', padding: '32px', textAlign: 'center' as const },
  h1: { color: '#ffffff', fontSize: '24px', margin: 0, fontWeight: 'bold' as const },
  content: { padding: '32px' },
  greeting: { fontSize: '16px', color: '#003366', marginBottom: '8px', fontWeight: 'bold' as const },
  paragraph: { fontSize: '15px', color: '#333', lineHeight: '1.6', margin: '8px 0' },
  paragraphSmall: { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '8px 0' },
  invoiceNote: { fontSize: '14px', color: '#003366', fontWeight: 'bold' as const, margin: '16px 0 0', padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '6px', textAlign: 'center' as const },
  metaText: { fontSize: '14px', color: '#555', margin: '12px 0' },
  hr: { borderColor: '#e6e6e6', margin: '24px 0' },
  h2: { fontSize: '16px', color: '#003366', margin: '16px 0 12px', fontWeight: 'bold' as const },
  itemsBox: { backgroundColor: '#f8fafc', borderRadius: '6px', padding: '16px' },
  itemRow: { padding: '8px 0', borderBottom: '1px solid #e6e6e6' },
  itemName: { fontSize: '14px', color: '#333', fontWeight: 'bold' as const, verticalAlign: 'top' as const },
  itemMeta: { fontSize: '12px', color: '#64748b', fontWeight: 'normal' as const, margin: '2px 0 0' },
  itemTotal: { fontSize: '14px', color: '#333', verticalAlign: 'top' as const },
  summaryRow: { padding: '4px 0' },
  summaryLabel: { fontSize: '14px', color: '#64748b' },
  summaryValue: { fontSize: '14px', color: '#64748b' },
  totalRow: { padding: '8px 0' },
  totalLabel: { fontSize: '16px', color: '#003366', fontWeight: 'bold' as const },
  totalValue: { fontSize: '18px', color: '#003366', fontWeight: 'bold' as const },
  button: { backgroundColor: '#003366', color: '#ffffff', padding: '14px 32px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold' as const, fontSize: '14px' },
  footer: { backgroundColor: '#f8fafc', padding: '20px', textAlign: 'center' as const },
  footerText: { fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-line' as const },
};