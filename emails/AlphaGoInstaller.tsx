import {
  Html, Head, Body, Container, Heading, Text, Section,
  Hr, Button, Preview, Img,
} from '@react-email/components';

export interface AlphaGoInstallerProps {
  customerName?: string;
  siteUrl: string;
  replyToEmail: string;
}

export default function AlphaGoInstaller({
  customerName, siteUrl, replyToEmail,
}: AlphaGoInstallerProps) {
  const greetingName = customerName ?? '';

  return (
    <Html lang="et">
      <Head />
      <Preview>Uus Grundfos ALPHA GO — kaks pumpa saja asemel. Grundfos GO äpp juhendab asenduse ja seadistuse.</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.header}>
            <Heading style={s.h1}>🔥 Uus Grundfos ALPHA GO seeria</Heading>
            <Text style={s.headerSub}>Küttehooaeg algab siit</Text>
          </Section>

          <Section style={s.content}>
            {greetingName && (
              <Text style={s.greeting}>Tere, {greetingName}!</Text>
            )}
            <Text style={s.paragraph}>
              Grundfos toob turule uue ALPHA GO seeria — kaks pumpa saja asemel.
              ALPHA1 GO ja ALPHA2 GO asendavad enamiku vanu UPS, ALPHA1, ALPHA2 ja ALPHA3
              tsirkulatsioonipumapasid.
            </Text>

            <Hr style={s.hr} />

            <Heading as="h2" style={s.h2}>Grundfos GO äpp teeb asenduse lihtsaks</Heading>
            <Text style={s.paragraph}>
              Juhendatud seadistus (Guided Setup) ja GO Replace funktsioon tagavad täpse
              kasutuselevõtu ja vähem tagasikutsumisi. Mobiiliga tööprotsess vähendab
              keerukust ja säästab aega.
            </Text>

            <Section style={s.benefitsBox}>
              <Text style={s.benefitItem}>✓ <strong>ALPHA2 GO</strong> — asendab ALPHA2, ALPHA3 ja soojuspumpade pumbad (UPM3/UPM4)</Text>
              <Text style={s.benefitItem}>✓ <strong>ALPHA1 GO</strong> — asendab UPS, vana ALPHA1 ja ALPHA1 L</Text>
              <Text style={s.benefitItem}>✓ <strong>Uus ALPHA1</strong> — soodsaim valik ilma äpi toeta</Text>
            </Section>

            <Hr style={s.hr} />

            <Heading as="h2" style={s.h2}>Vanad mudelid lõppevad</Heading>
            <Text style={s.paragraph}>
              UPS, ALPHA1 L, ALPHA2 ja ALPHA3 tootmine lõppeb. Laoseisud müüakse lõpuni,
              kuid neid ei toodeta juurde. Nüüd on õige aeg vahetada ALPHA GO vastu.
            </Text>

            <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
              <Button href={`${siteUrl}/et/tooted/kuttepumbad`} style={s.button}>
                Vaata ALPHA GO tooteid
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
