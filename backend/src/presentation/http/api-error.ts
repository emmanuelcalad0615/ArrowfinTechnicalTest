export type QueryErrorCode =
  | 'MISSING_SYMBOL'
  | 'INVALID_SYMBOL'
  | 'MISSING_TIMEFRAME'
  | 'INVALID_TIMEFRAME'

export type ApiErrorCode = QueryErrorCode | 'NOT_FOUND' | 'INTERNAL_ERROR'

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
