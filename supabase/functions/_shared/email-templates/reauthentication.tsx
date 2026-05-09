/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your code.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>THE BEARS DEN</Text>
        <Heading style={h1}>PROVE IT.</Heading>
        <Text style={text}>Use this code to confirm it's you.</Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          Expires soon. Didn't ask for this? Ignore it.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: "'Archivo Black', Impact, sans-serif",
  fontSize: '40px',
  letterSpacing: '0.15em',
  color: '#000000',
  margin: '0 0 32px',
  padding: '20px 0',
  borderTop: '1px solid #000000',
  borderBottom: '1px solid #000000',
  textAlign: 'center' as const,
}
const hr = { borderColor: '#000000', borderWidth: '1px', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#737373', lineHeight: '1.6', margin: '0' }
