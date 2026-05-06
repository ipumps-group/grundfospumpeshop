import {
  Html, Head, Body, Container, Heading, Text, Section, Row, Column,
  Hr, Button, Preview,
} from '@react-email/components';
import type { EmailMessages } from '@/lib/email-i18n';
import { interpolate } from '@/lib/email-i18n';
import { CARRIER_DISPLAY_NAMES, type Carrier, type DeliveryMethod } from '@/lib/carriers';

export interface OrderShippedProps {
  locale: string;
  messages: EmailMessages;
  customerName: string;
  orderNumber: string;
  carrier: Carrier;
  trackingNumber: string;
  trackingUrl: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  items: Array<{ name: string; quantity: number }>;
  orderUrl: string;
  siteUrl: string;
  replyToEmail: string;
}

export default function OrderShipped({
  locale, messages, customerName, orderNumber,
  carrier, trackingNumber, trackingUrl, deliveryMethod,
  deliveryAddress, estimatedDelivery, items,
  orderUrl, siteUrl, replyToEmail,
}: OrderShippedProps) {
  const t = messages;
  const eta = estimatedDelivery ?? t.orderShipped.etaDefault;

  return (
    <Html lang={locale}>
      <Head />
      <Preview>
        {interpolate(t.orderShipped.preview, { orderNumber, trackingNumber })}
      </Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.header}>
            <Heading style={s.h1}>📦 {t.orderShipped.heading}</Heading>
          </Section>

          <Section style={s.content}>
            <Text style={s.greeting}>
              {interpolate(t.common.greeting, { name: customerName })}
            </Text>
            <Text
              style={s.paragraph}
              dangerouslySetInnerHTML={{
                __html: interpolate(t.orderShipped.intro, { orderNumber, eta }),
              }}
            />

            <Section style={s.trackingBox}>
              <Text style={s.trackingLabel}>{t.orderShipped.trackingLabel}</Text>
              <Text style={s.trackingNumber}>{trackingNumber}</Text>
              <Text style={s.trackingCarrier}>
                {CARRIER_DISPLAY_NAMES[carrier]} · {t.orderShipped.deliveryMethod[deliveryMethod]}
              </Text>
              {deliveryAddress && (
                <Text style={s.deliveryAddress}>📍 {deliveryAddress}</Text>
              )}
              <Button href={trackingUrl} style={s.trackButton}>
                {t.orderShipped.trackingButton}
              </Button>
            </Section>

            <Hr style={s.hr} />

            <Heading as="h2" style={s.h2}>
              {t.orderShipped.itemsHeading}
            </Heading>
            <Section>
              {items.map((item, i) => (
                <Row key={i} style={s.itemRow}>
                  <Column style={s.itemName}>{item.name}</Column>
                  <Column align="right" style={s.itemQty}>
                    × {item.quantity}
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr style={s.hr} />

            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={orderUrl} style={s.secondaryButton}>
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
  paragraphSmall: { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '16px 0 0' },
  hr: { borderColor: '#e6e6e6', margin: '24px 0' },
  h2: { fontSize: '16px', color: '#003366', margin: '16px 0 8px', fontWeight: 'bold' as const },
  trackingBox: { backgroundColor: '#f8fafc', border: '2px solid #003366', borderRadius: '8px', padding: '24px', textAlign: 'center' as const, margin: '24px 0' },
  trackingLabel: { fontSize: '11px', letterSpacing: '1px', color: '#64748b', margin: 0 },
  trackingNumber: { fontSize: '22px', fontWeight: 'bold' as const, color: '#003366', margin: '8px 0', fontFamily: 'monospace' },
  trackingCarrier: { fontSize: '14px', color: '#64748b', margin: '4px 0' },
  deliveryAddress: { fontSize: '14px', color: '#333', margin: '8px 0' },
  trackButton: { backgroundColor: '#003366', color: '#ffffff', padding: '12px 28px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px', fontWeight: 'bold' as const, fontSize: '14px' },
  secondaryButton: { backgroundColor: '#ffffff', color: '#003366', border: '2px solid #003366', padding: '10px 24px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold' as const, fontSize: '13px' },
  itemRow: { padding: '6px 0' },
  itemName: { fontSize: '14px', color: '#333' },
  itemQty: { fontSize: '14px', color: '#64748b' },
  footer: { backgroundColor: '#f8fafc', padding: '20px', textAlign: 'center' as const },
  footerText: { fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-line' as const },
};