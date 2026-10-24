import { MS_PER_MINUTE } from './timeframe.ts'

const ISO_UTC_SECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/

/** Formats epoch milliseconds as ISO 8601 UTC without milliseconds, for example `2026-08-25T14:00:00Z`. */
export function formatTimestamp(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** Parses an ISO 8601 UTC minute such as `2026-08-25T14:07:00Z` into epoch milliseconds, or returns `null`. */
export function parseMinuteTimestamp(text: string): number | null {
  if (!ISO_UTC_SECONDS.test(text)) return null

  const ms = Date.parse(text)
  // Date.parse rolls impossible dates over (2026-02-30 becomes 2026-03-02), so the text must survive a round trip.
  if (Number.isNaN(ms) || formatTimestamp(ms) !== text) return null

  return ms % MS_PER_MINUTE === 0 ? ms : null
}
