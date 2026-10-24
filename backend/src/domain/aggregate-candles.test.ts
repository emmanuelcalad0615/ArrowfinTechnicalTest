import { describe, expect, it } from 'vitest'
import { aggregateCandles } from './aggregate-candles.ts'
import type { Candle, Instrument } from './candle.ts'
import type { Timeframe } from './timeframe.ts'

type Prices = Pick<Candle, 'open' | 'high' | 'low' | 'close' | 'volume'>

function at(time: string): number {
  return Date.parse(`2026-08-25T${time}:00Z`)
}

function candle(
  time: string,
  prices: Prices,
  symbol: Instrument = 'MES',
): Candle {
  return { symbol, ts: at(time), ...prices }
}

const first = candle('14:05', {
  open: 100,
  high: 101,
  low: 99.5,
  close: 100.5,
  volume: 20,
})
const second = candle('14:06', {
  open: 100.5,
  high: 102,
  low: 100,
  close: 101,
  volume: 10,
})
const third = candle('14:07', {
  open: 101,
  high: 101.5,
  low: 98,
  close: 99,
  volume: 30,
})

const firstThreeAggregated = candle('14:05', {
  open: 100,
  high: 102,
  low: 98,
  close: 99,
  volume: 60,
})

describe('aggregateCandles', () => {
  it('takes open of the first, close of the last, highest high, lowest low, and summed volume', () => {
    expect(aggregateCandles([first, second, third], '5m')).toEqual([
      firstThreeAggregated,
    ])
  })

  it('ignores duplicate rows with the same symbol and ts', () => {
    const withDuplicates = [first, second, { ...second }, third, { ...first }]

    expect(aggregateCandles(withDuplicates, '5m')).toEqual([
      firstThreeAggregated,
    ])
  })

  it('orders unsorted input by time and returns candles from oldest to newest', () => {
    const later = candle('14:10', {
      open: 99,
      high: 100,
      low: 98.5,
      close: 99.5,
      volume: 5,
    })

    expect(aggregateCandles([later, third, first, second], '5m')).toEqual([
      firstThreeAggregated,
      later,
    ])
  })

  it('does not modify its input', () => {
    const input = [third, first, second]

    aggregateCandles(input, '5m')

    expect(input).toEqual([third, first, second])
  })

  it('aggregates only the minutes that exist and omits empty intervals', () => {
    const afterGap = candle('14:08', {
      open: 99,
      high: 103,
      low: 97,
      close: 102,
      volume: 15,
    })
    const afterEmptyIntervals = candle('14:20', {
      open: 102,
      high: 102.5,
      low: 101.5,
      close: 102,
      volume: 8,
    })

    expect(
      aggregateCandles([first, afterGap, afterEmptyIntervals], '5m'),
    ).toEqual([
      candle('14:05', {
        open: 100,
        high: 103,
        low: 97,
        close: 102,
        volume: 35,
      }),
      afterEmptyIntervals,
    ])
  })

  it.each<{ timeframe: Timeframe; time: string; expectedStart: string }>([
    { timeframe: '1m', time: '14:07', expectedStart: '14:07' },
    { timeframe: '5m', time: '14:07', expectedStart: '14:05' },
    { timeframe: '5m', time: '14:04', expectedStart: '14:00' },
    { timeframe: '15m', time: '14:07', expectedStart: '14:00' },
    { timeframe: '15m', time: '14:59', expectedStart: '14:45' },
    { timeframe: '1h', time: '14:59', expectedStart: '14:00' },
  ])(
    'puts a $time candle in the $timeframe interval that starts at $expectedStart UTC',
    ({ timeframe, time, expectedStart }) => {
      const [aggregated] = aggregateCandles(
        [candle(time, { open: 1, high: 1, low: 1, close: 1, volume: 1 })],
        timeframe,
      )

      expect(aggregated?.ts).toBe(at(expectedStart))
    },
  )

  it('never merges candles from different symbols', () => {
    const nq = candle(
      '14:06',
      { open: 19600, high: 19610, low: 19590, close: 19605, volume: 4 },
      'NQ',
    )

    expect(aggregateCandles([first, nq], '5m')).toEqual([
      first,
      { ...nq, ts: at('14:05') },
    ])
  })
})
