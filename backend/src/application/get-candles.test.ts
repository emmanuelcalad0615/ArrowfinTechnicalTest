import { describe, expect, it } from 'vitest'
import type { Candle, Instrument } from '../domain/candle.ts'
import type { CandleRepository } from '../domain/candle-repository.ts'
import { createGetCandles } from './get-candles.ts'

function candle(symbol: Instrument, time: string, close: number): Candle {
  return {
    symbol,
    ts: Date.parse(`2026-08-25T${time}:00Z`),
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 10,
  }
}

const candlesBySymbol: Record<Instrument, readonly Candle[]> = {
  MES: [
    candle('MES', '14:07', 103),
    candle('MES', '14:05', 101),
    candle('MES', '14:10', 104),
    candle('MES', '14:06', 102),
  ],
  NQ: [candle('NQ', '14:05', 19600), candle('NQ', '14:06', 19610)],
}

const fakeRepository: CandleRepository = {
  findBySymbol: (symbol) => candlesBySymbol[symbol],
}

describe('getCandles', () => {
  it('returns only candles of the requested symbol', () => {
    const getCandles = createGetCandles(fakeRepository)

    expect(getCandles('NQ', '1m')).toEqual([
      candle('NQ', '14:05', 19600),
      candle('NQ', '14:06', 19610),
    ])
  })

  it('aggregates the candles into the requested timeframe', () => {
    const getCandles = createGetCandles(fakeRepository)

    expect(getCandles('MES', '5m')).toEqual([
      {
        symbol: 'MES',
        ts: Date.parse('2026-08-25T14:05:00Z'),
        open: 101,
        high: 104,
        low: 100,
        close: 103,
        volume: 30,
      },
      candle('MES', '14:10', 104),
    ])
  })
})
