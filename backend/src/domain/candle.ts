export const SYMBOLS = ['MES', 'NQ'] as const

export type Instrument = (typeof SYMBOLS)[number]

export function isInstrument(value: unknown): value is Instrument {
  return SYMBOLS.some((symbol) => symbol === value)
}

export interface Candle {
  readonly symbol: Instrument
  /** Start of the candle's interval, in Unix epoch milliseconds (UTC). */
  readonly ts: number
  readonly open: number
  readonly high: number
  readonly low: number
  readonly close: number
  readonly volume: number
}

/** Identity of a candle: two rows with the same key are the same candle. */
export function candleKey(symbol: Instrument, ts: number): string {
  return `${symbol}|${String(ts)}`
}

export function byTimeThenSymbol(a: Candle, b: Candle): number {
  return a.ts - b.ts || a.symbol.localeCompare(b.symbol)
}
