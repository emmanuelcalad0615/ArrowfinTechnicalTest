import type { Candle, Instrument } from '../../domain/candle.ts'
import type { Timeframe } from '../../domain/timeframe.ts'
import { formatTimestamp } from '../../domain/timestamp.ts'

/** One candle in the `GET /candles` response. Short keys match the assessment example. */
export interface ApiCandle {
  readonly t: string
  readonly o: number
  readonly h: number
  readonly l: number
  readonly c: number
  readonly v: number
}

export function toApiCandle(candle: Candle): ApiCandle {
  return {
    t: formatTimestamp(candle.ts),
    o: candle.open,
    h: candle.high,
    l: candle.low,
    c: candle.close,
    v: candle.volume,
  }
}

/** Body of `GET /candles`: `{ "symbol", "tf", "candles": [...] }`. */
export interface CandlesResponse {
  readonly symbol: Instrument
  readonly tf: Timeframe
  readonly candles: readonly ApiCandle[]
}

export function toCandlesResponse(
  symbol: Instrument,
  tf: Timeframe,
  candles: readonly Candle[],
): CandlesResponse {
  return { symbol, tf, candles: candles.map(toApiCandle) }
}
