export type ApiErrorCode =
  | 'MISSING_SYMBOL'
  | 'INVALID_SYMBOL'
  | 'MISSING_TIMEFRAME'
  | 'INVALID_TIMEFRAME'

export interface ApiError {
  readonly code: ApiErrorCode
  readonly message: string
}

/** Body of every error response: `{ "error": { "code", "message" } }`. */
export interface ErrorResponse {
  readonly error: ApiError
}

export function toErrorResponse(error: ApiError): ErrorResponse {
  return { error }
}
