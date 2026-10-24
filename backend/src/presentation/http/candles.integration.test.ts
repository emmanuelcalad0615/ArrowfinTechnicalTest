import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGetCandles } from '../../application/get-candles.ts'
import { SYMBOLS, type Candle, type Instrument } from '../../domain/candle.ts'
import type { CandleRepository } from '../../domain/candle-repository.ts'
import { TIMEFRAMES } from '../../domain/timeframe.ts'
import {
  DATASET_FILE,
  loadCandleRepository,
} from '../../infrastructure/in-memory-candle-repository.ts'
import { createApp } from './app.ts'

function candle(
  symbol: Instrument,
  time: string,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number,
): Candle {
  return {
    symbol,
    ts: Date.parse(`2026-08-25T${time}:00Z`),
    open,
    high,
    low,
    close,
    volume,
  }
}

// Unsorted, with a duplicate row and a gap (14:08 and 14:09 are missing), like the real dataset.
const knownCandles: Record<Instrument, readonly Candle[]> = {
  MES: [
    candle('MES', '14:10', 99, 100, 98.5, 99.5, 5),
    candle('MES', '14:07', 101, 101.5, 98, 99, 30),
    candle('MES', '14:05', 100, 101, 99.5, 100.5, 20),
    candle('MES', '14:06', 100.5, 102, 100, 101, 10),
    candle('MES', '14:05', 100, 101, 99.5, 100.5, 20),
  ],
  NQ: [candle('NQ', '14:05', 19600, 19610, 19590, 19605, 4)],
}

const fakeRepository: CandleRepository = {
  findBySymbol: (symbol) => knownCandles[symbol],
}

function appWith(repository: CandleRepository) {
  return createApp({ getCandles: createGetCandles(repository) })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GET /candles with a fake repository', () => {
  it('responds 200 with the exact JSON for the known data', async () => {
    const response = await request(appWith(fakeRepository)).get(
      '/candles?symbol=MES&tf=5m',
    )

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/^application\/json/)
    expect(response.text).toBe(
      '{"symbol":"MES","tf":"5m","candles":[' +
        '{"t":"2026-08-25T14:05:00Z","o":100,"h":102,"l":98,"c":99,"v":60},' +
        '{"t":"2026-08-25T14:10:00Z","o":99,"h":100,"l":98.5,"c":99.5,"v":5}' +
        ']}',
    )
  })

  it('returns candles in ascending time order, once each, from unsorted rows', async () => {
    const response = await request(appWith(fakeRepository)).get(
      '/candles?symbol=MES&tf=1m',
    )
    const times: string[] = response.body.candles.map(
      (item: { t: string }) => item.t,
    )

    expect(times).toEqual([
      '2026-08-25T14:05:00Z',
      '2026-08-25T14:06:00Z',
      '2026-08-25T14:07:00Z',
      '2026-08-25T14:10:00Z',
    ])
  })

  it.each([
    {
      query: 'tf=5m',
      code: 'MISSING_SYMBOL',
      message:
        'Query parameter "symbol" is required. Accepted values: MES, NQ.',
    },
    {
      query: 'symbol=&tf=5m',
      code: 'MISSING_SYMBOL',
      message:
        'Query parameter "symbol" is required. Accepted values: MES, NQ.',
    },
    {
      query: 'symbol=ES&tf=5m',
      code: 'INVALID_SYMBOL',
      message: 'Query parameter "symbol" must be exactly one of: MES, NQ.',
    },
    {
      query: 'symbol=mes&tf=5m',
      code: 'INVALID_SYMBOL',
      message: 'Query parameter "symbol" must be exactly one of: MES, NQ.',
    },
    {
      query: 'symbol=MES',
      code: 'MISSING_TIMEFRAME',
      message:
        'Query parameter "tf" is required. Accepted values: 1m, 5m, 15m, 1h.',
    },
    {
      query: 'symbol=MES&tf=2m',
      code: 'INVALID_TIMEFRAME',
      message: 'Query parameter "tf" must be exactly one of: 1m, 5m, 15m, 1h.',
    },
    {
      query: 'symbol=MES&tf=5M',
      code: 'INVALID_TIMEFRAME',
      message: 'Query parameter "tf" must be exactly one of: 1m, 5m, 15m, 1h.',
    },
  ])(
    'responds 400 with $code for ?$query',
    async ({ query, code, message }) => {
      const response = await request(appWith(fakeRepository)).get(
        `/candles?${query}`,
      )

      expect(response.status).toBe(400)
      expect(response.body).toEqual({ error: { code, message } })
    },
  )

  it.each([
    { query: 'symbol=MES&tf=5m&tf=1h', code: 'INVALID_TIMEFRAME' },
    { query: 'symbol=MES&tf=5m&tf=5m', code: 'INVALID_TIMEFRAME' },
    { query: 'symbol=MES&symbol=NQ&tf=5m', code: 'INVALID_SYMBOL' },
  ])(
    'responds 400 with $code for a repeated parameter: ?$query',
    async ({ query, code }) => {
      const response = await request(appWith(fakeRepository)).get(
        `/candles?${query}`,
      )

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({ error: { code } })
    },
  )

  it('responds 404 with NOT_FOUND for a route that does not exist', async () => {
    const response = await request(appWith(fakeRepository)).get('/candle')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route not found.' },
    })
  })

  it('responds 500 with a generic INTERNAL_ERROR when the repository fails, without leaking details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const failingRepository: CandleRepository = {
      findBySymbol: () => {
        throw new Error('ENOENT: /srv/secret/candles_1m.json')
      },
    }

    const response = await request(appWith(failingRepository)).get(
      '/candles?symbol=MES&tf=5m',
    )

    expect(response.status).toBe(500)
    expect(response.text).toBe(
      '{"error":{"code":"INTERNAL_ERROR","message":"An unexpected error occurred."}}',
    )
    expect(response.text).not.toMatch(/ENOENT|secret|\.json|at /)
  })
})

describe('GET /candles with the real dataset', () => {
  it.each(
    SYMBOLS.flatMap((symbol) => TIMEFRAMES.map((tf) => ({ symbol, tf }))),
  )(
    'returns no NaN, null, or undefined in any $symbol $tf candle',
    async ({ symbol, tf }) => {
      const app = appWith(await loadCandleRepository(DATASET_FILE))

      const response = await request(app).get(
        `/candles?symbol=${symbol}&tf=${tf}`,
      )
      const candles: Record<string, unknown>[] = response.body.candles

      expect(response.status).toBe(200)
      expect(candles.length).toBeGreaterThan(0)
      // JSON has no NaN: JSON.stringify turns NaN and Infinity into null, so null also catches them.
      for (const item of candles) {
        expect(Object.keys(item)).toEqual(['t', 'o', 'h', 'l', 'c', 'v'])
        expect(item.t).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/)
        for (const key of ['o', 'h', 'l', 'c', 'v']) {
          expect(Number.isFinite(item[key])).toBe(true)
        }
      }
    },
  )
})
