# No regression

Strict rules. What already works and has passing tests must not break.

## API contract

- Do not change the shape of the JSON that `/candles` returns.
- Do not change HTTP status codes or error messages.
- Do not remove or change the values that `symbol` and `tf` accept.
- Always return candles sorted from oldest to newest.

## Additive changes

- Prefer adding new code over modifying code that already works.
- If you must change a behavior, do it with an optional parameter. Without that parameter, the previous behavior stays the same.

## Names and types

- Do not rename or delete fields, routes, or functions that are already in use.
- Apply this rule above all to the response types the frontend uses.

## No drive-by refactors

- Do not refactor outside the scope of the change.
- If you see something to improve, note it in the change summary, but do not touch it.

## Sensitive areas

Take special care when touching:

- The candle aggregation and deduplication logic.
- The JSON loader.
- The `/candles` controller.

## Verification

- Run typecheck, lint, and tests before and after every change.
- If a test that passed starts failing, do not deliver the change.
- Never mark a failing test as skipped.
