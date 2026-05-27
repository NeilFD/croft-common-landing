import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  guestFirstName?: string
  slotDate?: string
  slotStart?: string
  cancelledReason?: string | null
}

const fmtDate = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return iso }
}

const Email = ({ guestFirstName, slotDate, slotStart, cancelledReason }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Booth released. Your karaoke booking is cancelled.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>Crazy Bear — Karaoke</Text>
        <Heading style={h1}>Booth released.</Heading>
        <Text style={lede}>
          {guestFirstName ? `${guestFirstName}, ` : ''}your booking for {fmtDate(slotDate)}
          {slotStart ? ` at ${slotStart.slice(0, 5)}` : ''} has been cancelled.
        </Text>
        {cancelledReason ? <Text style={textBlock}><em>Reason: {cancelledReason}</em></Text> : null}

        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href="https://crazybear.app/town/karaoke" style={cta}>Book again</Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          Crazy Bear Town, Beaconsfield.<br />
          Questions? Reply to this email or call <a href="tel:+441494673086" style={link}>01494 673086</a>.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Your karaoke booking has been cancelled',
  displayName: 'Karaoke — guest cancellation',
  previewData: { guestFirstName: 'Sam', slotDate: '2026-06-14', slotStart: '18:00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 28px' }
const kicker = { fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: '#9b0000', margin: '0 0 16px', fontWeight: 700 }
const h1 = { fontSize: '36px', lineHeight: 1.05, fontWeight: 900, color: '#000', margin: '0 0 12px', letterSpacing: '-0.01em' }
const lede = { fontSize: '16px', color: '#222', margin: '0 0 16px' }
const textBlock = { fontSize: '14px', color: '#222', lineHeight: 1.6, margin: '0 0 20px' }
const cta = { backgroundColor: '#000', color: '#fff', padding: '14px 28px', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase' as const, fontWeight: 700 }
const hr = { borderColor: '#eee', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#777', lineHeight: 1.6 }
const link = { color: '#000' }
