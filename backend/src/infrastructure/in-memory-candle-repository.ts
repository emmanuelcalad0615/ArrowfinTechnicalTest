import { fileURLToPath } from 'node:url'
import type { Candle, Instrument } from '../domain/candle.ts'
import type { CandleRepository } from '../domain/candle-repository.ts'
import { readCandleFile, type CandleFileError } from './candle-file.ts'

// Resolved from this module, not from process.cwd(), so the server finds the file from any directory.
export const DATASET_FILE = new URL(
  '../../../dataset/candles_1m.json',
  import.meta.url,
)

export class CandleFileLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CandleFileLoadError'
  }
}

export function createInMemoryCandleRepository(
  candles: readonly Candle[],
): CandleRepository {
  const bySymbol = groupBySymbol(candles)
  return { findBySymbol: (symbol) => bySymbol.get(symbol) ?? [] }
}

/** Reads and validates the file once. Throws `CandleFileLoadError` so a bad file stops the server at startup, not during a request. */
export async function loadCandleRepository(
  path: string | URL,
): Promise<CandleRepository> {
  const result = await readCandleFile(path)
  if (!result.ok) {
    throw new CandleFileLoadError(describeError(result.error, path))
  }
  return createInMemoryCandleRepository(result.candles)
}

function groupBySymbol(
  candles: readonly Candle[],
): ReadonlyMap<Instrument, readonly Candle[]> {
  const bySymbol = new Map<Instrument, Candle[]>()
  for (const candle of candles) {
    const group = bySymbol.get(candle.symbol)
    if (group === undefined) {
      bySymbol.set(candle.symbol, [candle])
    } else {
      group.push(candle)
    }
  }
  return bySymbol
}

function describeError(error: CandleFileError, path: string | URL): string {
  const file = path instanceof URL ? fileURLToPath(path) : path
  switch (error.kind) {
    case 'READ_FAILED':
      return `Cannot read candle file ${file}: ${error.message}`
    case 'INVALID_JSON':
      return `Candle file ${file} is not valid JSON`
    case 'NOT_AN_ARRAY':
      return `Candle file ${file} must contain a JSON array of candles`
    case 'INVALID_ROW':
      return `Candle file ${file} has an invalid row at index ${String(error.index)}: ${error.reason}`
  }
}
