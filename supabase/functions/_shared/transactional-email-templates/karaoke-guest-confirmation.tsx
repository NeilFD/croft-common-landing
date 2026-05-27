import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  kind?: 'created' | 'updated'
  bookingId?: string
  slotDate?: string
  slotStart?: string
  slotEnd?: string
  guestFirstName?: string
  partySize?: number
  foodPackage?: string | null
  drinkPackage?: string | null
  notes?: string | null
  manageUrl?: string
}

const fmtDate = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return iso }
}
const trimTime = (t?: string) => (t || '').slice(0, 5)
const addMin = (t: string, m: number) => {
  const [h, mm] = t.split(':').map(Number)
  const total = h * 60 + mm + m
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const min = String(total % 60).padStart(2, '0')
  return `${hh}:${min}`
}

const Email = ({
  kind = 'created', slotDate, slotStart, slotEnd, guestFirstName, partySize,
  foodPackage, drinkPackage, notes, manageUrl,
}: Props) => {
  const usableIn = slotStart ? addMin(slotStart, 15) : ''
  const usableOut = slotStart ? addMin(slotStart, 15 + 90) : ''
  const headline = kind === 'updated' ? 'Booth updated.' : 'Booth held.'
  const sub = kind === 'updated' ? "We've moved things around." : 'Warm up the pipes.'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{headline} {fmtDate(slotDate)} at Crazy Bear Town.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={kicker}>Crazy Bear — Karaoke</Text>
          <Heading style={h1}>{headline}</Heading>
          <Text style={lede}>{guestFirstName ? `${guestFirstName}, ` : ''}{sub}</Text>

          <Section style={card}>
            <Row label="When" value={fmtDate(slotDate)} />
            <Row label="Booth window" value={`${trimTime(slotStart)} – ${trimTime(slotEnd)}`} />
            <Row label="In the room" value={`${usableIn} – ${usableOut} (90 mins singing)`} />
            <Row label="Party" value={`${partySize ?? ''} guests`} />
            {drinkPackage ? <Row label="Drinks" value={drinkPackage} /> : null}
            {foodPackage ? <Row label="Food" value={foodPackage} /> : null}
            {notes ? <Row label="Notes" value={notes} /> : null}
          </Section>

          <Text style={textBlock}>
            <strong>How the 2 hours work.</strong><br />
            First 15 minutes: arrive, get briefed, grab a drink at the bar.<br />
            Middle 90 minutes: in the booth, mic in hand.<br />
            Last 15 minutes: we reset the room for the next act.
          </Text>

          {manageUrl ? (
            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button href={manageUrl} style={cta}>Manage your booking</Button>
              <Text style={small}>Change party size, reschedule, or cancel up to 24 hours before.</Text>
            </Section>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>
            Crazy Bear Town, Beaconsfield.<br />
            Questions? Reply to this email or call <a href="tel:+441494673086" style={link}>01494 673086</a>.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <table style={{ width: '100%', marginBottom: '10px' }}>
    <tbody><tr>
      <td style={rowLabel}>{label}</td>
      <td style={rowValue}>{value}</td>
    </tr></tbody>
  </table>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    d?.kind === 'updated'
      ? 'Your karaoke booking has been updated'
      : 'Booth held — your karaoke booking is confirmed',
  displayName: 'Karaoke — guest confirmation',
  previewData: {
    kind: 'created', slotDate: '2026-06-14', slotStart: '18:00', slotEnd: '20:00',
    guestFirstName: 'Sam', partySize: 8, drinkPackage: 'Drinks Package One',
    foodPackage: 'Food Package Two', manageUrl: 'https://crazybear.app/town/karaoke/manage/sample',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 28px' }
const kicker = { fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: '#9b0000', margin: '0 0 16px', fontWeight: 700 }
const h1 = { fontSize: '36px', lineHeight: 1.05, fontWeight: 900, color: '#000', margin: '0 0 12px', letterSpacing: '-0.01em' }
const lede = { fontSize: '16px', color: '#222', margin: '0 0 28px' }
const card = { border: '1px solid #000', padding: '20px 22px', margin: '0 0 24px' }
const rowLabel = { fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#666', width: '40%', verticalAlign: 'top' as const, paddingRight: '12px' }
const rowValue = { fontSize: '15px', color: '#000', fontWeight: 600 as const }
const textBlock = { fontSize: '14px', color: '#222', lineHeight: 1.6, margin: '0 0 20px' }
const cta = { backgroundColor: '#000', color: '#fff', padding: '14px 28px', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase' as const, fontWeight: 700 }
const small = { fontSize: '12px', color: '#777', margin: '12px 0 0' }
const hr = { borderColor: '#eee', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#777', lineHeight: 1.6 }
const link = { color: '#000' }
