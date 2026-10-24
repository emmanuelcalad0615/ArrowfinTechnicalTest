import type { Candle } from '../../domain/candle.ts'
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
