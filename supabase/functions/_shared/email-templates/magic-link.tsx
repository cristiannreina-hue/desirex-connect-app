/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu acceso exclusivo a DeseoX está listo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>DeseoX</Heading>
        </Section>
        <Section style={card}>
          <Heading style={h1}>¡Tu acceso exclusivo está listo!</Heading>
          <Text style={text}>
            Haz clic en el botón de abajo para ingresar de forma segura a tu
            panel de DeseoX. Este enlace es único y expirará pronto.
          </Text>
          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button style={button} href={confirmationUrl}>
              Ingresar a mi cuenta
            </Button>
          </Section>
          <Text style={footer}>
            Si no solicitaste este acceso, puedes ignorar este correo con
            seguridad.
          </Text>
        </Section>
        <Text style={copyright}>
          © 2026 DeseoX — Conecta con exclusividad.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const GOLD = '#D4AF37'
const DARK = '#0a0a0a'
const CARD = '#141414'

const main = {
  backgroundColor: DARK,
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
  WebkitFontSmoothing: 'antialiased',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 16px',
}
const header = {
  textAlign: 'center' as const,
  padding: '8px 0 24px',
}
const brand = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: '34px',
  fontWeight: 'bold' as const,
  color: GOLD,
  letterSpacing: '2px',
  margin: 0,
}
const card = {
  backgroundColor: CARD,
  border: `1px solid ${GOLD}33`,
  borderRadius: '12px',
  padding: '36px 28px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  margin: '0 0 18px',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '15px',
  color: '#e5e5e5',
  lineHeight: '1.6',
  margin: '0 0 12px',
  textAlign: 'center' as const,
}
const button = {
  backgroundColor: GOLD,
  color: '#000000',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '16px 32px',
  textDecoration: 'none',
  display: 'inline-block',
  letterSpacing: '0.5px',
}
const footer = {
  fontSize: '13px',
  color: '#999999',
  margin: '24px 0 0',
  textAlign: 'center' as const,
}
const copyright = {
  fontSize: '12px',
  color: '#777777',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}
