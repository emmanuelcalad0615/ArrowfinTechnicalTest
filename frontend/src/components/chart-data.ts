import type { CandlestickData, UTCTimestamp } from 'lightweight-charts'
import type { ApiCandle } from '../api/candles.ts'

/** Converts API candles to chart points. lightweight-charts shows `UTCTimestamp` values in UTC. */
export function toChartCandles(
  candles: readonly ApiCandle[],
): CandlestickData<UTCTimestamp>[] {
  return candles.flatMap((candle) => {
    const time = Date.parse(candle.t) / 1000
    return isUtcTimestamp(time)
      ? [
          {
            time,
            open: candle.o,
            high: candle.h,
            low: candle.l,
            close: candle.c,
          },
        ]
      : []
  })
}

function isUtcTimestamp(value: number): value is UTCTimestamp {
  return Number.isInteger(value)
}
