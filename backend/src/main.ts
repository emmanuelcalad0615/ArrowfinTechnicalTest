import { createGetCandles } from './application/get-candles.ts'
import {
  DATASET_FILE,
  loadCandleRepository,
} from './infrastructure/in-memory-candle-repository.ts'
import { createApp } from './presentation/http/app.ts'

const DEFAULT_PORT = 3000

function parsePort(value: string | undefined): number | null {
  if (value === undefined) return DEFAULT_PORT
  const port = Number(value)
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null
}

const port = parsePort(process.env.PORT)

if (port === null) {
  console.error('Invalid PORT:', process.env.PORT)
  process.exit(1)
}

// A bad data file stops the server here, before it accepts any request.
const repository = await loadCandleRepository(DATASET_FILE).catch(
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  },
)

createApp({ getCandles: createGetCandles(repository) }).listen(port, () => {
  console.log(`Backend listening on http://localhost:${String(port)}`)
})
