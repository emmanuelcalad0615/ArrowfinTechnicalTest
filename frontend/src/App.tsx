import { useState } from 'react'
import {
  SYMBOLS,
  TIMEFRAMES,
  type Instrument,
  type Timeframe,
} from './api/candles.ts'
import { CandleChart } from './components/CandleChart.tsx'
import { SelectField } from './components/SelectField.tsx'
import { useCandles, type CandlesState } from './hooks/useCandles.ts'

export default function App() {
  const [symbol, setSymbol] = useState<Instrument>('MES')
  const [tf, setTf] = useState<Timeframe>('5m')
  const { state, retry } = useCandles(symbol, tf)

  return (
    <main>
      <h1>Candles</h1>
      <div className="controls">
        <SelectField
          id="symbol"
          label="Symbol"
          value={symbol}
          options={SYMBOLS}
          onChange={setSymbol}
        />
        <SelectField
          id="timeframe"
          label="Timeframe"
          value={tf}
          options={TIMEFRAMES}
          onChange={setTf}
        />
      </div>
      <p className="note">All times are in UTC.</p>
      <CandlesView state={state} onRetry={retry} />
    </main>
  )
}

function CandlesView({
  state,
  onRetry,
}: {
  state: CandlesState
  onRetry: () => void
}) {
  switch (state.status) {
    case 'loading':
      return <p role="status">Loading candles…</p>
    case 'error':
      return (
        <div role="alert">
          <p>{state.message}</p>
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )
    case 'empty':
      return <p role="status">No candles for this symbol and timeframe.</p>
    case 'ready':
      return <CandleChart candles={state.candles} />
  }
}
