import { isInstrument, type Candle } from './candle.ts'
import { parseMinuteTimestamp } from './timestamp.ts'

export type CandleParseError =
  | 'NOT_AN_OBJECT'
  | 'INVALID_SYMBOL'
  | 'INVALID_TS'
  | 'INVALID_OPEN'
  | 'INVALID_HIGH'
  | 'INVALID_LOW'
  | 'INVALID_CLOSE'
  | 'INVALID_VOLUME'
  | 'HIGH_BELOW_LOW'

export type CandleParseResult =
  | { readonly ok: true; readonly candle: Candle }
  | { readonly ok: false; readonly error: CandleParseError }

/** Validates one raw row (for example from `JSON.parse`) and returns a `Candle`, or the first rule it breaks. */
export function parseCandle(value: unknown): CandleParseResult {
  if (!isRecord(value)) return failure('NOT_AN_OBJECT')

  const { symbol, ts, open, high, low, close, volume } = value
  if (!isInstrument(symbol)) return failure('INVALID_SYMBOL')

  const start = typeof ts === 'string' ? parseMinuteTimestamp(ts) : null
  if (start === null) return failure('INVALID_TS')

  if (!isFiniteNumber(open)) return failure('INVALID_OPEN')
  if (!isFiniteNumber(high)) return failure('INVALID_HIGH')
  if (!isFiniteNumber(low)) return failure('INVALID_LOW')
  if (!isFiniteNumber(close)) return failure('INVALID_CLOSE')
  if (!isNonNegativeInteger(volume)) return failure('INVALID_VOLUME')
  if (high < low) return failure('HIGH_BELOW_LOW')

  return {
    ok: true,
    candle: { symbol, ts: start, open, high, low, close, volume },
  }
}

function failure(error: CandleParseError): CandleParseResult {
  return { ok: false, error }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}
