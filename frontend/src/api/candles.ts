export const SYMBOLS = ['MES', 'NQ'] as const
export type Instrument = (typeof SYMBOLS)[number]

export const TIMEFRAMES = ['1m', '5m', '15m', '1h'] as const
export type Timeframe = (typeof TIMEFRAMES)[number]

/** One candle as `GET /candles` sends it. Mirrors the backend `ApiCandle` and is checked at runtime. */
export interface ApiCandle {
  readonly t: string
  readonly o: number
  readonly h: number
  readonly l: number
  readonly c: number
  readonly v: number
}

interface CandlesResponse {
  readonly symbol: Instrument
  readonly tf: Timeframe
  readonly candles: readonly ApiCandle[]
}

interface ErrorResponse {
  readonly error: { readonly code: string; readonly message: string }
}

export type CandlesResult =
  | { readonly ok: true; readonly candles: readonly ApiCandle[] }
  | { readonly ok: false; readonly message: string }

const ISO_UTC_SECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/

/** Calls `GET /candles`. Never throws: network, HTTP, and shape problems become `{ ok: false, message }`. */
export async function fetchCandles(
  symbol: Instrument,
  tf: Timeframe,
  signal: AbortSignal,
): Promise<CandlesResult> {
  const params = new URLSearchParams({ symbol, tf })
  let response: Response
  try {
    response = await fetch(`/candles?${params.toString()}`, { signal })
  } catch {
    return failure('Could not reach the server.')
  }

  const body = await readJson(response)
  if (!response.ok) {
    return failure(
      isErrorResponse(body)
        ? body.error.message
        : `Request failed with status ${String(response.status)}.`,
    )
  }
  // The envelope echoes the request, so a response for another selection is rejected.
  if (!isCandlesResponse(body) || body.symbol !== symbol || body.tf !== tf) {
    return failure('Unexpected response from the server.')
  }
  return { ok: true, candles: body.candles }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    const body: unknown = await response.json()
    return body
  } catch {
    return null
  }
}

function failure(message: string): CandlesResult {
  return { ok: false, message }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isInstrument(value: unknown): value is Instrument {
  return SYMBOLS.some((symbol) => symbol === value)
}

function isTimeframe(value: unknown): value is Timeframe {
  return TIMEFRAMES.some((timeframe) => timeframe === value)
}

function isApiCandle(value: unknown): value is ApiCandle {
  return (
    isRecord(value) &&
    typeof value.t === 'string' &&
    ISO_UTC_SECONDS.test(value.t) &&
    isFiniteNumber(value.o) &&
    isFiniteNumber(value.h) &&
    isFiniteNumber(value.l) &&
    isFiniteNumber(value.c) &&
    isFiniteNumber(value.v)
  )
}

function isCandlesResponse(value: unknown): value is CandlesResponse {
  return (
    isRecord(value) &&
    isInstrument(value.symbol) &&
    isTimeframe(value.tf) &&
    Array.isArray(value.candles) &&
    value.candles.every(isApiCandle)
  )
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    isRecord(value) &&
    isRecord(value.error) &&
    typeof value.error.code === 'string' &&
    typeof value.error.message === 'string'
  )
}
