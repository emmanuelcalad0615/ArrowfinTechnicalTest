import { describe, expect, it } from 'vitest'
import { parseCandle, type CandleParseError } from './parse-candle.ts'

const validRow = {
  symbol: 'MES',
  ts: '2026-08-25T14:07:00Z',
  open: 5630,
  high: 5631.5,
  low: 5629.25,
  close: 5631,
  volume: 1520,
}

describe('parseCandle', () => {
  it('turns a valid row into a candle with ts in epoch milliseconds', () => {
    expect(parseCandle(validRow)).toEqual({
      ok: true,
      candle: { ...validRow, ts: Date.UTC(2026, 7, 25, 14, 7) },
    })
  })

  it('accepts a row where high equals low', () => {
    const flat = { ...validRow, open: 5630, high: 5630, low: 5630, close: 5630 }

    expect(parseCandle(flat)).toMatchObject({ ok: true })
  })

  it.each<{ label: string; value: unknown; error: CandleParseError }>([
    { label: 'null', value: null, error: 'NOT_AN_OBJECT' },
    { label: 'an array', value: [validRow], error: 'NOT_AN_OBJECT' },
    { label: 'a string', value: 'MES', error: 'NOT_AN_OBJECT' },
    {
      label: 'an unknown symbol',
      value: { ...validRow, symbol: 'ES' },
      error: 'INVALID_SYMBOL',
    },
    {
      label: 'a ts that is not ISO 8601',
      value: { ...validRow, ts: '25/08/2026 14:07' },
      error: 'INVALID_TS',
    },
    {
      label: 'a ts that is not a string',
      value: { ...validRow, ts: Date.UTC(2026, 7, 25, 14, 7) },
      error: 'INVALID_TS',
    },
    {
      label: 'an open that is a string',
      value: { ...validRow, open: '5630' },
      error: 'INVALID_OPEN',
    },
    {
      label: 'a high that is Infinity',
      value: { ...validRow, high: Number.POSITIVE_INFINITY },
      error: 'INVALID_HIGH',
    },
    {
      label: 'a low that is NaN',
      value: { ...validRow, low: Number.NaN },
      error: 'INVALID_LOW',
    },
    {
      label: 'a missing close',
      value: { ...validRow, close: undefined },
      error: 'INVALID_CLOSE',
    },
    {
      label: 'a negative volume',
      value: { ...validRow, volume: -1 },
      error: 'INVALID_VOLUME',
    },
    {
      label: 'a fractional volume',
      value: { ...validRow, volume: 1.5 },
      error: 'INVALID_VOLUME',
    },
    {
      label: 'a volume that is a string',
      value: { ...validRow, volume: '1520' },
      error: 'INVALID_VOLUME',
    },
    {
      label: 'a high below the low',
      value: { ...validRow, high: 5629, low: 5629.25 },
      error: 'HIGH_BELOW_LOW',
    },
  ])('rejects $label with $error', ({ value, error }) => {
    expect(parseCandle(value)).toEqual({ ok: false, error })
  })
})
