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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={eyebrow}>The Crazy Bear</Text>
          <Hr style={rule} />
        </Section>

        <Heading style={h1}>Reset your password</Heading>

        <Text style={text}>
          Lost your way back in? Set a new password and we'll forget the old one.
        </Text>

        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>
            Reset password
          </Button>
        </Section>

        <Text style={small}>
          If the button doesn't work, paste this link into your browser:
        </Text>
        <Text style={linkText}>{confirmationUrl}</Text>

        <Hr style={rule} />
        <Text style={footer}>
          Didn't ask for a reset? Ignore this email and your password stays as it is.
        </Text>
        <Text style={signoff}>The Crazy Bear, Stadhampton & Beaconsfield</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 32px', backgroundColor: '#ffffff' }
const header = { marginBottom: '32px' }
const eyebrow = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '11px', letterSpacing: '0.4em', textTransform: 'uppercase' as const, color: '#000000', margin: '0 0 16px' }
const rule = { borderColor: '#000000', borderTopWidth: '1px', borderTopStyle: 'solid' as const, margin: '0' }
const h1 = { fontSize: '32px', fontWeight: 'normal' as const, color: '#000000', letterSpacing: '-0.01em', lineHeight: '1.1', margin: '32px 0 24px' }
const text = { fontSize: '15px', color: '#000000', lineHeight: '1.6', margin: '0 0 28px' }
const buttonWrap = { margin: '0 0 32px' }
const button = { backgroundColor: '#000000', color: '#ffffff', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '12px', letterSpacing: '0.4em', textTransform: 'uppercase' as const, borderRadius: '0px', padding: '16px 28px', textDecoration: 'none', display: 'inline-block' }
const small = { fontSize: '12px', color: '#666666', margin: '0 0 6px' }
const linkText = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '11px', color: '#000000', wordBreak: 'break-all' as const, margin: '0 0 32px' }
const footer = { fontSize: '12px', color: '#666666', margin: '24px 0 8px' }
const signoff = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: '#000000', margin: '16px 0 0' }
