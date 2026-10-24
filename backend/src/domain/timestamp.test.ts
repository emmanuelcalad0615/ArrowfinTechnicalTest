import { describe, expect, it } from 'vitest'
import { formatTimestamp, parseMinuteTimestamp } from './timestamp.ts'

describe('formatTimestamp', () => {
  it.each([
    { ms: Date.UTC(2026, 7, 25, 14, 0), expected: '2026-08-25T14:00:00Z' },
    { ms: Date.UTC(2026, 0, 5, 9, 3), expected: '2026-01-05T09:03:00Z' },
  ])(
    'formats as $expected: ISO 8601 UTC without milliseconds',
    ({ ms, expected }) => {
      expect(formatTimestamp(ms)).toBe(expected)
    },
  )
})

describe('parseMinuteTimestamp', () => {
  it('parses an ISO 8601 UTC minute into epoch milliseconds', () => {
    expect(parseMinuteTimestamp('2026-08-25T14:07:00Z')).toBe(
      Date.UTC(2026, 7, 25, 14, 7),
    )
  })

  it.each([
    { label: 'a space instead of T', text: '2026-08-25 14:07:00' },
    { label: 'no Z, read as local time', text: '2026-08-25T14:07:00' },
    { label: 'milliseconds', text: '2026-08-25T14:07:00.000Z' },
    { label: 'a numeric offset', text: '2026-08-25T14:07:00+00:00' },
    { label: 'RFC 2822', text: 'Tue, 25 Aug 2026 14:07:00 GMT' },
    { label: 'a second other than 0', text: '2026-08-25T14:07:30Z' },
    { label: 'an impossible date', text: '2026-02-30T14:07:00Z' },
    { label: 'hour 24', text: '2026-08-25T24:00:00Z' },
    { label: 'hour 25', text: '2026-08-25T25:00:00Z' },
    { label: 'an empty string', text: '' },
  ])('rejects $label', ({ text }) => {
    expect(parseMinuteTimestamp(text)).toBeNull()
  })
})
