import express, { type Express } from 'express'
import type { GetCandles } from '../../application/get-candles.ts'
import { createCandlesHandler } from './candles-controller.ts'
import { handleError, handleNotFound } from './error-handlers.ts'

export interface AppDependencies {
  readonly getCandles: GetCandles
}

/** Builds the Express app without listening, so tests can drive it with supertest. */
export function createApp({ getCandles }: AppDependencies): Express {
  const app = express()

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
  app.get('/candles', createCandlesHandler(getCandles))

  app.use(handleNotFound)
  app.use(handleError)

  return app
}
