import { readFile } from 'node:fs/promises'
import type { Candle } from '../domain/candle.ts'
import { parseCandle, type CandleParseError } from '../domain/parse-candle.ts'

export type CandleFileError =
  | { readonly kind: 'READ_FAILED'; readonly message: string }
  | { readonly kind: 'INVALID_JSON' }
  | { readonly kind: 'NOT_AN_ARRAY' }
  | {
      readonly kind: 'INVALID_ROW'
      readonly index: number
      readonly reason: CandleParseError
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
    const parsed = parseCandle(row)
    if (!parsed.ok) {
      return {
        ok: false,
        error: { kind: 'INVALID_ROW', index, reason: parsed.error },
      }
    }
    candles.push(parsed.candle)
  }
  return { ok: true, candles }
}
