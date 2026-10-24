# Code map

Read this before any task. If the code and this map disagree, the code wins: tell the user so they can update the map.

Last updated: 2026-10-24. Status: **exists** or **planned**.

## Project

Technical assessment. Two independent npm projects:

- `backend/`: TypeScript + Express 5. Node runs `.ts` files directly (type stripping, Node >= 24) and loads `.env` if it exists.
- `frontend/`: React 19 + TypeScript + Vite 8. In dev, Vite proxies `/candles` to `http://localhost:3000`, so the backend needs no CORS.
- Both: TypeScript `strict` + `noUncheckedIndexedAccess`, ESLint (`typescript-eslint` `strictTypeChecked`), Prettier with one shared `.prettierrc` at the root.

## Architecture

- Backend: lightweight Clean Architecture with four layers: `domain`, `application`, `infrastructure`, `presentation`. Dependencies point inward only. No over-engineering.
- Frontend: API module, data-fetching hook, and presentational components.
- Rules: see the other files in `.claude/rules/`.

## Folders

| Path | Purpose | Status |
| --- | --- | --- |
| `CLAUDE.md` | Agent instructions: non-negotiable rules, workflow, commands | exists |
| `README.md` | Project README: setup, run, checks, API status, dataset description | exists |
| `candles_1m.json` | Input data: 1-minute candles for `MES` and `NQ`, one session on 2026-08-25 | exists |
| `instruments.json` | The 2 contracts: `MES` and `NQ`, with `tick_size` | exists |
| `DECISIONS.md` | Design decisions, trade-offs, and the prompt log | exists |
| `.claude/rules/` | Project rules, including this map | exists |
| `.claude/agents/` | Auditor agents, one per rule file. See `audits.md` | exists |
| `docs/audits/` | Auditor reports, created on the first audit | planned |
| `backend/src/main.ts` | Composition root: reads `PORT`, wires dependencies, starts the server | exists |
| `backend/src/domain/candle.ts` | `Candle` type (`ts` in epoch ms, UTC), `SYMBOLS`, `Instrument`, `isInstrument()`, `candleKey()` (symbol + `ts` identity), `byTimeThenSymbol()` comparator | exists |
| `backend/src/domain/normalize-candles.ts` | `normalizeCandles()`: pure function. Removes duplicates by symbol + `ts` (first appearance wins) and sorts by `ts` ascending. Never modifies its input | exists |
| `backend/src/domain/timeframe.ts` | `TIMEFRAMES`, `Timeframe`, `isTimeframe()`, `TIMEFRAME_MS`, `MS_PER_MINUTE`, `bucketStart()` (start of the interval that contains a `ts`, UTC-aligned) | exists |
| `backend/src/domain/timestamp.ts` | `formatTimestamp()` (epoch ms to `2026-08-25T14:00:00Z`) and `parseMinuteTimestamp()` (strict ISO 8601 UTC minute to epoch ms, or `null`) | exists |
| `backend/src/domain/aggregate-candles.ts` | `aggregateCandles()`: pure function. Normalizes with `normalizeCandles()`, then aggregates 1-minute candles into `tf` intervals with `bucketStart()` | exists |
| `backend/src/domain/` | Query validation, `CandleRepository` interface | planned |
| `backend/src/application/` | Get-candles use case | planned |
| `backend/src/infrastructure/candle-file.ts` | JSON loader: `readCandleFile()` reads the data file, `parseCandleFile()` validates every row with type guards. Returns a typed result, never throws | exists |
| `backend/src/infrastructure/` | In-memory `CandleRepository` implementation, loaded once at startup | planned |
| `backend/src/presentation/http/app.ts` | `createApp()`: Express app and routes. Has `GET /health` | exists |
| `backend/src/presentation/http/app.test.ts` | HTTP tests for `createApp()` with `supertest` | exists |
| `backend/src/presentation/http/api-candle.ts` | `ApiCandle` response type (`t`, `o`, `h`, `l`, `c`, `v`) and `toApiCandle()`, the only place that maps domain names to short keys | exists |
| `backend/src/presentation/http/` | `/candles` controller, error handler | planned |
| `frontend/src/main.tsx`, `App.tsx` | Entry point and root component (still the Vite template) | exists |
| `frontend/src/api/` | API module: calls `GET /candles` | planned |
| `frontend/src/hooks/` | Data-fetching hook: loading, error, empty, and ready states; drops stale requests | planned |
| `frontend/src/components/` | Symbol selector, timeframe selector, candle chart | planned |

## Request path (planned)

1. User changes the symbol or timeframe `<select>`.
2. The hook cancels the previous request and calls the API module.
3. The API module sends `GET /candles?symbol=MES&tf=5m`.
4. The controller passes the query to domain validation. Invalid input returns `400`.
5. The controller calls the use case.
6. The use case reads 1-minute candles through `CandleRepository`. The infrastructure implementation serves them from memory.
7. Domain logic deduplicates, sorts, and aggregates the candles into `tf` buckets.
8. The controller maps the result to the response JSON and returns `200`.
9. The hook moves to the ready or empty state, and the chart renders.

## `GET /candles` (planned)

The shape is decided (see `DECISIONS.md`): an object with `symbol`, `tf`, and `candles`, where each candle is an `ApiCandle` built by `toApiCandle()`. Once the endpoint exists, `no-regression.md` freezes it.

```json
{
  "symbol": "MES",
  "tf": "5m",
  "candles": [
    { "t": "2026-08-25T14:05:00Z", "o": 100, "h": 102, "l": 98, "c": 99, "v": 60 }
  ]
}
```

- `t` is the interval start: ISO 8601 UTC without milliseconds, from `formatTimestamp()`.
- `o`, `h`, `l`, `c`, `v` are open, high, low, close, and volume. The domain `Candle` keeps the long names.
- `candles` are sorted from oldest to newest.
- No data for the request: `200` with `"candles": []`.

Errors return `{ "error": { "code": "...", "message": "..." } }`:

| Status | Code | When |
| --- | --- | --- |
| `400` | `INVALID_SYMBOL` | `symbol` is missing, empty, repeated, or not `MES` / `NQ` |
| `400` | `INVALID_TIMEFRAME` | `tf` is missing, empty, repeated, or not `1m` / `5m` / `15m` / `1h` |
| `500` | `INTERNAL_ERROR` | Unexpected failure. No internal details in the response |

`GET /health` (exists) returns `200` with `{ "status": "ok" }`.

## Data quirks

| Quirk | Handling | Where |
| --- | --- | --- |
| Rows arrive unsorted | Sort by `ts`, then symbol, before aggregating. Output is sorted the same way | `normalizeCandles()`, `aggregateCandles()` |
| Duplicate rows | The same candle sent again (per `README.md`). Keep the first per symbol and `ts` | `normalizeCandles()` |
| Missing minutes | Aggregate only the minutes that exist. Never invent candles. Omit empty intervals | `aggregateCandles()` |

Intervals start at `ts` floored to the timeframe, aligned to the UTC clock (14:07 goes to the 5m interval at 14:05). Candles of different symbols are never merged.

## Tests

Runner: Vitest + `supertest`, backend only. Test files sit next to the code as `*.test.ts`. A `.only` fails the run.

| Test | Protects | Status |
| --- | --- | --- |
| `GET /health` | Responds `200` with `{ "status": "ok" }` | exists |
| Aggregation math | open of first, close of last, highest high, lowest low, summed volume (assessment example) | exists |
| Duplicates | Duplicate rows do not change the result | exists |
| Unsorted input | Result does not depend on input order; output is oldest to newest | exists |
| Input untouched | `aggregateCandles()` does not modify its input | exists |
| Missing minutes | Gaps never produce invented candles; empty intervals are omitted | exists |
| Interval alignment | `bucketStart()` floors `ts` to the UTC clock; an exact boundary belongs to its own interval. `aggregateCandles()` uses it | exists |
| Symbols kept apart | Candles of different symbols are never merged | exists |
| Normalization | `normalizeCandles()` removes exact duplicates, keeps the first appearance, sorts by `ts`, leaves its input untouched, and handles an empty input | exists |
| Instrument guard | `isInstrument()` accepts only `MES` and `NQ`, case-sensitive; rejects `undefined`, `null`, numbers, and arrays | exists |
| Timeframe guard | `isTimeframe()` accepts only `1m`, `5m`, `15m`, `1h`, case-sensitive; rejects `undefined`, `null`, numbers, and arrays | exists |
| `t` format | `formatTimestamp()` returns exactly `YYYY-MM-DDTHH:MM:SSZ`, no milliseconds | exists |
| Response candle shape | `toApiCandle()` serializes to exactly `{"t":…,"o":…,"h":…,"l":…,"c":…,"v":…}`: key order, no extra keys | exists |
| Strict `ts` parsing | `parseMinuteTimestamp()` rejects non-ISO formats, offsets, milliseconds, seconds other than 0, and impossible dates | exists |
| Loader validation | `parseCandleFile()` rejects invalid JSON, non-arrays, and rows with a bad symbol, `ts`, or number, and reports the row index | exists |
| Real dataset | `readCandleFile()` loads all 775 rows of `candles_1m.json` | exists |
| Invalid input | Each bad `symbol` / `tf` returns `400` with its error code | planned |
| `/candles` endpoint | Response shape, status codes, and candle order over real HTTP | planned |

## Commands

| Project | Commands |
| --- | --- |
| `backend/` | `npm run dev`, `npm start`, `npm run typecheck`, `npm run lint`, `npm run format`, `npm run format:check`, `npm test`, `npm run test:watch` |
| `frontend/` | `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint`, `npm run format`, `npm run format:check` |

## Known debt and pending work

- Backend has no custom error handler.
- Frontend is still the Vite template.
- Not decided: whether the data files stay in the root or move into `backend/`.
- Not decided: how the frontend gets the response types without duplicating them.
