# CLAUDE.md

Technical assessment with a 3-hour limit.

- `backend/`: TypeScript + Express 5. Exposes `GET /candles?symbol=&tf=` and aggregates 1-minute candles from a JSON file loaded into memory.
- `frontend/`: React + TypeScript + Vite. Symbol and timeframe selectors and a candlestick chart.
- Input data arrives unsorted, with duplicate rows and some minutes missing.

**Guiding principle:** small and correct beats big. Once something works with passing tests, it does not break.

## Non-negotiable rules

- Never push or force-push. Commit only when the user asks.
- Use TDD for every behavior change.
- Run typecheck, lint, and tests before and after every change. A test that passed must not start failing.
- Never delete, skip, or weaken a test to make it pass.
- Never add a dependency without asking the user first.
- Report real results only. If something failed or was not done, say so and include the command output.

## Detailed rules

The rules live in `.claude/rules/` and load automatically.

| File | Read when |
| --- | --- |
| `code-map.md` | Before any task: where things live, API contract, data quirks, tests |
| `no-regression.md` | Changing code that already works |
| `testing.md` | Writing or changing tests |
| `security.md` | Touching input validation, errors, CORS, the data file, env vars, or dependencies |
| `clean-architecture.md` | Deciding where code goes or what it may import |
| `code-quality.md` | Writing any code |
| `frontend.md` | Working in `frontend/` |

## Workflow

1. Understand the task. If anything is ambiguous, confirm the acceptance criteria with the user.
2. Take the baseline: run typecheck, lint, and tests, and note the results.
3. Write a failing test and check that it fails for the right reason.
4. Make it pass with the minimum code.
5. Refactor while all tests stay green.
6. Run the full suite: typecheck, lint, and tests in both projects.
7. Finish with a short report: what changed, which tests were added, and what risks remain.
8. Log the task's prompt in the `DECISIONS.md` prompt log, because the assessment requires it, and tell the user it was logged.

## Commands

npm is the only package manager. Run each command inside its project folder.

| Task | `backend/` | `frontend/` |
| --- | --- | --- |
| Install | `npm install` | `npm install` |
| Run the app | `npm run dev` (port 3000) | `npm run dev` (port 5173) |
| Typecheck | `npm run typecheck` | `npm run typecheck` |
| Lint | `npm run lint` | `npm run lint` |
| Format | `npm run format` | `npm run format` |
| Format check | `npm run format:check` | `npm run format:check` |
| Tests | `npm test` (watch: `npm run test:watch`) | none |
| Build | none, Node runs `.ts` directly | `npm run build` |

Backend tests use Vitest and `supertest`. In dev, Vite proxies `/candles` to the backend.

## Language

- Write code, identifiers, comments, docs, and commit messages in English.
- Use Conventional Commits, for example `feat: aggregate candles into 5m buckets`.
- Talk to the user in Spanish.
