# Security

Rules for the backend: a single endpoint `GET /candles?symbol=&tf=` that reads a JSON file loaded into memory at startup.

## Input validation

- Validate all input against an allowlist.
- Accept only `MES` or `NQ` for `symbol`.
- Accept only `1m`, `5m`, `15m`, or `1h` for `tf`.
- Respond `400` with a clear message for any other value, including missing, empty, or repeated parameters.

## Errors

- Never show stack traces, file paths, or internal details to the client.
- Use a custom error handler. The Express default handler shows stack traces outside production.

## Data file

- Fix the JSON file path on the server.
- Never build that path from user-supplied data.

## HTTP methods

- Make sure a `GET` never changes anything.

## CORS

- Allow only the frontend origin.
- Never use `*`.

## Secrets

- Do not commit secrets to the repo.
- If you use environment variables, add `.env` to `.gitignore` and provide a `.env.example`.

## Code

- Do not use `eval`, `new Function`, or anything that runs code built at runtime.

## Dependencies

- Add only the dependencies you need.
- Run `npm audit` before delivering and review every vulnerability it reports.
