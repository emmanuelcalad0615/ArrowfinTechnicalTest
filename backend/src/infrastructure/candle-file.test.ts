import { describe, expect, it } from 'vitest'
import { parseCandleFile, readCandleFile } from './candle-file.ts'

const validRow = {
  symbol: 'MES',
  ts: '2026-08-25T14:07:00Z',
  open: 5630,
  high: 5631.5,
  low: 5629.25,
  close: 5631,
  volume: 1520,
}

function fileWith(...rows: unknown[]): string {
  return JSON.stringify(rows)
}

describe('parseCandleFile', () => {
  it('turns valid rows into candles with ts in epoch milliseconds', () => {
    expect(parseCandleFile(fileWith(validRow))).toEqual({
      ok: true,
      candles: [{ ...validRow, ts: Date.UTC(2026, 7, 25, 14, 7) }],
    })
  })

  it('rejects text that is not JSON', () => {
    expect(parseCandleFile('not json')).toEqual({
      ok: false,
      error: { kind: 'INVALID_JSON' },
    })
  })

  it('rejects JSON that is not an array', () => {
    expect(parseCandleFile('{}')).toEqual({
      ok: false,
      error: { kind: 'NOT_AN_ARRAY' },
    })
  })

  it.each([
    {
      label: 'a row that is not an object',
      row: null,
      reason: 'NOT_AN_OBJECT',
    },
    {
      label: 'an unknown symbol',
      row: { ...validRow, symbol: 'ES' },
      reason: 'INVALID_SYMBOL',
    },
    {
      label: 'a ts that is not a string',
      row: { ...validRow, ts: Date.UTC(2026, 7, 25, 14, 7) },
      reason: 'INVALID_TS',
    },
    {
      label: 'a ts that Date.parse accepts but is not ISO 8601 UTC',
      row: { ...validRow, ts: 'Tue, 25 Aug 2026 14:07:00 GMT' },
      reason: 'INVALID_TS',
    },
    {
      label: 'a ts that is not on second 0',
      row: { ...validRow, ts: '2026-08-25T14:07:30Z' },
      reason: 'INVALID_TS',
    },
    {
      label: 'a price that is a string',
      row: { ...validRow, open: '5630' },
      reason: 'INVALID_NUMBER',
    },
    {
      label: 'a missing volume',
      row: { ...validRow, volume: undefined },
      reason: 'INVALID_NUMBER',
    },
  ])('rejects $label', ({ row, reason }) => {
    expect(parseCandleFile(fileWith(row))).toEqual({
      ok: false,
      error: { kind: 'INVALID_ROW', index: 0, reason },
    })
  })

  it('rejects a price that JSON parses as Infinity', () => {
    const text = fileWith(validRow).replace('"open":5630', '"open":1e999')

    expect(parseCandleFile(text)).toEqual({
      ok: false,
      error: { kind: 'INVALID_ROW', index: 0, reason: 'INVALID_NUMBER' },
    })
  })

  it('reports the index of the first invalid row', () => {
    const invalid = { ...validRow, symbol: 'ES' }

    expect(parseCandleFile(fileWith(validRow, validRow, invalid))).toEqual({
      ok: false,
      error: { kind: 'INVALID_ROW', index: 2, reason: 'INVALID_SYMBOL' },
    })
  })
})

describe('readCandleFile', () => {
  it('loads every row of the assessment dataset', async () => {
    const result = await readCandleFile(
      new URL('../../../candles_1m.json', import.meta.url),
    )

    expect(result.ok && result.candles.length).toBe(775)
  })

  it('returns READ_FAILED when the file does not exist', async () => {
    const result = await readCandleFile(
      new URL('./does-not-exist.json', import.meta.url),
    )

    expect(result).toMatchObject({ ok: false, error: { kind: 'READ_FAILED' } })
  })
})
