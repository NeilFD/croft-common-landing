/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

// Plain, code-first email. Kept deliberately short and link-light to improve
// inbox placement at Microsoft and other strict providers.
export const SignupEmail = ({ token }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Crazy Bear code: {token || ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={text}>Your Crazy Bear code:</Text>
        <Text style={code}>{token || '------'}</Text>
        <Text style={text}>Enter it to set your password.</Text>
        <Text style={small}>Expires in one hour. One use only.</Text>
        <Text style={small}>If you did not request this, ignore this email.</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 24px',
  backgroundColor: '#ffffff',
}
const text = {
  fontSize: '15px',
  color: '#000000',
  lineHeight: '1.5',
  margin: '0 0 16px',
}
const code = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '32px',
  letterSpacing: '0.4em',
  color: '#000000',
  margin: '0 0 24px',
  paddingLeft: '0.4em',
}
const small = {
  fontSize: '12px',
  color: '#555555',
  margin: '0 0 8px',
}
