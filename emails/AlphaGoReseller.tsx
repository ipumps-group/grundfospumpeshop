import {
  Html, Head, Body, Container, Heading, Text, Section,
  Hr, Button, Preview,
} from '@react-email/components';

export interface AlphaGoResellerProps {
  customerName?: string;
  siteUrl: string;
  replyToEmail: string;
}

export default function AlphaGoReseller({
  customerName, siteUrl, replyToEmail,
}: AlphaGoResellerProps) {
  const greetingName = customerName ?? '';

  return (
    <Html lang="et">
      <Head />
      <Preview>Grundfos ALPHA GO hulgihinnad — ametlik edasimüüja Eestis. Küsi B2B pakkumist.</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.header}>
            <Heading style={s.h1}>🔥 Grundfos ALPHA GO hulgihinnad</Heading>
            <Text style={s.headerSub}>B2B pakkumine edasimüüjatele ja paigaldajatele</Text>
          </Section>

          <Section style={s.content}>
            {greetingName && (
              <Text style={s.greeting}>Tere, {greetingName}!</Text>
            )}
            <Text style={s.paragraph}>
              Grundfos ALPHA GO seeria on nüüd saadaval hulgihinnadega.
              Ametlik edasimüüja Eestis — arvega ost, tehniline dokumentatsioon
              ja kiire tarne laost.
            </Text>

            <Hr style={s.hr} />

            <Heading as="h2" style={s.h2}>Miks valida ALPHA GO?</Heading>
            <Section style={s.benefitsBox}>
              <Text style={s.benefitItem}>✓ <strong>Kaks pumpa saja asemel</strong> — asendavad enamiku vanu UPS, ALPHA1, ALPHA2 ja ALPHA3 pumapasid</Text>
              <Text style={s.benefitItem}>✓ <strong>Grundfos GO äpp</strong> — juhendatud seadistus ja GO Replace funktsioon</Text>
              <Text style={s.benefitItem}>✓ <strong>Vähem tagasikutsumisi</strong> — täpne kasutuselevõtt ja õige seadistus</Text>
              <Text style={s.benefitItem}>✓ <strong>Laos ja kohe saadaval</strong> — kiire tarne üle Eesti</Text>
            </Section>

            <Hr style={s.hr} />

            <Heading as="h2" style={s.h2}>Kolmeastmeline valik</Heading>
            <Text style={s.paragraph}>
              <strong>ALPHA2 GO</strong> — tippvalik, asendab ALPHA2, ALPHA3 ja soojuspumpade pumbad<br />
              <strong>ALPHA1 GO</strong> — kvaliteetne põhivalik, asendab UPS, vana ALPHA1 ja ALPHA1 L<br />
              <strong>Uus ALPHA1</strong> — soodsaim valik ilma äpi toeta
            </Text>

            <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
              <Button href={`${siteUrl}/et/leht/kontakt`} style={s.button}>
                Küsi B2B hinnapakkumist
              </Button>
            </Section>

            <Text style={s.paragraphSmall}>
              Küsimuste korral võtke ühendust: <a href={`mailto:${replyToEmail}`} style={s.link}>{replyToEmail}</a>
            </Text>
          </Section>

          <Section style={s.footer}>
            <Text style={s.footerText}>
              Pump OÜ — ametlik Grundfos edasimüüja Eestis<br />
              {siteUrl.replace(/^https?:\/\//, '')}
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
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '8px 0 0' },
  content: { padding: '32px' },
  greeting: { fontSize: '16px', color: '#003366', marginBottom: '8px', fontWeight: 'bold' as const },
  paragraph: { fontSize: '15px', color: '#333', lineHeight: '1.6', margin: '8px 0' },
  paragraphSmall: { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '12px 0' },
  hr: { borderColor: '#e6e6e6', margin: '24px 0' },
  h2: { fontSize: '16px', color: '#003366', margin: '16px 0 12px', fontWeight: 'bold' as const },
  benefitsBox: { backgroundColor: '#f0f9ff', borderRadius: '6px', padding: '16px', margin: '16px 0' },
  benefitItem: { fontSize: '14px', color: '#333', margin: '8px 0', lineHeight: '1.5' },
  button: { backgroundColor: '#003366', color: '#ffffff', padding: '14px 36px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold' as const, fontSize: '15px' },
  link: { color: '#003366', textDecoration: 'underline' },
  footer: { backgroundColor: '#f8fafc', padding: '20px', textAlign: 'center' as const },
  footerText: { fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.6' },
};
