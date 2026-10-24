# Candle aggregation assessment

Technical assessment. A TypeScript backend aggregates 1-minute candles into 5m, 15m, and 1h candles, and a React frontend shows them in a candlestick chart.

| Part | Stack | Status |
| --- | --- | --- |
| `backend/` | Node + TypeScript + Express 5 | `GET /health` and `GET /candles` work |
| `frontend/` | React 19 + TypeScript + Vite 8 | Still the Vite template |

## Run with Docker

Requires only Docker with Compose.

```sh
docker compose up --build
```

- App: http://localhost:8080 (nginx serves the frontend and forwards `/candles` to the backend).
- API: http://localhost:3000, for example http://localhost:3000/candles?symbol=MES&tf=5m.
- Stop with `docker compose down`.

## Run without Docker

Requirements: Node 24 or later (Node runs the backend `.ts` files directly) and npm.

### Setup

```sh
cd backend && npm install
cd ../frontend && npm install
```

### Run

Start each app in its own terminal:

```sh
cd backend && npm run dev    # http://localhost:3000
cd frontend && npm run dev   # http://localhost:5173
```

- The backend reads `PORT` (default `3000`). To change it, copy `backend/.env.example` to `backend/.env`.
- In dev, Vite forwards `/candles` to the backend, so the frontend and the API share one origin.

### Checks

Run these in `backend/` and in `frontend/`:

```sh
npm run typecheck
npm run lint
npm run format:check
npm test              # backend only
```

## API

| Endpoint | Status |
| --- | --- |
| `GET /health` | Returns `200` with `{ "status": "ok" }` |
| `GET /candles?symbol=MES\|NQ&tf=1m\|5m\|15m\|1h` | Returns `200` with `{ "symbol", "tf", "candles": [{ "t", "o", "h", "l", "c", "v" }] }`, sorted oldest to newest, `t` in ISO 8601 UTC. Invalid input returns `400` with `{ "error": { "code", "message" } }` |

## Project layout

- `backend/src/`: Clean Architecture layers `domain`, `application`, `infrastructure`, and `presentation`.
- `frontend/src/`: API module, data-fetching hook, and components (planned).
- `DECISIONS.md`: design decisions, trade-offs, and the log of prompts used during development.
- `CLAUDE.md` and `.claude/`: instructions, rules, and auditor agents for Claude Code.

## Dataset

Everything here is fabricated.

All candles are from one trading session, **2026-08-25, 13:30 to 20:00 UTC**. Timestamps are UTC, in ISO 8601.

| File | What it holds |
| --- | --- |
| `dataset/instruments.json` | 2 contracts: `MES` and `NQ`. |
| `dataset/candles_1m.json` | 1 minute candles for both contracts. |

Each candle:

```json
{ "symbol": "MES", "ts": "2026-08-25T13:30:00Z", "open": 5630.00, "high": 5631.50, "low": 5629.25, "close": 5631.00, "volume": 1520 }
```

`ts` is the start of the minute. The candle covers `ts` up to, but not including, the next minute.

### Things that are true about this data

- `candles_1m.json` is not sorted by time or by symbol.
- Some rows appear twice. A duplicate is the same candle sent again, not extra trading.
- Some minutes have no row, because nothing traded in them.
