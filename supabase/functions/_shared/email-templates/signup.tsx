/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://szokkwlleqndyiojhsll.supabase.co/storage/v1/object/public/email-assets/crazy-bear-mark.png'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  token,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your code to enter the den.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="The Crazy Bear" width="64" height="64" style={logo} />
        <Text style={eyebrow}>THE BEARS DEN</Text>
        <Heading style={h1}>YOUR CODE.</Heading>
        <Text style={text}>Enter this on the password screen.</Text>

        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={codeBox}>
          <tbody>
            <tr>
              <td align="center" style={codeCell}>
                <span style={codeText}>{token || '------'}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <Text style={smallText}>Good for 1 hour. One use only.</Text>

        <Hr style={hr} />
        <Text style={footer}>
          Didn't sign up? Ignore this. No harm done.
          <br />
          <Link href={siteUrl} style={footerLink}>
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
  margin: '0 0 16px',
  textTransform: 'uppercase' as const,
}
const text = {
  fontSize: '16px',
  color: '#000000',
  lineHeight: '1.5',
  margin: '0 0 24px',
}
const codeBox = {
  border: '2px solid #000000',
  padding: '24px 16px',
  textAlign: 'center' as const,
  margin: '0 0 20px',
  backgroundColor: '#ffffff',
}
const codeText = {
  fontFamily: "'Archivo Black', Impact, sans-serif",
  fontSize: '40px',
  letterSpacing: '0.4em',
  color: '#000000',
  margin: '0',
  paddingLeft: '0.4em',
}
const hr = { borderColor: '#000000', borderWidth: '1px', margin: '40px 0 24px' }
const footer = { fontSize: '12px', color: '#737373', lineHeight: '1.6', margin: '0' }
const smallText = { fontSize: '12px', color: '#737373', lineHeight: '1.6', margin: '16px 0 0' }
const footerLink = { color: '#000000', textDecoration: 'underline' }
