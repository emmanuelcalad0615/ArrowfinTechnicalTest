import type { ErrorRequestHandler, RequestHandler } from 'express'
import { toErrorResponse } from './api-error.ts'

export const handleNotFound: RequestHandler = (_req, res) => {
  res
    .status(404)
    .json(toErrorResponse({ code: 'NOT_FOUND', message: 'Route not found.' }))
}

// Registered last. Details go to the server log only; the client gets a generic message.
export const handleError: ErrorRequestHandler = (error, _req, res, next) => {
  console.error(error)
  if (res.headersSent) {
    next(error)
    return
  }
  res.status(500).json(
    toErrorResponse({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    }),
  )
}
