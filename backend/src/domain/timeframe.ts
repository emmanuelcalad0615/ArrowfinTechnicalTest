export const TIMEFRAMES = ['1m', '5m', '15m', '1h'] as const

export type Timeframe = (typeof TIMEFRAMES)[number]

export function isTimeframe(value: unknown): value is Timeframe {
  return TIMEFRAMES.some((timeframe) => timeframe === value)
}

export const MS_PER_MINUTE = 60_000

export const TIMEFRAME_MS: Readonly<Record<Timeframe, number>> = {
  '1m': MS_PER_MINUTE,
  '5m': 5 * MS_PER_MINUTE,
  '15m': 15 * MS_PER_MINUTE,
  '1h': 60 * MS_PER_MINUTE,
}

/** Start of the `timeframe` interval that contains `ts`. Both values are epoch milliseconds. */
export function bucketStart(ts: number, timeframe: Timeframe): number {
  const durationMs = TIMEFRAME_MS[timeframe]
  // Epoch time starts at a UTC midnight, so flooring aligns intervals to the UTC clock
  // without reading the system time zone.
  return Math.floor(ts / durationMs) * durationMs
}
