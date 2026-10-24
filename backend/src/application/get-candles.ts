import { aggregate } from '../domain/aggregate-candles.ts'
import type { Candle, Instrument } from '../domain/candle.ts'
import type { CandleRepository } from '../domain/candle-repository.ts'
import type { Timeframe } from '../domain/timeframe.ts'

/** Aggregated candles of one symbol, sorted from oldest to newest. */
export type GetCandles = (symbol: Instrument, timeframe: Timeframe) => Candle[]

export function createGetCandles(repository: CandleRepository): GetCandles {
  return (symbol, timeframe) =>
    aggregate(repository.findBySymbol(symbol), timeframe)
}
