# Code quality

Rules for the backend (`GET /candles?symbol=&tf=`, which aggregates 1-minute candles from an in-memory JSON file) and the React + TypeScript frontend with Vite.

## Functions and names

- Make each function do one thing. If describing it needs the word "and", split it.
- Write names in English. Keep them clear, with no unusual abbreviations.

## Constants

- Do not use magic numbers.
- Put timeframe durations, the symbol list, and similar values in named constants.

## Clean code

- Do not leave dead code, commented-out code, or forgotten `console.log` calls.
- Write comments that explain why, not what.

## TypeScript

- Use `strict` mode.
- Never use `any`, `@ts-ignore`, or `@ts-nocheck`.
- Avoid `as` type assertions (`as const` is fine). Validate and narrow types with type guards instead.
- Treat data from `JSON.parse` and `response.json()` as `unknown`. Narrow it with type guard functions, never with `as`.
- Make every `switch` on `symbol` or `tf` exhaustive, with a `never` check.
- Define each type once and derive the others from it. Do not duplicate types by hand.

## Backend

- Keep the controller thin: receive the request, validate it with the domain validation, call the aggregation logic, and respond.
- Never put logic in the controller.
- Use consistent HTTP status codes: `200` on success, `400` for invalid input.
- Send every error with a clear message and a stable error code in `UPPER_SNAKE_CASE`, for example `INVALID_TIMEFRAME`.

## Frontend

- Put API calls in their own module.
- Use that module from a hook, never directly inside components.
- Give every control a label and make it usable with the keyboard.

## Tooling

- Keep Prettier and the linter at zero errors and zero warnings.
- Keep dependencies few. Prefer what the language provides or what is already installed.
- Use one package manager for the whole project: npm.
