import { byTimeThenSymbol, candleKey, type Candle } from './candle.ts'
import { normalizeCandles } from './normalize-candles.ts'
import { bucketStart, type Timeframe } from './timeframe.ts'

export function aggregateCandles(
  candles: readonly Candle[],
  timeframe: Timeframe,
): Candle[] {
  const buckets = new Map<string, Candle>()

  for (const candle of normalizeCandles(candles)) {
    const start = bucketStart(candle.ts, timeframe)
    const key = candleKey(candle.symbol, start)
    const bucket = buckets.get(key)

    buckets.set(
      key,
      bucket === undefined
        ? { ...candle, ts: start }
        : mergeCandles(bucket, candle),
    )
  }

  return [...buckets.values()].sort(byTimeThenSymbol)
}

// Assumes `next` is later than every candle already merged into `bucket`.
function mergeCandles(bucket: Candle, next: Candle): Candle {
  return {
    ...bucket,
    high: Math.max(bucket.high, next.high),
    low: Math.min(bucket.low, next.low),
    close: next.close,
    volume: bucket.volume + next.volume,
  }
}
