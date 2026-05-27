import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  kind?: 'created' | 'updated'
  bookingId?: string
  slotDate?: string
  slotStart?: string
  slotEnd?: string
  guestFirstName?: string
  guestLastName?: string | null
  guestEmail?: string
  guestPhone?: string | null
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

const Email = ({
  kind = 'created', bookingId, slotDate, slotStart, slotEnd,
  guestFirstName, guestLastName, guestEmail, guestPhone, partySize,
  foodPackage, drinkPackage, notes,
}: Props) => {
  const fullName = `${guestFirstName || ''} ${guestLastName || ''}`.trim()
  const headline = kind === 'updated' ? 'Booking updated' : 'New karaoke booking'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{headline} — {fullName} — {fmtDate(slotDate)} {trimTime(slotStart)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={kicker}>Reservation sheet — Karaoke</Text>
          <Heading style={h1}>{headline}.</Heading>

          <Section style={card}>
            <Row label="Date" value={fmtDate(slotDate)} />
            <Row label="Slot" value={`${trimTime(slotStart)} – ${trimTime(slotEnd)}`} />
            <Row label="Party size" value={String(partySize ?? '')} />
            <Row label="Guest" value={fullName || '—'} />
            <Row label="Email" value={guestEmail || '—'} />
            <Row label="Phone" value={guestPhone || '—'} />
            <Row label="Drinks" value={drinkPackage || '—'} />
            <Row label="Food" value={foodPackage || '—'} />
            <Row label="Notes" value={notes || '—'} />
            <Row label="Booking ID" value={bookingId || '—'} />
          </Section>

          <Text style={textBlock}>
            Block out the room for 2 hours (15 min welcome + 90 min sing + 15 min clean-down).
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Auto-sent from crazybear.app. Reply to the guest direct if you need anything.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <table style={{ width: '100%', marginBottom: '8px' }}>
    <tbody><tr>
      <td style={rowLabel}>{label}</td>
      <td style={rowValue}>{value}</td>
    </tr></tbody>
  </table>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `${d?.kind === 'updated' ? '[Updated]' : '[New booking]'} Karaoke — ${d?.slotDate || ''} ${String(d?.slotStart || '').slice(0,5)} — ${d?.guestFirstName || ''} ${d?.guestLastName || ''}`.trim(),
  displayName: 'Karaoke — venue reservation sheet',
  previewData: {
    kind: 'created', bookingId: 'abc-123', slotDate: '2026-06-14', slotStart: '18:00', slotEnd: '20:00',
    guestFirstName: 'Sam', guestLastName: 'Lee', guestEmail: 'sam@example.com', guestPhone: '07000000000',
    partySize: 8, drinkPackage: 'Drinks Package One', foodPackage: 'Food Package Two',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 28px' }
const kicker = { fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: '#9b0000', margin: '0 0 16px', fontWeight: 700 }
const h1 = { fontSize: '32px', lineHeight: 1.05, fontWeight: 900, color: '#000', margin: '0 0 20px', letterSpacing: '-0.01em' }
const card = { border: '1px solid #000', padding: '18px 20px', margin: '0 0 20px' }
const rowLabel = { fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#666', width: '38%', verticalAlign: 'top' as const, paddingRight: '12px' }
const rowValue = { fontSize: '14px', color: '#000', fontWeight: 600 as const }
const textBlock = { fontSize: '13px', color: '#222', lineHeight: 1.6, margin: '0 0 20px' }
const hr = { borderColor: '#eee', margin: '24px 0' }
const footer = { fontSize: '11px', color: '#777', lineHeight: 1.6 }
