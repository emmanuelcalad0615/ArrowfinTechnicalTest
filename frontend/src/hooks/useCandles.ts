import { useCallback, useEffect, useState } from 'react'
import {
  fetchCandles,
  type ApiCandle,
  type CandlesResult,
  type Instrument,
  type Timeframe,
} from '../api/candles.ts'

export type CandlesState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'empty' }
  | { readonly status: 'ready'; readonly candles: readonly ApiCandle[] }

const LOADING: CandlesState = { status: 'loading' }

/** Loads candles for the current selection. A newer selection aborts the older request, so a stale response is never shown. */
export function useCandles(
  symbol: Instrument,
  tf: Timeframe,
): { readonly state: CandlesState; readonly retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<{
    readonly key: string
    readonly state: CandlesState
  } | null>(null)
  const key = `${symbol}|${tf}|${String(attempt)}`

  useEffect(() => {
    const controller = new AbortController()
    void fetchCandles(symbol, tf, controller.signal).then((result) => {
      if (!controller.signal.aborted)
        setSettled({ key, state: toState(result) })
    })
    return () => {
      controller.abort()
    }
  }, [key, symbol, tf])

  const retry = useCallback(() => {
    setAttempt((current) => current + 1)
  }, [])

  // Until the request for the current key settles, the view is loading.
  return { state: settled?.key === key ? settled.state : LOADING, retry }
}

function toState(result: CandlesResult): CandlesState {
  if (!result.ok) return { status: 'error', message: result.message }
  return result.candles.length === 0
    ? { status: 'empty' }
    : { status: 'ready', candles: result.candles }
}
