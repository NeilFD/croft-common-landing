/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>THE BEARS DEN</Text>
        <Heading style={h1}>NEW PASSWORD.</Heading>
        <Text style={text}>Tap below. Set a new one.</Text>
        <Button style={button} href={confirmationUrl}>
          RESET PASSWORD
        </Button>
        <Text style={text}>Link works once. Use it soon.</Text>
        <Hr style={hr} />
        <Text style={footer}>
          Didn't ask for this? Ignore it. Your password stays put.
          <br />
          <Link href={siteUrl} style={footerLink}>
            {siteName}
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Space Grotesk', Helvetica, Arial, sans-serif",
}
const container = { padding: '40px 32px', maxWidth: '560px' }
const eyebrow = {
  fontFamily: "'Archivo Black', Impact, sans-serif",
  fontSize: '11px',
  letterSpacing: '0.2em',
  color: '#000000',
  margin: '0 0 24px',
}
const h1 = {
  fontFamily: "'Archivo Black', Impact, sans-serif",
  fontSize: '32px',
  letterSpacing: '0.02em',
  color: '#000000',
  margin: '0 0 24px',
  textTransform: 'uppercase' as const,
}
const text = {
  fontSize: '16px',
  color: '#000000',
  lineHeight: '1.5',
  margin: '0 0 24px',
}
const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 'bold' as const,
  letterSpacing: '0.15em',
  borderRadius: '0px',
  padding: '16px 28px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
  display: 'inline-block',
}
const hr = { borderColor: '#000000', borderWidth: '1px', margin: '40px 0 24px' }
const footer = { fontSize: '12px', color: '#737373', lineHeight: '1.6', margin: '0' }
const footerLink = { color: '#000000', textDecoration: 'underline' }
