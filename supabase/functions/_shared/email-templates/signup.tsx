/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Activa tu cuenta en {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bienvenido a {siteName}</Heading>

        <Text style={text}>
          Para proteger tu cuenta y garantizar una experiencia segura,
          necesitamos verificar tu dirección de correo electrónico.
        </Text>

        <Text style={text}>
          Haz clic en el botón de verificación que encontrarás más abajo para
          activar tu cuenta y comenzar a descubrir todo lo que {siteName} tiene
          para ofrecer.
        </Text>

        <Text style={text}>
          Si no creaste esta cuenta, puedes ignorar este mensaje.
        </Text>

        <Section style={{ paddingTop: '12px', paddingBottom: '12px' }}>
          <Button style={button} href={confirmationUrl}>
            Activar mi Cuenta
          </Button>
        </Section>

        <Text style={muted}>
          Si el botón no funciona, copia y pega este enlace en tu navegador:
          <br />
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>

        <Text style={footer}>© 2026 {siteName}.</Text>
        <Text style={footer}>
          Todos los derechos reservados. Si tienes dudas, ponte en contacto con
          nuestro equipo de soporte.
        </Text>
        <Text style={footer}>
          Enviado a{' '}
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          {' · '}
          <Link href={siteUrl} style={link}>
            {siteName}
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
}
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#111111',
  margin: '0 0 20px',
}
const text = {
  fontSize: '16px',
  color: '#333333',
  lineHeight: '1.5',
  margin: '8px 0',
}
const muted = {
  fontSize: '13px',
  color: '#666666',
  lineHeight: '1.5',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
}
const link = { color: '#f03705', textDecoration: 'underline' }
const button = {
  backgroundColor: '#f03705',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: '4px',
  padding: '12px 20px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = {
  fontSize: '12px',
  color: '#999999',
  margin: '6px 0',
}
