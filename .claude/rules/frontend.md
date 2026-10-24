---
paths:
  - "frontend/**"
---

# Frontend

Rules for the React + TypeScript app with Vite: symbol selector (`MES`, `NQ`), timeframe selector (`1m`, `5m`, `15m`, `1h`), and a candlestick chart that fetches data from `GET /candles`.

## View states

- Always distinguish four states: loading, error, empty, and ready.
- Never show a blank screen.
- Never show made-up data.

## Requests

- Keep data-fetching logic separate from visual components, for example in a custom hook.
- Cancel or discard the previous request when the symbol or timeframe changes.
- Never show data from an old request over data from the new one.

## Errors

- Show each error with a clear message.
- Always offer a retry option.

## Selectors and keyboard

- Use native `<select>` elements, each with its `<label>`.
- Make the whole interface usable with the keyboard.

## Chart

- Clean up the chart when the component unmounts: destroy the instance and remove listeners and observers.
- Fit the chart to the container width. Do not let it overflow.

## Times

- Show times in a clear format.
- Always state the time zone.

## Styles

- Use default styles or plain CSS.
- Do not use UI libraries or animations.
- Do not add extra visual polish. Structure and judgment are graded, not design.
