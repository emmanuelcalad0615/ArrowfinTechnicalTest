import { describe, expect, it } from 'vitest'
import type { Candle } from '../../domain/candle.ts'
import { toApiCandle } from './api-candle.ts'

describe('toApiCandle', () => {
  it('serializes to exactly t, o, h, l, c, v with t in ISO 8601 UTC without milliseconds', () => {
    const candle: Candle = {
      symbol: 'MES',
      ts: Date.UTC(2026, 7, 25, 13, 30),
      open: 5630,
      high: 5631.5,
      low: 5629.25,
      close: 5631,
      volume: 1520,
    }

    expect(JSON.stringify(toApiCandle(candle))).toBe(
      '{"t":"2026-08-25T13:30:00Z","o":5630,"h":5631.5,"l":5629.25,"c":5631,"v":1520}',
    )
  })
})
