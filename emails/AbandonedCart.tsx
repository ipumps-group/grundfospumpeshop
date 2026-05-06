import {
  Html, Head, Body, Container, Heading, Text, Section, Row, Column,
  Hr, Button, Preview,
} from '@react-email/components';
import type { EmailMessages } from '@/lib/email-i18n';
import { interpolate } from '@/lib/email-i18n';

export interface AbandonedCartProps {
  locale: string;
  messages: EmailMessages;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
  }>;
  cartTotal: number;
  cartUrl: string;
  siteUrl: string;
  replyToEmail: string;
}

const formatPrice = (n: number) =>
  n.toFixed(2).replace('.', ',') + ' €';

export default function AbandonedCart({
  locale, messages, customerName, items, cartTotal,
  cartUrl, siteUrl, replyToEmail,
}: AbandonedCartProps) {
  const t = messages;
  const greetingName = customerName ?? '';

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.abandonedCart.preview}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.header}>
            <Heading style={s.h1}>🛒 {t.abandonedCart.heading}</Heading>
          </Section>

          <Section style={s.content}>
            {greetingName && (
              <Text style={s.greeting}>
                {interpolate(t.common.greeting, { name: greetingName })}
              </Text>
            )}
            <Text style={s.paragraph}>{t.abandonedCart.intro}</Text>

            <Hr style={s.hr} />

            <Heading as="h2" style={s.h2}>
              {t.abandonedCart.itemsHeading}
            </Heading>
            <Section style={s.itemsBox}>
              {items.map((item, i) => (
                <Row key={i} style={s.itemRow}>
                  {item.imageUrl && (
                    <Column style={s.itemImageCol}>
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        width={56}
                        height={56}
                        style={s.itemImage}
                      />
                    </Column>
                  )}
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

            <Row style={s.totalRow}>
              <Column style={s.totalLabel}>{t.common.total}</Column>
              <Column align="right" style={s.totalValue}>
                {formatPrice(cartTotal)}
              </Column>
            </Row>

            <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
              <Button href={cartUrl} style={s.button}>
                {t.abandonedCart.returnButton}
              </Button>
            </Section>

            <Text style={s.paragraphSmall}>
              {t.abandonedCart.footerNote}
            </Text>

            <Hr style={s.hr} />

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
  paragraphSmall: { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '12px 0' },
  hr: { borderColor: '#e6e6e6', margin: '24px 0' },
  h2: { fontSize: '16px', color: '#003366', margin: '16px 0 12px', fontWeight: 'bold' as const },
  itemsBox: { backgroundColor: '#f8fafc', borderRadius: '6px', padding: '16px' },
  itemRow: { padding: '10px 0', borderBottom: '1px solid #e6e6e6' },
  itemImageCol: { width: '72px', verticalAlign: 'top' as const },
  itemImage: { borderRadius: '4px', display: 'block', border: '1px solid #e6e6e6' },
  itemName: { fontSize: '14px', color: '#333', fontWeight: 'bold' as const, verticalAlign: 'top' as const, paddingLeft: '12px' },
  itemMeta: { fontSize: '12px', color: '#64748b', fontWeight: 'normal' as const, margin: '2px 0 0' },
  itemTotal: { fontSize: '14px', color: '#333', verticalAlign: 'top' as const },
  totalRow: { padding: '12px 0' },
  totalLabel: { fontSize: '16px', color: '#003366', fontWeight: 'bold' as const },
  totalValue: { fontSize: '18px', color: '#003366', fontWeight: 'bold' as const },
  button: { backgroundColor: '#003366', color: '#ffffff', padding: '14px 36px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold' as const, fontSize: '15px' },
  footer: { backgroundColor: '#f8fafc', padding: '20px', textAlign: 'center' as const },
  footerText: { fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-line' as const },
};