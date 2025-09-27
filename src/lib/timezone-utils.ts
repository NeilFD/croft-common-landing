/**
 * Timezone utility functions for handling UTC ↔ Local time conversions
 * 
 * The database stores all timestamps in UTC, but HTML datetime-local inputs
 * work with local timezone. These utilities handle the conversion properly.
 */

/**
 * Convert a UTC timestamp string to a local datetime-local format string
 * Used when displaying existing booking data in the form
 */
export function utcToLocalDatetimeString(utcTimestamp: string): string {
  // Create date from UTC string - JavaScript will interpret as UTC if it has 'Z' or timezone info
  const utcDate = new Date(utcTimestamp);
  
  // Get the local timezone offset in milliseconds
  const timezoneOffset = utcDate.getTimezoneOffset() * 60 * 1000;
  
  // Create local date by subtracting the timezone offset
  const localDate = new Date(utcDate.getTime() - timezoneOffset);
  
  // Format as datetime-local string (YYYY-MM-DDTHH:mm)
  return localDate.toISOString().slice(0, 16);
}

/**
 * Convert a local datetime-local string to UTC timestamp string
 * Used when submitting form data to the database
 */
export function localDatetimeStringToUtc(localDatetimeString: string): string {
  // Parse the local datetime string as if it's in local timezone
  const localDate = new Date(localDatetimeString);
  
  // Return as ISO string (automatically UTC)
  return localDate.toISOString();
}

/**
 * Convert a UTC timestamp to a Date object in local timezone for display
 * Used for calendar view and other display components
 */
export function utcToLocalDate(utcTimestamp: string): Date {
  return new Date(utcTimestamp);
}

/**
 * Create a Date object from local date and time values that represents UTC
 * Used when creating dates for calendar slots
 */
export function createLocalDate(year: number, month: number, day: number, hour: number = 0, minute: number = 0): Date {
  return new Date(year, month, day, hour, minute);
}