import type { Candle, Instrument } from './candle.ts'

export interface CandleRepository {
  /** The 1-minute candles of `symbol` as stored: not deduplicated or sorted. Empty when there are none. */
  findBySymbol(symbol: Instrument): readonly Candle[]
}
