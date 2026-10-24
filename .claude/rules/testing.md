# Testing

Rules for the backend, which aggregates 1-minute candles into 5m, 15m, and 1h, and for the React frontend. Input data arrives unsorted, with some duplicate rows and some minutes missing.

## TDD

- Use TDD whenever possible.
- Write the test first and confirm it fails for the right reason.
- Write the minimum code that makes it pass.
- Refactor only while all tests are green.

## Bugs

- Fix every bug by first writing a test that reproduces it.

## Required backend tests

- Aggregation math: open of the first candle, close of the last, highest high, lowest low, summed volume.
- Duplicate rows do not change the result.
- Unsorted input.
- Missing minutes.
- Invalid input returns `400`.

## Endpoint

- Test real HTTP responses with `supertest` or a similar tool.

## Determinism

- Make every test deterministic. Do not depend on the current time or random values.
- Use UTC for all dates and times.
- Make every test independent of execution order.

## Scope

- Test behavior, not implementation.
- Mock only at the edges, for example the file system or `fetch`.

## Forbidden

- Never commit `.only` or `.skip`.
- Never loosen an assertion to make a test pass.

## Names

- Write test names in English.
- Make each name describe the expected behavior.

## Done

- Before you call a task done, run typecheck, lint, and all tests.
