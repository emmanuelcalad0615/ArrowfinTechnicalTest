import { byTimeThenSymbol, candleKey, type Candle } from './candle.ts'

/** Returns the canonical 1-minute series: one candle per symbol and `ts`, sorted by `ts`. Never modifies `candles`. */
export function normalizeCandles(candles: readonly Candle[]): Candle[] {
  return removeDuplicates(candles).sort(byTimeThenSymbol)
}

// A duplicate is the same candle sent again, so keeping the first appearance loses nothing.
function removeDuplicates(candles: readonly Candle[]): Candle[] {
  const seen = new Set<string>()

  return candles.filter((candle) => {
    const key = candleKey(candle.symbol, candle.ts)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
