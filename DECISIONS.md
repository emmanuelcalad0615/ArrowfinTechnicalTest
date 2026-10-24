# Decisions

Design decisions and trade-offs for this technical assessment, followed by the log of prompts used during development.

## Decisions

### Tooling (2026-10-24)

- **ESLint instead of Oxlint.** One linter. `typescript-eslint` `strictTypeChecked` plus `switch-exhaustiveness-check` and `consistent-type-assertions` (`assertionStyle: "never"`, `as const` allowed) enforce the code-quality rules. Trade-off: type-aware linting is slower than Oxlint, which is negligible at this size.
- **Relaxed `no-unsafe-*` rules in test files only.** `supertest` types `response.body` as `any`. Production code keeps the rules, and data from `JSON.parse` or `response.json()` is narrowed with type guards.
- **`noUncheckedIndexedAccess` in both projects.** Indexed access returns `T | undefined`, so empty arrays must be handled explicitly. This prevents silent `NaN` and `undefined` in aggregation.
- **Vitest + `supertest` for the backend.** Vitest works with Node type stripping and `.ts` imports with no build step. `allowOnly: false` makes a forgotten `.only` fail the run. No frontend tests: the testing rules only require backend tests.
- **Prettier with one shared `.prettierrc` at the root.** No semicolons and single quotes, matching the existing code.
- **Vite dev proxy instead of CORS.** `/candles` is forwarded to the backend in dev, so the browser stays same-origin. No `cors` dependency and no CORS headers to get wrong.

### Aggregation (2026-10-24)

- **`ts` is epoch milliseconds in the domain.** The data file has ISO 8601 strings. The JSON loader will parse them once at the edge, so the domain does integer math and never parses dates or risks `NaN`. The API format for time is decided in the presentation layer.
- **Intervals come from flooring `ts` to the timeframe duration, in `bucketStart()`.** Epoch time starts at a UTC midnight, so this aligns 5m, 15m, and 1h intervals to the UTC clock with no date library and no dependence on the system time zone. The full test suite passes under `TZ=UTC`, `America/Bogota`, `Asia/Kolkata` (UTC+5:30), and `Pacific/Chatham` (UTC+12:45).
- **Duplicates keep the first row per symbol and `ts`, in `normalizeCandles()`.** The dataset README says a duplicate is the same candle sent again, so any copy gives the same result. `normalizeCandles()` returns the canonical 1-minute series (unique and sorted) as one step, built from two private single-purpose helpers, and `aggregate()` starts from it.
- **Candles are grouped by symbol and interval.** `aggregate()` stays correct even if it receives both symbols at once. Output is sorted by `ts`, then symbol.
- **Missing minutes are not filled.** An interval is built only from the minutes that exist, and an interval with no rows does not appear. This matches the data: a missing minute means nothing traded.
- **`aggregate()` merges each candle into its interval as it goes, instead of grouping into arrays and reading the first and last element.** Every interval starts as a copy of a real candle, and each later candle updates high, low, close, and volume. There is no indexed access, so `noUncheckedIndexedAccess` never produces `Candle | undefined`, and no `!` or `as` is needed. Values come only from validated finite numbers through `Math.max`, `Math.min`, and addition, so the result can never hold `NaN` or `undefined`.

### Timestamps (2026-10-24)

- **`t` in the response is ISO 8601 UTC without milliseconds**, for example `2026-08-25T14:00:00Z`, the same format as the assessment example. `toISOString()` always adds `.000`, so `formatTimestamp()` removes it. A test checks the exact string.
- **`parseCandle()` validates one raw row in the domain and names the field that failed.** It narrows `unknown` with type guards only, and returns the first broken rule as a code: `NOT_AN_OBJECT`, `INVALID_SYMBOL`, `INVALID_TS`, `INVALID_OPEN`, `INVALID_HIGH`, `INVALID_LOW`, `INVALID_CLOSE`, `INVALID_VOLUME`, or `HIGH_BELOW_LOW`. Volume must be a non-negative integer, and `high` must be at least `low`. The loader uses it for every row. This replaced the loader generic `INVALID_NUMBER` code; the user approved updating the 3 loader tests that expected it. All 775 dataset rows pass the new rules.
- **The loader validates `ts` strictly, not only with `Date.parse`.** `Date.parse` also accepts formats such as `2026-08-25 14:00:00` or `Tue, 25 Aug 2026 14:00:00 GMT`, and reads a `ts` without `Z` as local time. `parseMinuteTimestamp()` requires a regex match for `YYYY-MM-DDTHH:MM:SSZ`, a valid `Date.parse` result, and second 0 of a minute. Any other row fails loading with `INVALID_TS` and its index.
- **The parsed `ts` must also survive a round trip.** `Date.parse` rolls impossible dates over (`2026-02-30` becomes `2026-03-02`, and `24:00` becomes the next day), and the regex does not catch them. Formatting the parsed value back must give the original text. This check alone also rejects every format the regex rejects; the regex stays as an explicit first filter.
- **Timestamp parsing and formatting live in the domain.** Both the loader (infrastructure) and the response (presentation) need them, and outer layers may only depend inward.

### Response shape (2026-10-24)

- **Response candles use short keys: `t`, `o`, `h`, `l`, `c`, `v`**, the same as the assessment example. The domain `Candle` keeps `ts`, `open`, `high`, `low`, `close`, and `volume`, so domain code stays readable.
- **`ApiCandle` is a separate type in the presentation layer.** `toApiCandle()` is the only place that maps long names to short keys and formats `t`. The response can change without touching the domain, and the domain can change without breaking the API contract.
- **A test compares the exact JSON string.** It catches key order, extra keys such as `symbol`, long names, and the `t` format in one assertion.
- **The response is an object that wraps the candles: `{ "symbol", "tf", "candles": [...] }`**, as in the assessment example.
  - It can grow by adding fields without breaking existing clients.
  - The frontend can check that `symbol` and `tf` match the current selection before it shows the data.
  - Rejected alternative: a bare array of candles. It is shorter, but any new field would change the top-level type and break every client, and the response would not say which selection it answers.

## Prompt log

Chronological record of the prompts sent during development. Most prompts were written in Spanish; those entries are English translations.

### 1. Create documentation folder

**Date:** 2026-10-24

> First of all, I would like you to create a docs folder containing a markdown file that collects the prompts I send you.

### 2. Create .claude structure

**Date:** 2026-10-24

> Let's create a .claude folder that will contain a rules folder, a skills folder, and an agents folder.

### 3. Clean Architecture rules

**Date:** 2026-10-24

> I want you to create, inside rules, a markdown file called clean architecture that contains the following strict rules:
>
> - Layers: domain, application (use cases), infrastructure, presentation. Dependencies only point inward.
> - domain does not import frameworks, not Express/Nest, not fs, not React. Only pure TypeScript.
> - Business logic (candle aggregation, deduplication, validation) lives in domain/application, never in controllers or components.
> - Data access behind an interface (repository) defined in domain and implemented in infrastructure.
> - Controllers and components only translate input/output; zero logic.
> - Pure, testable functions; no any; typed errors, never NaN or unhandled exceptions.
> - No over-engineering: only the abstractions the problem needs.
>
> Short list of rules in the imperative, 40 lines max.

### 4. Create backend and frontend folders

**Date:** 2026-10-24

> Create a backend folder and a frontend folder.

### 5. Initialize Express and React projects with Vite

**Date:** 2026-10-24

> Initialize the Express project inside the backend folder and the React project inside the frontend folder, and let's use Vite.

### 6. No-regression rules

**Date:** 2026-10-24

> Create a rules file about no regression for this project. The idea is that when something already works and has passing tests, it does not break when new changes are made.
>
> Basically, I want it to say this:
> - What cannot break is the API contract, that is, the shape of the JSON that /candles returns, the HTTP status codes, the error messages, the values that symbol and tf accept, and that the candles come out sorted from oldest to newest.
> - Changes must be additive; it is better to add new code than to modify what already works. If something has to change, do it with an optional parameter that keeps the previous behavior working.
> - No renaming or deleting fields, routes, or functions that are already in use, especially the response types the frontend uses.
> - No drive-by refactors. If something could be improved, note it, but do not touch it.
> - Take special care with the aggregation and deduplication logic, the JSON loader, and the controller.
> - Run typecheck, lint, and tests before and after every change. If a test that passed starts failing, the change is not delivered. And if a test fails, it is not marked as skip.
>
> The project has no database and nothing deployed, so do not add rules about that. Write it in markdown, in Spanish, short, and as direct rules.

### 7. Frontend rules

**Date:** 2026-10-24

> Create a frontend rules file for this project. It is a small React + TypeScript app with Vite that has a symbol selector (MES and NQ), a timeframe selector (1m, 5m, 15m, 1h), and a candlestick chart that fetches data from GET /candles.
>
> The idea is for the interface to be simple but well made. I want it to say roughly this:
> - The loading, error, empty, and ready states are always distinguished. Never show a blank screen or made-up data.
> - If the user quickly changes symbol or timeframe, data from an old request must not be shown over the new one.
> - Errors are shown with a clear message and the option to retry.
> - The selectors use native elements with their label, and everything can be used with the keyboard.
> - The chart cleans up properly when the component unmounts and adapts to the container width without overflowing.
> - Times are shown in a clear format and the time zone is stated.
> - The data-fetching logic is kept separate from the visual components.
> - Default styles or plain CSS. No UI libraries, animations, or extra polish, because structure and judgment are graded, not design.
>
> Do not add rules about i18n, themes, audits, Core Web Vitals, or forms or files, which do not apply here. Write it in markdown, in Spanish, short, and with direct rules.

### 8. Security rules

**Date:** 2026-10-24

> Create a security rules file for this project. It is a TypeScript backend with Express or NestJS that has a single endpoint GET /candles?symbol=&tf= and reads data from a JSON file loaded into memory at startup. There are no users, no login, no database, and no personal data.
>
> I want the rule to focus on what does apply:
> - All input is validated against an allowlist. symbol can only be MES or NQ, and tf only 1m, 5m, 15m, or 1h. Anything else responds 400 with a clear message.
> - The errors the client sees never show stack traces, file paths, or internal details.
> - The JSON path is fixed on the server, never built from something the user sends.
> - A GET never changes anything.
> - CORS only allows the frontend origin, not everything with an asterisk.
> - No secrets in the repo. If there are environment variables, the .env goes in the .gitignore and a .env.example is provided.
> - No eval or anything similar.
> - Few dependencies, only the necessary ones, and review npm audit before delivering.
>
> Do not add rules about authentication, permissions, uploaded files, webhooks, or databases. Write it in markdown, in Spanish, short, and with direct rules.

### 9. Testing rules

**Date:** 2026-10-24

> Create a testing rules file for this project. It is a TypeScript backend that aggregates 1-minute candles into 5m, 15m, and 1h, and a React frontend. The data arrives unsorted, with some duplicate rows and with minutes that have no data.
>
> I want it to say roughly this:
> - Work with TDD whenever possible. First the test that fails for the right reason, then the minimum code to make it pass, and then improve it with everything green.
> - Every bug is fixed starting with a test that reproduces it.
> - Required backend tests. One that verifies the aggregation math (open of the first, close of the last, highest high, lowest low, summed volume). Another that shows duplicates do not change the result. Also cases of unsorted data, missing minutes, and invalid inputs that return 400.
> - For the endpoint, test the real HTTP responses with supertest or something similar.
> - Tests are deterministic, everything in UTC, and they do not depend on the order in which they run.
> - Test behavior, not implementation, and only mock what is at the edges.
> - No .only or .skip, and no loosening an assertion to make a test pass.
> - Test names are in English and describe what is expected.
> - Before calling something done, run typecheck, lint, and all tests.
>
> Do not add rules about E2E, performance, databases, OpenAPI contracts, or audits. Write it in markdown, in Spanish, short, and with direct rules.

### 10. Code quality rules

**Date:** 2026-10-24

> Create a code best-practices rules file for this project. It is a TypeScript backend with Express or NestJS that has GET /candles?symbol=&tf= and aggregates 1-minute candles from an in-memory JSON file, and a React + TypeScript frontend with Vite.
>
> I want it to say roughly this:
> - A function does only one thing. If describing it requires saying "and", it gets split.
> - Names in English, clear, and without odd abbreviations.
> - No magic numbers. Timeframe durations, the symbol list, and things like that go in named constants.
> - No dead code, commented-out code, or forgotten console.log calls.
> - Comments explain the why, not the what.
> - TypeScript in strict mode. any, @ts-ignore, and @ts-nocheck are forbidden. Avoid "as" and instead validate and narrow types with guards.
> - Switch statements on symbol or tf are exhaustive, with a never check.
> - Types are defined once and derived from there, not duplicated by hand.
> - The controller is thin. It receives the request, validates, calls the aggregation logic, and responds. The logic does not live in the controller.
> - Consistent HTTP status codes. 200 when everything goes well and 400 for invalid input, always with a clear message and a stable error code in UPPER_SNAKE_CASE, for example INVALID_TIMEFRAME.
> - In the frontend, the API call goes in its own module and is used from a hook, not directly inside the components.
> - Every control has its label and can be used with the keyboard.
> - Prettier and ESLint with no errors or warnings.
> - Few dependencies. First what the language provides or what is already installed, and a single package manager across the whole project.
>
> Do not add rules about databases, pagination, OpenAPI, permissions, Server Components, Tailwind, or form libraries, because they do not apply here. Write it in markdown, in Spanish, short, and with direct rules.

### 11. Code map

**Date:** 2026-10-24

> Create a file that works as a code map for this project, to be read before any task. If the code and the map ever disagree, the code wins and you should tell me so I can update it.
>
> The project is a technical assessment. It has a TypeScript backend with Express or NestJS in the backend/ folder and a React + TypeScript frontend built with Vite in the frontend/ folder. README.md and DECISIONS.md go in the root.
>
> I want the map to explain something like this
> - The architecture style. The backend uses lightweight Clean Architecture layers (domain, application, infrastructure, presentation), without overengineering.
> - A table with each folder and what it does. For example where the aggregation and deduplication logic lives, the JSON loader, the controller, the response types, and on the frontend the API module, the data fetching hook, and the selector and chart components.
> - The path of a request, from the moment the user changes a selector in the frontend until the backend returns the aggregated candles.
> - The shape of the GET /candles response and the possible errors with their HTTP status codes.
> - The quirks of the data. It comes unsorted, there are duplicate rows and some minutes are missing.
> - Which tests exist and what each one protects.
> - A known debt or pending work section, to note what I don't get to in the 3 hours.
>
> The project is just starting, so mark anything that doesn't exist yet as planned. Write it in markdown, in English, short and easy to scan.

### 12. Auditor agents

**Date:** 2026-10-24

> Based on each of the rules we created, I want you to create auditor agents inside the .claude folder, which will be in charge of documenting findings that we will take care of fixing. They will be launched only when we make a PR to main or a push to main, or if I ask you directly; otherwise, you do not have permission to launch them.

### 13. CLAUDE.md

**Date:** 2026-10-24

> Create a CLAUDE.md for this project, adapted from an AGENTS.md I use in another project. This one is a technical assessment with a 3-hour limit. It has a TypeScript backend with Express or NestJS in backend/, which exposes GET /candles?symbol=&tf= and aggregates 1-minute candles from an in-memory JSON file, and a React + TypeScript frontend with Vite in frontend/. The data arrives unsorted, with duplicate rows and some missing minutes.
>
> I want it to cover roughly this:
> - A short summary of the project and the guiding principle. Small and correct is worth more than big, and when something already works with passing tests, it does not break.
> - Non-negotiable rules. Never push or force-push, and only commit when I ask. TDD always. Run typecheck, lint, and tests before and after every change, and a test that passed cannot start failing. Never delete, skip, or weaken a test to make it pass. No new dependencies without asking me. Always report real results, and if something failed or was not done, say so with the command output.
> - A table pointing to the detailed rules in docs/rules/ (codebase-map.md, no-regression.md, testing.md, security.md, clean-architecture.md, coding-standards.md, frontend-ux-ui.md) and when to read each one.
> - The workflow. Understand the task and confirm the acceptance criteria if something is ambiguous, take the baseline, write the failing test, make it pass with the minimum code, refactor, run the full suite, and finish with a short report of what changed, which tests were added, and what risks there are.
> - At the end of each task, remind me to log the prompt I used in DECISIONS.md, because the assessment requires it.
> - The commands to run typecheck, lint, tests, and both apps, using a single package manager.
> - Language. Code, identifiers, comments, documentation, and commit messages in English, with Conventional Commits. Talk to me in Spanish.
>
> Do not include anything about auditors, Docker, Windows quirks, databases, permissions, i18n, or production deployments, because none of that applies here. Write it in markdown, in English, and short, under 80 lines.

### 14. Review tooling setup

**Date:** 2026-10-24

> Read CLAUDE.md and the rules in docs/rules before starting. Then review how backend/ and frontend/ are configured and tell me what is missing to work well. I care that TypeScript is in strict mode, that there are ESLint and Prettier, and that the backend has a test runner with supertest. Do not change anything yet; just tell me what you found and what you propose to install.

### 15. Install and configure tooling

**Date:** 2026-10-24

> Everything approved. Only one adjustment to point 2: relax the no-unsafe-* rules in test files, because supertest's res.body is any and I don't want to fight the linter there. In regular code I do want them enforced, and for data coming from JSON.parse or response.json(), use guard functions instead of "as". Go ahead.

### 16. Project README

**Date:** 2026-10-24

> The project's README.
>
> (Answer to: should `README.md` stay as the dataset README or become the project README?)

### 17. Candle aggregation with TDD

**Date:** 2026-10-24

> Let's do the aggregation logic in the backend, with TDD. First write the tests and run them to see that they fail for the right reason, and then implement.
>
> The function receives 1-minute candles and a timeframe (1m, 5m, 15m, or 1h) and returns the aggregated candles. The rules are these:
> - Duplicates are removed by symbol + ts, because a duplicate is the same candle sent again.
> - They are sorted by time, because the JSON comes unsorted.
> - Each candle falls into its interval by rounding ts down, aligned to the clock in UTC. That is, the 14:07 candle falls into the 5m interval of 14:05.
> - Open of the first, close of the last, highest high, lowest low, and summed volume.
> - If minutes are missing, no candles are invented; aggregate with the ones that exist. If an interval has none, it does not appear.
>
> The minimum tests are the example from the assessment (o 100, h 101, l 99.5, c 100.5, v 20 + o 100.5, h 102, l 100, c 101, v 10 + o 101, h 101.5, l 98, c 99, v 30 give o 100, h 102, l 98, c 99, v 60), one that shows duplicates do not change the result, one with unsorted data, and one with missing minutes. It must be a pure function, without Express or fs.

### 18. Remove empty root npm files

**Date:** 2026-10-24

> Yes, delete them.
>
> (Answer to: should the root `package.json` containing `{}` and the empty `package-lock.json` be deleted?)

### 19. Timestamp format and strict loader validation

**Date:** 2026-10-24

> For t in the response, use ISO 8601 in UTC without milliseconds, the same as the assessment example, for example 2026-08-25T14:00:00Z. Watch out: toISOString adds .000, so it has to be removed. Add a test that verifies the exact format.
>
> In the loader, besides Date.parse, validate that ts has ISO format with a regex, because Date.parse accepts odd formats, and that it falls on second 0 of a minute. Record these two decisions in DECISIONS.md.

### 20. Domain types and type guards

**Date:** 2026-10-24

> Let's start with the domain layer. Create the types Instrument (MES | NQ), Timeframe (1m | 5m | 15m | 1h), and Candle with symbol, ts, open, high, low, close, and volume. The lists of symbols and timeframes go as as const arrays, and the types are derived from them so they are not duplicated. Add a constant TIMEFRAME_MS that maps each timeframe to its duration in milliseconds, typed with Record<Timeframe, number> so TypeScript complains if one is missing.
>
> I also want the guards isInstrument(value: unknown) and isTimeframe(value: unknown) to narrow types without using "as". First the guard tests (valid values, invalid values, different upper and lower case, undefined, numbers) and then the implementation. No Express or fs in this layer.

### 21. Short keys in the response

**Date:** 2026-10-24

> Short: t, o, h, l, c, and v, the same as the assessment example. In the domain the candle keeps the long names, and the mapping to the short ones happens only in the presentation layer when building the response. Define a type for the API response separate from the domain Candle type, and add a test that verifies the exact shape of the JSON.

### 22. Response envelope

**Date:** 2026-10-24

> An object that wraps the candles, { symbol, tf, candles: [...] }, as in the map draft and the assessment example. It is the shape that can be extended by adding fields without breaking clients, and the frontend can also check that the response matches the current selection. Record it in DECISIONS.md with the bare array as the rejected alternative.

### 23. bucketStart

**Date:** 2026-10-24

> Now a pure function bucketStart(ts, timeframe) that returns the start of the interval a candle belongs to, rounding down and aligned to the clock in UTC. Work with epoch in milliseconds so it does not depend on the system time zone.
>
> TDD first. Minimum cases: 14:07 in 5m gives 14:05, 14:05 in 5m gives 14:05 (the exact boundary belongs to its own interval), 14:14 in 15m gives 14:00, 13:30 in 1h gives 13:00, and in 1m it returns the same minute.

### 24. normalizeCandles

**Date:** 2026-10-24

> Now a pure function that receives 1-minute candles, removes duplicates by the key symbol + ts, and returns them sorted by ts ascending. A duplicate is the same candle sent again, so the first appearance is kept. It must not mutate the input array.
>
> Tests first. One with exact duplicates, one with unsorted data, one that checks the original array did not change, and one with an empty array.

### 25. aggregate

**Date:** 2026-10-24

> Now the function aggregate(candles, timeframe), which uses the two previous ones. It groups by bucketStart and for each group computes open of the first candle, close of the last, highest high, lowest low, and summed volume. Intervals with no candles do not appear and no candles are invented for missing minutes. The result is sorted ascending.
>
> With noUncheckedIndexedAccess, accessing the first or last candle of the group gives Candle | undefined. Handle it properly, without "!" or "as", so that NaN or undefined can never come out.
>
> Tests first.
> - The assessment example, (o 100, h 101, l 99.5, c 100.5, v 20) + (o 100.5, h 102, l 100, c 101, v 10) + (o 101, h 101.5, l 98, c 99, v 30) gives o 100, h 102, l 98, c 99, v 60.
> - The same data with duplicate rows gives exactly the same result.
> - The same data unsorted gives exactly the same result.
> - An interval with missing minutes is aggregated with the ones that exist.
> - In 1m the result equals the deduplicated and sorted input.
> - An empty array returns an empty array.

### 26. parseCandle

**Date:** 2026-10-24

> Now a function parseCandle(value: unknown) that turns a raw row from the JSON into a valid Candle or returns an error that says which field failed. It must validate that it is an object, that symbol is a valid Instrument, that ts is a parseable ISO 8601, that open, high, low, and close are finite numbers, that volume is a non-negative integer, and that high is greater than or equal to low. No "as", only narrowing with guards, because JSON.parse returns any.
>
> Tests first, with one valid row and one invalid row for each rule.
>
> (Follow-up answer: update the 3 loader tests that expected `INVALID_NUMBER` to the field-specific codes.)
