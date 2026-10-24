import type { RequestHandler } from 'express'
import type { GetCandles } from '../../application/get-candles.ts'
import { toCandlesResponse } from './api-candle.ts'
import { toErrorResponse } from './api-error.ts'
import { parseCandlesQuery } from './candles-query.ts'

/** `GET /candles`: validates the query, runs the use case, and maps the result. No logic of its own. */
export function createCandlesHandler(getCandles: GetCandles): RequestHandler {
  return (req, res) => {
    const parsed = parseCandlesQuery(req.query)
    if (!parsed.ok) {
      res.status(400).json(toErrorResponse(parsed.error))
      return
    }

    const { symbol, tf } = parsed.query
    res.json(toCandlesResponse(symbol, tf, getCandles(symbol, tf)))
  }
}
