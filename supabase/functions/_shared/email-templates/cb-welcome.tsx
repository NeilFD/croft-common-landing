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
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface CBWelcomeEmailProps {
  recipient?: string
  firstName?: string
}

export const CBWelcomeEmail = ({ firstName }: CBWelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're in. The den remembers.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={eyebrow}>The Crazy Bear</Text>
          <Hr style={rule} />
        </Section>

        <Heading style={h1}>
          {firstName ? `In you go, ${firstName}.` : 'In you go.'}
        </Heading>

        <Text style={text}>
          Password set. Door shut behind you. You're in the den.
        </Text>

        <Text style={text}>
          You're now part of the secret. No fanfare. No badge. Just a quiet arrangement between you and the bear.
        </Text>

        <Text style={text}>
          You are the guardians of the House Rules, our examples to the newcomers. You're here to protect the standards.
        </Text>

        <Text style={text}>
          We identify as anything you want us to be:
        </Text>

        <Text style={text}>
          01. Inhibitions will get you nowhere
        </Text>
        <Text style={text}>
          02. Dress like your ex is watching
        </Text>
        <Text style={text}>
          03. Crazy Bear is for the 'gram, not on a gram.
        </Text>
        <Text style={text}>
          04. No phones = No evidence
        </Text>
        <Text style={text}>
          05. Everyone's got problems, keep yours to yourself.
        </Text>
        <Text style={text}>
          06. Be cool, No-one likes that guy.
        </Text>
        <Text style={text}>
          07. Be safe, be respectful, be anything but your midweek self.
        </Text>

        <Hr style={ruleSoft} />

        <Text style={sectionLabel}>The Seven</Text>
        <Heading style={h2}>Draw a 7. The den notices.</Heading>
        <Text style={text}>
          When you're logged in on the website, you'll spot a small mark on some of the pages: 'MEMBERS: DRAW 7'. That's your cue.
        </Text>
        <Text style={text}>
          Draw a '7' across the screen with your finger or mouse. And, Member doors open.
        </Text>

        <Hr style={ruleSoft} />

        <Text style={sectionLabel}>The Dice</Text>
        <Heading style={h2}>Roll the bones. The bear pays.</Heading>
        <Text style={text}>
          At the bar, the dice decide your bill.
        </Text>
        <Text style={text}>
          Show the bartender. Roll a seven. Your drink's on us.
        </Text>

        <Hr style={ruleSoft} />

        <Text style={sectionLabel}>Secret Cinema</Text>
        <Heading style={h2}>Crazy Bear Country. Members only.</Heading>
        <Text style={text}>
          No queue. No public listings. Just a screen, some space, and a film you won't find anywhere else.
        </Text>
        <Text style={text}>
          Members only.
        </Text>

        <Hr style={ruleSoft} />

        <Text style={sectionLabel}>Secret Room Escapes</Text>
        <Heading style={h2}>Not on the website. Just for members</Heading>
        <Text style={text}>
          Room, bubbles, dinner, maybe more. Bundled quietly. Changing frequently. Priced for members who know to ask.
        </Text>
        <Text style={text}>
          The prompt pool has the current offer. If it doesn't, wait. The bear rotates.
        </Text>

        <Hr style={ruleSoft} />

        <Text style={text}>
          And there may well be more, you'll need to hunt them down.
        </Text>

        <Hr style={rule} />

        <Text style={footer}>
          That's the welcome. The rest is up to you.
        </Text>
        <Text style={signoff}>THE CRAZY BEAR, STADHAMPTON & BEACONSFIELD</Text>
      </Container>
    </Body>
  </Html>
)

export default CBWelcomeEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px 32px',
  backgroundColor: '#ffffff',
}
const header = { marginBottom: '32px' }
const eyebrow = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '11px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase' as const,
  color: '#000000',
  margin: '0 0 16px',
}
const sectionLabel = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '10px',
  letterSpacing: '0.45em',
  textTransform: 'uppercase' as const,
  color: '#000000',
  margin: '0 0 8px',
}
const rule = {
  borderColor: '#000000',
  borderTopWidth: '1px',
  borderTopStyle: 'solid' as const,
  margin: '0',
}
const ruleSoft = {
  borderColor: '#000000',
  borderTopWidth: '1px',
  borderTopStyle: 'solid' as const,
  margin: '32px 0',
  opacity: 0.15,
}
const h1 = {
  fontSize: '32px',
  fontWeight: 'normal' as const,
  color: '#000000',
  letterSpacing: '-0.01em',
  lineHeight: '1.1',
  margin: '32px 0 24px',
}
const h2 = {
  fontSize: '22px',
  fontWeight: 'normal' as const,
  color: '#000000',
  letterSpacing: '-0.01em',
  lineHeight: '1.15',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: '#000000',
  lineHeight: '1.6',
  margin: '0 0 18px',
}
const footer = {
  fontSize: '12px',
  color: '#666666',
  margin: '24px 0 8px',
}
const signoff = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '10px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase' as const,
  color: '#000000',
  margin: '16px 0 0',
}
