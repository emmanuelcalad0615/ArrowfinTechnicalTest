import { describe, expect, it } from 'vitest'
import { SYMBOLS } from '../../domain/candle.ts'
import { TIMEFRAMES } from '../../domain/timeframe.ts'
import type { ApiErrorCode } from './api-error.ts'
import { parseCandlesQuery } from './candles-query.ts'

const MESSAGES: Record<ApiErrorCode, string> = {
  MISSING_SYMBOL:
    'Query parameter "symbol" is required. Accepted values: MES, NQ.',
  INVALID_SYMBOL: 'Query parameter "symbol" must be exactly one of: MES, NQ.',
  MISSING_TIMEFRAME:
    'Query parameter "tf" is required. Accepted values: 1m, 5m, 15m, 1h.',
  INVALID_TIMEFRAME:
    'Query parameter "tf" must be exactly one of: 1m, 5m, 15m, 1h.',
}

describe('parseCandlesQuery', () => {
  it.each(
    SYMBOLS.flatMap((symbol) => TIMEFRAMES.map((tf) => ({ symbol, tf }))),
  )('accepts symbol=$symbol and tf=$tf', ({ symbol, tf }) => {
    expect(parseCandlesQuery({ symbol, tf })).toEqual({
      ok: true,
      query: { symbol, tf },
    })
  })

  it.each<{
    label: string
    query: Record<string, unknown>
    code: ApiErrorCode
  }>([
    { label: 'no parameters', query: {}, code: 'MISSING_SYMBOL' },
    { label: 'no symbol', query: { tf: '5m' }, code: 'MISSING_SYMBOL' },
    {
      label: 'an empty symbol',
      query: { symbol: '', tf: '5m' },
      code: 'MISSING_SYMBOL',
    },
    {
      label: 'an unknown symbol',
      query: { symbol: 'ES', tf: '5m' },
      code: 'INVALID_SYMBOL',
    },
    {
      label: 'a lowercase symbol',
      query: { symbol: 'mes', tf: '5m' },
      code: 'INVALID_SYMBOL',
    },
    {
      label: 'a repeated symbol (?symbol=MES&symbol=NQ)',
      query: { symbol: ['MES', 'NQ'], tf: '5m' },
      code: 'INVALID_SYMBOL',
    },
    {
      label: 'an object symbol (extended query parser)',
      query: { symbol: { a: 'MES' }, tf: '5m' },
      code: 'INVALID_SYMBOL',
    },
    { label: 'no tf', query: { symbol: 'MES' }, code: 'MISSING_TIMEFRAME' },
    {
      label: 'an empty tf',
      query: { symbol: 'MES', tf: '' },
      code: 'MISSING_TIMEFRAME',
    },
    {
      label: 'an unsupported tf',
      query: { symbol: 'MES', tf: '2m' },
      code: 'INVALID_TIMEFRAME',
    },
    {
      label: 'an uppercase tf',
      query: { symbol: 'MES', tf: '5M' },
      code: 'INVALID_TIMEFRAME',
    },
    {
      label: 'a repeated tf (?tf=5m&tf=1h)',
      query: { symbol: 'MES', tf: ['5m', '1h'] },
      code: 'INVALID_TIMEFRAME',
    },
    {
      label: 'a repeated identical tf (?tf=5m&tf=5m)',
      query: { symbol: 'MES', tf: ['5m', '5m'] },
      code: 'INVALID_TIMEFRAME',
    },
  ])('rejects $label with $code', ({ query, code }) => {
    expect(parseCandlesQuery(query)).toEqual({
      ok: false,
      error: { code, message: MESSAGES[code] },
    })
  })

  it('reports the symbol error first when both parameters are invalid', () => {
    expect(parseCandlesQuery({ symbol: 'ES', tf: '2m' })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SYMBOL' },
    })
  })
})
