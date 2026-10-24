import { copyFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Candle } from '../domain/candle.ts'
import {
  CandleFileLoadError,
  createInMemoryCandleRepository,
  DATASET_FILE,
  loadCandleRepository,
} from './in-memory-candle-repository.ts'

function fixture(name: string): URL {
  return new URL(`./fixtures/${name}`, import.meta.url)
}

function at(time: string): number {
  return Date.parse(`2026-08-25T${time}:00Z`)
}

describe('loadCandleRepository', () => {
  it('loads a valid file and returns the candles of each symbol', async () => {
    const repository = await loadCandleRepository(fixture('valid.json'))

    expect(repository.findBySymbol('MES').map((candle) => candle.ts)).toEqual([
      at('14:06'),
      at('14:05'),
      at('14:07'),
    ])
    expect(repository.findBySymbol('NQ')).toEqual([
      {
        symbol: 'NQ',
        ts: at('14:05'),
        open: 19600,
        high: 19610,
        low: 19590,
        close: 19605,
        volume: 4,
      },
      {
        symbol: 'NQ',
        ts: at('14:06'),
        open: 19605,
        high: 19620,
        low: 19600,
        close: 19615,
        volume: 6,
      },
    ])
  })

  it('reads the file only once and keeps serving candles from memory', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'candles-'))
    const file = join(directory, 'candles.json')
    await copyFile(fixture('valid.json'), file)

    const repository = await loadCandleRepository(file)
    await rm(directory, { recursive: true })

    expect(repository.findBySymbol('MES')).toHaveLength(3)
  })

  it('loads the assessment dataset from its fixed path', async () => {
    const repository = await loadCandleRepository(DATASET_FILE)
    const total =
      repository.findBySymbol('MES').length +
      repository.findBySymbol('NQ').length

    expect(total).toBe(775)
  })

  it('throws a clear error when the file does not exist', async () => {
    const loading = loadCandleRepository(fixture('does-not-exist.json'))

    await expect(loading).rejects.toThrow(CandleFileLoadError)
    await expect(loading).rejects.toThrow(
      /^Cannot read candle file .*does-not-exist\.json/,
    )
  })

  it('throws a clear error when the file is not valid JSON', async () => {
    await expect(loadCandleRepository(fixture('broken.json'))).rejects.toThrow(
      /^Candle file .*broken\.json is not valid JSON$/,
    )
  })

  it('throws a clear error when the file is not a JSON array', async () => {
    await expect(
      loadCandleRepository(fixture('not-an-array.json')),
    ).rejects.toThrow(
      /^Candle file .*not-an-array\.json must contain a JSON array of candles$/,
    )
  })

  it('throws an error that names the invalid row and the broken rule', async () => {
    await expect(
      loadCandleRepository(fixture('invalid-row.json')),
    ).rejects.toThrow(
      /^Candle file .*invalid-row\.json has an invalid row at index 1: INVALID_VOLUME$/,
    )
  })
})

describe('createInMemoryCandleRepository', () => {
  it('returns an empty list for a symbol with no candles', () => {
    const mes: Candle = {
      symbol: 'MES',
      ts: at('14:05'),
      open: 100,
      high: 101,
      low: 99,
      close: 100.5,
      volume: 1,
    }

    expect(createInMemoryCandleRepository([mes]).findBySymbol('NQ')).toEqual([])
  })
})
