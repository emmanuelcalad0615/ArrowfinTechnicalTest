import { readFile } from 'node:fs/promises'
import { isInstrument, type Candle } from '../domain/candle.ts'
import { parseMinuteTimestamp } from '../domain/timestamp.ts'

export type CandleRowError =
  'NOT_AN_OBJECT' | 'INVALID_SYMBOL' | 'INVALID_TS' | 'INVALID_NUMBER'

export type CandleFileError =
  | { readonly kind: 'READ_FAILED'; readonly message: string }
  | { readonly kind: 'INVALID_JSON' }
  | { readonly kind: 'NOT_AN_ARRAY' }
  | {
      readonly kind: 'INVALID_ROW'
      readonly index: number
      readonly reason: CandleRowError
    }

export type CandleFileResult =
  | { readonly ok: true; readonly candles: readonly Candle[] }
  | { readonly ok: false; readonly error: CandleFileError }

export async function readCandleFile(
  path: string | URL,
): Promise<CandleFileResult> {
  let text: string
  try {
    text = await readFile(path, 'utf8')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { ok: false, error: { kind: 'READ_FAILED', message } }
  }
  return parseCandleFile(text)
}

export function parseCandleFile(text: string): CandleFileResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: { kind: 'INVALID_JSON' } }
  }
  if (!Array.isArray(data)) {
    return { ok: false, error: { kind: 'NOT_AN_ARRAY' } }
  }

  const rows: readonly unknown[] = data
  const candles: Candle[] = []
  for (const [index, row] of rows.entries()) {
    const parsed = parseRow(row)
    if (typeof parsed === 'string') {
      return {
        ok: false,
        error: { kind: 'INVALID_ROW', index, reason: parsed },
      }
    }
    candles.push(parsed)
  }
  return { ok: true, candles }
}

function parseRow(row: unknown): Candle | CandleRowError {
  if (!isRecord(row)) return 'NOT_AN_OBJECT'

  const { symbol, ts, open, high, low, close, volume } = row
  if (!isInstrument(symbol)) return 'INVALID_SYMBOL'

  const start = typeof ts === 'string' ? parseMinuteTimestamp(ts) : null
  if (start === null) return 'INVALID_TS'

  if (
    !isFiniteNumber(open) ||
    !isFiniteNumber(high) ||
    !isFiniteNumber(low) ||
    !isFiniteNumber(close) ||
    !isFiniteNumber(volume)
  ) {
    return 'INVALID_NUMBER'
  }

  return { symbol, ts: start, open, high, low, close, volume }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
