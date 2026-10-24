import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createGetCandles,
  type GetCandles,
} from '../../application/get-candles.ts'
import type { Candle } from '../../domain/candle.ts'
import {
  DATASET_FILE,
  loadCandleRepository,
} from '../../infrastructure/in-memory-candle-repository.ts'
import { createApp } from './app.ts'

const aggregated: Candle = {
  symbol: 'MES',
  ts: Date.UTC(2026, 7, 25, 14, 5),
  open: 100,
  high: 102,
  low: 98,
  close: 99,
  volume: 60,
}

function appWith(getCandles: GetCandles) {
  return createApp({ getCandles })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GET /health', () => {
  it('responds 200 with status ok', async () => {
    const response = await request(appWith(() => [])).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})

describe('GET /candles', () => {
  it('responds 200 with exactly { symbol, tf, candles: [{ t, o, h, l, c, v }] }', async () => {
    const getCandles = vi.fn<GetCandles>(() => [aggregated])

    const response = await request(appWith(getCandles)).get(
      '/candles?symbol=MES&tf=5m',
    )

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/^application\/json/)
    expect(response.text).toBe(
      '{"symbol":"MES","tf":"5m","candles":[{"t":"2026-08-25T14:05:00Z","o":100,"h":102,"l":98,"c":99,"v":60}]}',
    )
    expect(getCandles).toHaveBeenCalledWith('MES', '5m')
  })

  it('responds 200 with an empty candles list when there is no data', async () => {
    const response = await request(appWith(() => [])).get(
      '/candles?symbol=NQ&tf=1h',
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ symbol: 'NQ', tf: '1h', candles: [] })
  })

  it.each([
    { query: 'tf=5m', code: 'MISSING_SYMBOL' },
    { query: 'symbol=ES&tf=5m', code: 'INVALID_SYMBOL' },
    { query: 'symbol=MES', code: 'MISSING_TIMEFRAME' },
    { query: 'symbol=MES&tf=5m&tf=1h', code: 'INVALID_TIMEFRAME' },
  ])(
    'responds 400 with $code for ?$query and does not call the use case',
    async ({ query, code }) => {
      const getCandles = vi.fn<GetCandles>(() => [])

      const response = await request(appWith(getCandles)).get(
        `/candles?${query}`,
      )

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: { code, message: expect.any(String) },
      })
      expect(getCandles).not.toHaveBeenCalled()
    },
  )

  it('serves the real dataset sorted from oldest to newest with t in ISO 8601 UTC', async () => {
    const repository = await loadCandleRepository(DATASET_FILE)
    const app = appWith(createGetCandles(repository))

    const response = await request(app).get('/candles?symbol=MES&tf=1h')
    const times: string[] = response.body.candles.map(
      (candle: { t: string }) => candle.t,
    )

    expect(response.status).toBe(200)
    expect(times.length).toBeGreaterThan(0)
    expect(times.every((t) => /^\d{4}-\d{2}-\d{2}T\d{2}:00:00Z$/.test(t))).toBe(
      true,
    )
    expect([...times].sort()).toEqual(times)
    expect(new Set(times).size).toBe(times.length)
  })
})

describe('unknown routes', () => {
  it('responds 404 with NOT_FOUND in the standard error format', async () => {
    const response = await request(appWith(() => [])).get('/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route not found.' },
    })
  })
})

describe('unexpected errors', () => {
  it('responds 500 with a generic INTERNAL_ERROR and logs the details on the server', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const failing: GetCandles = () => {
      throw new Error('secret detail at /srv/app/candles.json')
    }

    const response = await request(appWith(failing)).get(
      '/candles?symbol=MES&tf=5m',
    )

    expect(response.status).toBe(500)
    expect(response.text).toBe(
      '{"error":{"code":"INTERNAL_ERROR","message":"An unexpected error occurred."}}',
    )
    expect(log).toHaveBeenCalled()
  })
})
