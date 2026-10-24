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
- Frontend: API module (`fetch` plus runtime type guards), one data-fetching hook, and presentational components. No UI library.
- Rules: see the other files in `.claude/rules/`.

## Folders

| Path | Purpose | Status |
| --- | --- | --- |
| `CLAUDE.md` | Agent instructions: non-negotiable rules, workflow, commands | exists |
| `README.md` | Project README: setup, run, checks, API status, dataset description | exists |
| `dataset/candles_1m.json` | Input data: 1-minute candles for `MES` and `NQ`, one session on 2026-08-25 | exists |
| `dataset/instruments.json` | The 2 contracts: `MES` and `NQ`, with `tick_size` | exists |
| `DECISIONS.md` | Design decisions, trade-offs, and the prompt log | exists |
| `compose.yaml` | Runs both images: `backend` on port 3000 (healthcheck on `/health`) and `frontend` on port 8080, which starts once the backend is healthy | exists |
| `.dockerignore` | Keeps `node_modules`, `dist`, `.env`, `.git`, and `.claude` out of the build context (the repo root) | exists |
| `.claude/rules/` | Project rules, including this map | exists |
| `.claude/agents/` | Auditor agents, one per rule file. See `audits.md` | exists |
| `docs/audits/` | Auditor reports, created on the first audit | planned |
| `backend/Dockerfile` | `node:26-alpine`, production dependencies only, runs `node src/main.ts` as user `node`, copies `dataset/` next to `backend/` so `DATASET_FILE` resolves | exists |
| `backend/src/main.ts` | Composition root: validates `PORT`, loads the repository from `DATASET_FILE` (exits with code 1 and a clear message if the file is bad), builds `getCandles`, calls `createApp()`, and listens | exists |
| `backend/src/domain/candle.ts` | `Candle` type (`ts` in epoch ms, UTC), `SYMBOLS`, `Instrument`, `isInstrument()`, `candleKey()` (symbol + `ts` identity), `byTimeThenSymbol()` comparator | exists |
| `backend/src/domain/normalize-candles.ts` | `normalizeCandles()`: pure function. Removes duplicates by symbol + `ts` (first appearance wins) and sorts by `ts` ascending. Never modifies its input | exists |
| `backend/src/domain/parse-candle.ts` | `parseCandle()`: validates one raw row with type guards and returns a `Candle` or the first broken rule as a field-specific code (`INVALID_OPEN`, `INVALID_VOLUME`, `HIGH_BELOW_LOW`, ...) | exists |
| `backend/src/domain/timeframe.ts` | `TIMEFRAMES`, `Timeframe`, `isTimeframe()`, `TIMEFRAME_MS`, `MS_PER_MINUTE`, `bucketStart()` (start of the interval that contains a `ts`, UTC-aligned) | exists |
| `backend/src/domain/timestamp.ts` | `formatTimestamp()` (epoch ms to `2026-08-25T14:00:00Z`) and `parseMinuteTimestamp()` (strict ISO 8601 UTC minute to epoch ms, or `null`) | exists |
| `backend/src/domain/aggregate-candles.ts` | `aggregate()`: pure function. Normalizes with `normalizeCandles()`, then aggregates 1-minute candles into `tf` intervals with `bucketStart()` | exists |
| `backend/src/domain/candle-repository.ts` | `CandleRepository` interface: `findBySymbol(symbol)` returns the stored 1-minute candles of one symbol | exists |
| `backend/src/application/get-candles.ts` | `createGetCandles(repository)` returns the `GetCandles` use case: `(symbol, timeframe)` to aggregated candles. Repository injected; knows nothing of HTTP | exists |
| `backend/src/infrastructure/candle-file.ts` | JSON loader: `readCandleFile()` reads the data file, `parseCandleFile()` checks it is a JSON array and validates every row with `parseCandle()`. Returns a typed result, never throws | exists |
| `backend/src/infrastructure/in-memory-candle-repository.ts` | `DATASET_FILE` (fixed path, resolved from the module, not the cwd), `loadCandleRepository()` (reads and validates once, groups by symbol, throws `CandleFileLoadError` naming the problem and row), `createInMemoryCandleRepository()` | exists |
| `backend/src/infrastructure/fixtures/` | Small JSON files for loader tests: valid, broken JSON, not an array, invalid row. Excluded from Prettier | exists |
| `backend/src/presentation/http/app.ts` | `createApp({ getCandles })`: builds the Express app without listening. Routes `GET /health` and `GET /candles`, then the 404 handler and the error handler | exists |
| `backend/src/presentation/http/app.test.ts` | HTTP tests for `createApp()` with `supertest`: fake use cases, plus one test against the real dataset | exists |
| `backend/src/presentation/http/candles.integration.test.ts` | Integration tests: `createApp` + real `getCandles` + a fake repository with known data (unsorted, a duplicate, a gap), plus the real dataset for every symbol and timeframe | exists |
| `backend/src/presentation/http/api-candle.ts` | `ApiCandle` (`t`, `o`, `h`, `l`, `c`, `v`), `toApiCandle()` (the only place that maps domain names to short keys), `CandlesResponse` and `toCandlesResponse()` | exists |
| `backend/src/presentation/http/api-error.ts` | `QueryErrorCode`, `ApiErrorCode` (adds `NOT_FOUND`, `INTERNAL_ERROR`), `ApiError`, `ErrorResponse` (`{ error: { code, message } }`), `toErrorResponse()` | exists |
| `backend/src/presentation/http/candles-query.ts` | `parseCandlesQuery(req.query)`: returns typed `{ symbol, tf }` or an `ApiError` with a stable code and a message that lists the accepted values | exists |
| `backend/src/presentation/http/candles-controller.ts` | `createCandlesHandler(getCandles)`: thin `GET /candles` handler. Validates the query (`400`), calls the use case, maps with `toCandlesResponse()` (`200`) | exists |
| `backend/src/presentation/http/error-handlers.ts` | `handleNotFound` (`404 NOT_FOUND`) and `handleError` (`500 INTERNAL_ERROR`, generic message, details only in the server log) | exists |
| `frontend/Dockerfile`, `frontend/nginx.conf` | Builds with Vite, serves `dist` with `nginx:1.29-alpine`, and proxies `/candles` to `backend:3000` (same role as the Vite dev proxy) | exists |
| `frontend/src/main.tsx` | Entry point: mounts `App` into `#root` | exists |
| `frontend/src/App.tsx` | Root component: holds `symbol` (default `MES`) and `tf` (default `5m`), calls `useCandles`, renders the selectors, the UTC note, and one view per state | exists |
| `frontend/src/api/candles.ts` | `SYMBOLS`, `TIMEFRAMES`, `ApiCandle`, `fetchCandles()`: calls `GET /candles`, narrows the JSON with type guards, rejects a response for another selection, and never throws (`{ ok: false, message }` with the backend message when there is one) | exists |
| `frontend/src/hooks/useCandles.ts` | `useCandles(symbol, tf)`: `loading`, `error`, `empty`, or `ready`, plus `retry()`. Aborts the previous request with `AbortController` and keys results by selection, so a stale response is never shown | exists |
| `frontend/src/components/SelectField.tsx` | Native `<select>` with its `<label>`, generic over the option type, no `as` | exists |
| `frontend/src/components/CandleChart.tsx` | lightweight-charts 5 candlestick chart: `autoSize` follows the container width, `chart.remove()` on unmount | exists |
| `frontend/src/components/chart-data.ts` | `toChartCandles()`: API candles to chart points in `UTCTimestamp` seconds, which the chart shows in UTC | exists |
| `frontend/src/index.css` | Plain CSS: layout, field spacing, 400 px chart height | exists |

## Request path

1. User changes the symbol or timeframe `<select>`.
2. `useCandles` aborts the previous request and calls `fetchCandles()`.
3. The API module sends `GET /candles?symbol=MES&tf=5m`.
4. The controller validates the query with `parseCandlesQuery()`, which uses the domain guards. Invalid input returns `400`.
5. The controller calls the use case.
6. The use case reads 1-minute candles through `CandleRepository`. The infrastructure implementation serves them from memory.
7. `aggregate()` deduplicates, sorts, and aggregates the candles into `tf` intervals.
8. The controller maps the result to the response JSON and returns `200`.
9. `fetchCandles()` checks the JSON with type guards, `useCandles` moves to `ready` or `empty` (or `error` with the backend message), and `CandleChart` draws the candles.

## `GET /candles`

The endpoint exists, so `no-regression.md` freezes this contract: shape, status codes, error codes and messages, accepted values, and candle order.

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
| `400` | `MISSING_SYMBOL` | `symbol` is absent or empty. Message lists `MES, NQ` |
| `400` | `INVALID_SYMBOL` | `symbol` is not exactly `MES` or `NQ` (case-sensitive), or is repeated (`?symbol=MES&symbol=NQ` arrives as an array) |
| `400` | `MISSING_TIMEFRAME` | `tf` is absent or empty. Message lists `1m, 5m, 15m, 1h` |
| `400` | `INVALID_TIMEFRAME` | `tf` is not exactly `1m`, `5m`, `15m`, or `1h` (case-sensitive), or is repeated |
| `404` | `NOT_FOUND` | Any route that does not exist. Message: `Route not found.` |
| `500` | `INTERNAL_ERROR` | Unexpected failure. Message: `An unexpected error occurred.` No stack trace or internal detail; the error is logged on the server |

`symbol` is checked before `tf`: when both are wrong, the response reports the symbol error.

`GET /health` (exists) returns `200` with `{ "status": "ok" }`.

## Data quirks

| Quirk | Handling | Where |
| --- | --- | --- |
| Rows arrive unsorted | Sort by `ts`, then symbol, before aggregating. Output is sorted the same way | `normalizeCandles()`, `aggregate()` |
| Duplicate rows | The same candle sent again (per `README.md`). Keep the first per symbol and `ts` | `normalizeCandles()` |
| Missing minutes | Aggregate only the minutes that exist. Never invent candles. Omit empty intervals | `aggregate()` |

Intervals start at `ts` floored to the timeframe, aligned to the UTC clock (14:07 goes to the 5m interval at 14:05). Candles of different symbols are never merged.

## Tests

Runner: Vitest + `supertest`, backend only. Test files sit next to the code as `*.test.ts`. A `.only` fails the run. The frontend has no automated tests; it was checked by hand in headless Chrome (see known debt).

| Test | Protects | Status |
| --- | --- | --- |
| `GET /health` | Responds `200` with `{ "status": "ok" }` | exists |
| Aggregation math | open of first, close of last, highest high, lowest low, summed volume (assessment example) | exists |
| Duplicates | Duplicate rows do not change the result | exists |
| Unsorted input | Result does not depend on input order; output is oldest to newest | exists |
| Input untouched | `aggregate()` does not modify its input | exists |
| Missing minutes | Gaps never produce invented candles; empty intervals are omitted | exists |
| Interval alignment | `bucketStart()` floors `ts` to the UTC clock; an exact boundary belongs to its own interval. `aggregate()` uses it | exists |
| Symbols kept apart | Candles of different symbols are never merged | exists |
| Normalization | `normalizeCandles()` removes exact duplicates, keeps the first appearance, sorts by `ts`, leaves its input untouched, and handles an empty input | exists |
| Same result for duplicates and order | `aggregate()` gives exactly the same output with duplicated rows and for every order of the same rows | exists |
| 1m and empty input | `aggregate()` in 1m returns the deduplicated, sorted input; an empty input returns `[]` in every timeframe | exists |
| Instrument guard | `isInstrument()` accepts only `MES` and `NQ`, case-sensitive; rejects `undefined`, `null`, numbers, and arrays | exists |
| Timeframe guard | `isTimeframe()` accepts only `1m`, `5m`, `15m`, `1h`, case-sensitive; rejects `undefined`, `null`, numbers, and arrays | exists |
| `t` format | `formatTimestamp()` returns exactly `YYYY-MM-DDTHH:MM:SSZ`, no milliseconds | exists |
| Response candle shape | `toApiCandle()` serializes to exactly `{"t":…,"o":…,"h":…,"l":…,"c":…,"v":…}`: key order, no extra keys | exists |
| Error body shape | `toErrorResponse()` serializes to exactly `{"error":{"code":…,"message":…}}` | exists |
| Query validation | `parseCandlesQuery()` accepts all 8 valid combinations; returns each of the 4 codes with its exact message for absent, empty, unknown, wrong-case, repeated, and object values; reports `symbol` first | exists |
| Strict `ts` parsing | `parseMinuteTimestamp()` rejects non-ISO formats, offsets, milliseconds, seconds other than 0, and impossible dates | exists |
| Row validation | `parseCandle()` accepts a valid row and `high` equal to `low`; rejects non-objects, a bad symbol, a bad `ts`, a non-finite open, high, low, or close, a volume that is not a non-negative integer, and `high` below `low`, each with its own code | exists |
| Loader validation | `parseCandleFile()` rejects invalid JSON and non-arrays, and reports the index and `parseCandle()` code of the first invalid row | exists |
| Real dataset | `readCandleFile()` and `loadCandleRepository(DATASET_FILE)` load all 775 rows of `dataset/candles_1m.json` | exists |
| Repository loading | Loads a valid fixture grouped by symbol; keeps serving after the file is deleted (read once); throws `CandleFileLoadError` with a clear message for a missing file, broken JSON, a non-array, and an invalid row (index and code); empty list for a symbol with no candles | exists |
| Get candles use case | With a fake repository: returns only the requested symbol, and aggregates into the requested timeframe | exists |
| `/candles` endpoint | Over real HTTP: `200` with the exact JSON string and `application/json`; the use case gets `symbol` and `tf`; `200` with `candles: []`; `400` for each query code without calling the use case; the real dataset comes back sorted with ISO `t` | exists |
| Unknown routes | `404` with `{ error: { code: "NOT_FOUND", ... } }` | exists |
| Unexpected errors | A throwing use case gives `500` with the exact generic body, no internal detail, and a server log entry | exists |
| Integration, fake repository | Exact JSON for known data through the real use case; ascending, unique `t` from unsorted rows; every query code with status `400` and exact message; repeated `symbol` and `tf`; `404 NOT_FOUND`; a throwing repository gives the exact generic `500` with no detail | exists |
| Integration, real dataset | For all 8 symbol and timeframe pairs: `200`, at least one candle, keys exactly `t,o,h,l,c,v`, ISO `t`, and finite `o,h,l,c,v` (no `NaN`, `null`, or `undefined`) | exists |

## Commands

| Project | Commands |
| --- | --- |
| `backend/` | `npm run dev`, `npm start`, `npm run typecheck`, `npm run lint`, `npm run format`, `npm run format:check`, `npm test`, `npm run test:watch` |
| `frontend/` | `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint`, `npm run format`, `npm run format:check` |
| root | `docker compose up --build` (app on 8080, API on 3000), `docker compose down` |

## Known debt and pending work

Ordered by importance (from the final review).

1. The frontend has no automated tests. `useCandles` (abort and stale responses), the `fetchCandles()` guards, and the four views were only checked by hand in headless Chrome. This breaks the TDD rule in `CLAUDE.md`.
2. With the backend down, the proxy answers `502`, so the user sees "Request failed with status 502." instead of a clear "could not reach the server" message.
3. The frontend repeats `SYMBOLS`, `TIMEFRAMES`, and `ApiCandle` from the backend. The runtime guard catches drift, but only as a generic error, and a contract change needs edits in both projects.
4. The chart is rebuilt on every data change and unmounted while loading, so zoom is lost and the layout jumps between selections.
5. The first 1h candle is labeled 13:00 but covers only 13:30–13:59, because the session starts at 13:30. Correct under the UTC clock alignment, but easy to read as a full hour.
6. The chart has no text alternative for screen readers, and volume (`v`) is fetched but not shown.
7. `PORT` parsing goes through `Number()`, so `0x10`, `1e3`, and ` 3000 ` are accepted.
8. `POST /candles` returns `404` instead of `405`, and responses carry `X-Powered-By: Express`.
9. If two duplicate rows ever had different values, the first would win with no warning. The dataset README says duplicates are identical.
