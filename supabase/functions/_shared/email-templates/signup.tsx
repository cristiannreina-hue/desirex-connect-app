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
        <Heading style={h1}>✨ Bienvenido a {siteName}</Heading>

        <Text style={text}>Gracias por registrarte.</Text>

        <Text style={text}>
          Para proteger tu cuenta y garantizar una experiencia segura,
          necesitamos verificar tu dirección de correo electrónico.
        </Text>

        <Text style={text}>
          Haz clic en el botón de verificación que encontrarás más abajo para
          activar tu cuenta y comenzar a descubrir todo lo que {siteName} tiene
          para ofrecer.
        </Text>

        <Text style={{ ...text, marginBottom: '24px' }}>
          Si no creaste esta cuenta, puedes ignorar este mensaje.
        </Text>

        <Section>
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

        <hr style={hr} />

        <Text style={footer}>© 2026 {siteName}.</Text>
        <Text style={footer}>
          Todos los derechos reservados. Si tienes dudas, ponte en contacto con
          nuestro equipo de soporte.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, Helvetica, sans-serif',
  color: '#000000',
}
const container = { padding: '0', maxWidth: '600px', margin: '0 auto' }
const h1 = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '24px 0 16px 0',
}
const text = {
  fontSize: '15px',
  color: '#000000',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
}
const muted = {
  fontSize: '13px',
  color: '#555555',
  lineHeight: '1.5',
  margin: '24px 0 0 0',
  wordBreak: 'break-all' as const,
}
const link = { color: '#e8590c', textDecoration: 'underline' }
const button = {
  backgroundColor: '#e8590c',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '6px',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = {
  border: 'none',
  borderTop: '1px solid #e0e0e0',
  margin: '32px 0',
}
const footer = {
  fontSize: '13px',
  color: '#555555',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
}
