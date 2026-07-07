import {
  Html, Head, Body, Container, Heading, Text, Section, Row, Column,
  Hr, Button, Preview,
} from '@react-email/components';
import type { EmailMessages } from '@/lib/email-i18n';
import { interpolate } from '@/lib/email-i18n';
import { COMPANY } from '@/lib/config';

export interface PrepaymentInvoiceProps {
  locale: string;
  messages: EmailMessages;
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  total: number;
  dueDate: string;
  orderUrl: string;
  siteUrl: string;
  replyToEmail: string;
}

const formatPrice = (n: number) =>
  n.toFixed(2).replace('.', ',') + ' \u20AC';

export default function PrepaymentInvoice({
  locale, messages, customerName, orderNumber, items,
  total, dueDate, orderUrl, siteUrl, replyToEmail,
}: PrepaymentInvoiceProps) {
  const t = messages;

  return (
    <Html lang={locale}>
      <Head />
      <Preview>
        {interpolate(t.prepaymentInvoice.preview, {
          orderNumber,
          total: formatPrice(total),
        })}
      </Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.header}>
            <Heading style={s.h1}>{t.prepaymentInvoice.heading}</Heading>
          </Section>

          <Section style={s.content}>
            <Text style={s.greeting}>
              {interpolate(t.common.greeting, { name: customerName })}
            </Text>
            <Text
              style={s.paragraph}
              dangerouslySetInnerHTML={{
                __html: interpolate(t.prepaymentInvoice.intro, { orderNumber }),
              }}
            />

            <Hr style={s.hr} />

            <Heading as="h2" style={s.h2}>
              {t.prepaymentInvoice.itemsHeading}
            </Heading>
            <Section style={s.itemsBox}>
              {items.map((item, i) => (
                <Row key={i} style={s.itemRow}>
                  <Column style={s.itemName}>
                    {item.name}
                    <Text style={s.itemMeta}>
                      {item.quantity} {t.common.quantity} x {formatPrice(item.unitPrice)}
                    </Text>
                  </Column>
                  <Column align="right" style={s.itemTotal}>
                    {formatPrice(item.quantity * item.unitPrice)}
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr style={s.hr} />

            <Row style={s.totalRow}>
              <Column style={s.totalLabel}>{t.common.total}</Column>
              <Column align="right" style={s.totalValue}>
                {formatPrice(total)}
              </Column>
            </Row>

            <Hr style={s.hr} />

            <Heading as="h2" style={s.h2}>
              {t.prepaymentInvoice.paymentHeading}
            </Heading>
            <Section style={s.paymentBox}>
              <Row style={s.paymentRow}>
                <Column style={s.paymentLabel}>{t.prepaymentInvoice.bankLabel}</Column>
                <Column style={s.paymentValue}>{COMPANY.bankName}</Column>
              </Row>
              <Row style={s.paymentRow}>
                <Column style={s.paymentLabel}>{t.prepaymentInvoice.ibanLabel}</Column>
                <Column style={s.paymentValue}>{COMPANY.bankAccount}</Column>
              </Row>
              <Row style={s.paymentRow}>
                <Column style={s.paymentLabel}>{t.prepaymentInvoice.dueDateLabel}</Column>
                <Column style={s.paymentValue}>{dueDate}</Column>
              </Row>
              <Row style={s.paymentRow}>
                <Column style={s.paymentLabel}>{t.prepaymentInvoice.amountLabel}</Column>
                <Column style={s.paymentValue}>{formatPrice(total)}</Column>
              </Row>
              <Row style={s.paymentRow}>
                <Column style={s.paymentLabel}>{t.prepaymentInvoice.referenceLabel}</Column>
                <Column style={s.paymentValue}>{orderNumber}</Column>
              </Row>
            </Section>

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
  hr: { borderColor: '#e6e6e6', margin: '24px 0' },
  h2: { fontSize: '16px', color: '#003366', margin: '16px 0 12px', fontWeight: 'bold' as const },
  itemsBox: { backgroundColor: '#f8fafc', borderRadius: '6px', padding: '16px' },
  itemRow: { padding: '8px 0', borderBottom: '1px solid #e6e6e6' },
  itemName: { fontSize: '14px', color: '#333', fontWeight: 'bold' as const, verticalAlign: 'top' as const },
  itemMeta: { fontSize: '12px', color: '#64748b', fontWeight: 'normal' as const, margin: '2px 0 0' },
  itemTotal: { fontSize: '14px', color: '#333', verticalAlign: 'top' as const },
  totalRow: { padding: '8px 0' },
  totalLabel: { fontSize: '16px', color: '#003366', fontWeight: 'bold' as const },
  totalValue: { fontSize: '18px', color: '#003366', fontWeight: 'bold' as const },
  paymentBox: { backgroundColor: '#f0f7ff', borderRadius: '6px', padding: '16px' },
  paymentRow: { padding: '6px 0' },
  paymentLabel: { fontSize: '13px', color: '#64748b', width: '140px' },
  paymentValue: { fontSize: '14px', color: '#003366', fontWeight: 'bold' as const },
  button: { backgroundColor: '#003366', color: '#ffffff', padding: '14px 32px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold' as const, fontSize: '14px' },
  footer: { backgroundColor: '#f8fafc', padding: '20px', textAlign: 'center' as const },
  footerText: { fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-line' as const },
};
