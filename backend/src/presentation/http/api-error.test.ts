import { describe, expect, it } from 'vitest'
import { toErrorResponse } from './api-error.ts'

describe('toErrorResponse', () => {
  it('wraps the error as exactly {"error":{"code","message"}}', () => {
    const body = toErrorResponse({
      code: 'INVALID_TIMEFRAME',
      message: 'Query parameter "tf" must be exactly one of: 1m, 5m, 15m, 1h.',
    })

    expect(JSON.stringify(body)).toBe(
      '{"error":{"code":"INVALID_TIMEFRAME","message":"Query parameter \\"tf\\" must be exactly one of: 1m, 5m, 15m, 1h."}}',
    )
  })
})
