import {
  Html, Head, Body, Container, Heading, Text, Section,
  Hr, Preview,
} from '@react-email/components';
import type { EmailMessages } from '@/lib/email-i18n';
import { interpolate } from '@/lib/email-i18n';

export interface RefundConfirmationProps {
  locale: string;
  messages: EmailMessages;
  customerName: string;
  orderNumber: string;
  amount: number;
  reason?: string;
  siteUrl: string;
  replyToEmail: string;
}

const formatPrice = (n: number) =>
  n.toFixed(2).replace('.', ',') + ' €';

export default function RefundConfirmation({
  locale, messages, customerName, orderNumber,
  amount, reason, siteUrl, replyToEmail,
}: RefundConfirmationProps) {
  const t = messages;
  const amountFormatted = formatPrice(amount);

  return (
    <Html lang={locale}>
      <Head />
      <Preview>
        {interpolate(t.refundConfirmation.preview, {
          orderNumber,
          amount: amountFormatted,
        })}
      </Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.header}>
            <Heading style={s.h1}>
              {interpolate(t.refundConfirmation.heading, { name: customerName })}
            </Heading>
          </Section>

          <Section style={s.content}>
            <Text
              style={s.paragraph}
              dangerouslySetInnerHTML={{
                __html: interpolate(t.refundConfirmation.intro, { orderNumber }),
              }}
            />

            <Section style={s.amountBox}>
              <Text style={s.amountLabel}>
                {t.refundConfirmation.amountLabel}
              </Text>
              <Text style={s.amountValue}>{amountFormatted}</Text>
            </Section>

            {reason && (
              <Section style={s.reasonBox}>
                <Text style={s.reasonLabel}>
                  {t.refundConfirmation.reasonLabel}
                </Text>
                <Text style={s.reasonText}>{reason}</Text>
              </Section>
            )}

            <Text style={s.paragraphSmall}>
              {t.refundConfirmation.timingNote}
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
  h1: { color: '#ffffff', fontSize: '22px', margin: 0, fontWeight: 'bold' as const, lineHeight: '1.3' },
  content: { padding: '32px' },
  paragraph: { fontSize: '15px', color: '#333', lineHeight: '1.6', margin: '8px 0 24px' },
  paragraphSmall: { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '16px 0' },
  hr: { borderColor: '#e6e6e6', margin: '24px 0' },
  amountBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' as const },
  amountLabel: { fontSize: '12px', color: '#15803d', letterSpacing: '0.5px', textTransform: 'uppercase' as const, margin: '0 0 8px' },
  amountValue: { fontSize: '28px', fontWeight: 'bold' as const, color: '#16a34a', margin: 0 },
  reasonBox: { background: '#fefce8', border: '1px solid #fde68a', padding: '16px', borderRadius: '8px', marginTop: '16px' },
  reasonLabel: { fontSize: '12px', color: '#92400e', fontWeight: 'bold' as const, textTransform: 'uppercase' as const, margin: '0 0 6px', letterSpacing: '0.5px' },
  reasonText: { fontSize: '15px', color: '#78350f', margin: 0, lineHeight: '1.5' },
  footer: { backgroundColor: '#f8fafc', padding: '20px', textAlign: 'center' as const },
  footerText: { fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-line' as const },
};