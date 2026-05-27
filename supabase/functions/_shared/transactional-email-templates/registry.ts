/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as karaokeGuestConfirmation } from './karaoke-guest-confirmation.tsx'
import { template as karaokeGuestCancellation } from './karaoke-guest-cancellation.tsx'
import { template as karaokeVenueSheet } from './karaoke-venue-sheet.tsx'
import { template as karaokeVenueCancellation } from './karaoke-venue-cancellation.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'karaoke-guest-confirmation': karaokeGuestConfirmation,
  'karaoke-guest-cancellation': karaokeGuestCancellation,
  'karaoke-venue-sheet': karaokeVenueSheet,
  'karaoke-venue-cancellation': karaokeVenueCancellation,
}
