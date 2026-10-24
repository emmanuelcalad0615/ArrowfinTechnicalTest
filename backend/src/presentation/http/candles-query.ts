import { isInstrument, SYMBOLS, type Instrument } from '../../domain/candle.ts'
import {
  isTimeframe,
  TIMEFRAMES,
  type Timeframe,
} from '../../domain/timeframe.ts'
import type { ApiError, ApiErrorCode } from './api-error.ts'

export interface CandlesQuery {
  readonly symbol: Instrument
  readonly tf: Timeframe
}

export type CandlesQueryResult =
  | { readonly ok: true; readonly query: CandlesQuery }
  | { readonly ok: false; readonly error: ApiError }

const SYMBOL_VALUES = SYMBOLS.join(', ')
const TIMEFRAME_VALUES = TIMEFRAMES.join(', ')

const MESSAGES: Readonly<Record<ApiErrorCode, string>> = {
  MISSING_SYMBOL: `Query parameter "symbol" is required. Accepted values: ${SYMBOL_VALUES}.`,
  INVALID_SYMBOL: `Query parameter "symbol" must be exactly one of: ${SYMBOL_VALUES}.`,
  MISSING_TIMEFRAME: `Query parameter "tf" is required. Accepted values: ${TIMEFRAME_VALUES}.`,
  INVALID_TIMEFRAME: `Query parameter "tf" must be exactly one of: ${TIMEFRAME_VALUES}.`,
}

/**
 * Validates `req.query` for `GET /candles`. Values must match exactly (no case folding).
 * Express turns a repeated parameter into an array, which fails the guards.
 */
export function parseCandlesQuery(
  query: Readonly<Record<string, unknown>>,
): CandlesQueryResult {
  const { symbol, tf } = query

  if (isAbsent(symbol)) return failure('MISSING_SYMBOL')
  if (!isInstrument(symbol)) return failure('INVALID_SYMBOL')
  if (isAbsent(tf)) return failure('MISSING_TIMEFRAME')
  if (!isTimeframe(tf)) return failure('INVALID_TIMEFRAME')

  return { ok: true, query: { symbol, tf } }
}

function isAbsent(value: unknown): boolean {
  return value === undefined || value === ''
}

function failure(code: ApiErrorCode): CandlesQueryResult {
  return { ok: false, error: { code, message: MESSAGES[code] } }
}
