import { describe, expect, it } from 'vitest'
import { bucketStart, isTimeframe, type Timeframe } from './timeframe.ts'

function at(time: string): number {
  return Date.parse(`2026-08-25T${time}:00Z`)
}

describe('isTimeframe', () => {
  it.each(['1m', '5m', '15m', '1h'])('accepts %s', (value) => {
    expect(isTimeframe(value)).toBe(true)
  })

  it.each([
    { label: 'an unsupported timeframe', value: '2m' },
    { label: 'a day timeframe', value: '1d' },
    { label: 'an empty string', value: '' },
    { label: 'uppercase minutes', value: '5M' },
    { label: 'uppercase hours', value: '1H' },
    { label: 'surrounding spaces', value: ' 1m ' },
    { label: 'undefined', value: undefined },
    { label: 'null', value: null },
    { label: 'a number of minutes', value: 5 },
    { label: 'a duration in milliseconds', value: 300_000 },
    { label: 'an array with a valid timeframe', value: ['1m'] },
  ])('rejects $label', ({ value }) => {
    expect(isTimeframe(value)).toBe(false)
  })
})

describe('bucketStart', () => {
  it.each<{ time: string; timeframe: Timeframe; expected: string }>([
    { time: '14:07', timeframe: '5m', expected: '14:05' },
    { time: '14:05', timeframe: '5m', expected: '14:05' },
    { time: '14:14', timeframe: '15m', expected: '14:00' },
    { time: '13:30', timeframe: '1h', expected: '13:00' },
    { time: '14:07', timeframe: '1m', expected: '14:07' },
  ])(
    'puts $time in the $timeframe interval that starts at $expected UTC',
    ({ time, timeframe, expected }) => {
      expect(bucketStart(at(time), timeframe)).toBe(at(expected))
    },
  )
})
