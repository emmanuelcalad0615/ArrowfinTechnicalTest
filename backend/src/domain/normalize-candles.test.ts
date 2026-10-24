import { describe, expect, it } from 'vitest'
import type { Candle } from './candle.ts'
import { normalizeCandles } from './normalize-candles.ts'

function candle(time: string, volume = 10): Candle {
  return {
    symbol: 'MES',
    ts: Date.parse(`2026-08-25T${time}:00Z`),
    open: 100,
    high: 101,
    low: 99,
    close: 100.5,
    volume,
  }
}

const first = candle('14:05')
const second = candle('14:06')
const third = candle('14:07')

describe('normalizeCandles', () => {
  it('removes exact duplicates by symbol and ts', () => {
    const input = [first, second, { ...second }, third, { ...first }]

    expect(normalizeCandles(input)).toEqual([first, second, third])
  })

  it('returns candles sorted by ts ascending', () => {
    expect(normalizeCandles([third, first, second])).toEqual([
      first,
      second,
      third,
    ])
  })

  it('keeps the first appearance when two rows share symbol and ts', () => {
    const resent = candle('14:05', 999)

    expect(normalizeCandles([first, resent])).toEqual([first])
  })

  it('does not modify the input array', () => {
    const input = [third, first, { ...first }, second]
    const snapshot = [...input]

    normalizeCandles(input)

    expect(input).toEqual(snapshot)
  })

  it('returns an empty array for an empty input', () => {
    expect(normalizeCandles([])).toEqual([])
  })
})
