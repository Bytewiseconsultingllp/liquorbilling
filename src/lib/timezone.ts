/**
 * IST (Indian Standard Time) timezone utilities.
 *
 * MongoDB stores dates in UTC. This module provides helpers so that
 * "today", "start of day", and "end of day" always refer to IST
 * boundaries regardless of the server or browser timezone.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // +5:30 in milliseconds

/**
 * Get the IST start-of-day (00:00:00.000 IST) expressed as a UTC Date.
 * Without arguments it returns the start of "today" in IST.
 */
export function startOfDayIST(date?: Date | string): Date {
  const d = date ? new Date(date) : new Date()
  // Shift to IST, zero the time, shift back
  const istMs = d.getTime() + IST_OFFSET_MS
  const istDay = new Date(istMs)
  istDay.setUTCHours(0, 0, 0, 0)
  return new Date(istDay.getTime() - IST_OFFSET_MS)
}

/**
 * Get the IST end-of-day (23:59:59.999 IST) expressed as a UTC Date.
 */
export function endOfDayIST(date?: Date | string): Date {
  const start = startOfDayIST(date)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
}

/**
 * Get today's date in IST as a YYYY-MM-DD string.
 * Safe to call in any timezone — always returns the IST calendar date.
 */
export function todayIST(): string {
  const now = new Date()
  const ist = new Date(now.getTime() + IST_OFFSET_MS)
  return ist.toISOString().split("T")[0]
}

/**
 * Format a date string as YYYY-MM-DD in IST (for date inputs, filenames, etc.)
 */
export function formatDateIST(date: Date | string): string {
  const d = new Date(date)
  const ist = new Date(d.getTime() + IST_OFFSET_MS)
  return ist.toISOString().split("T")[0]
}
