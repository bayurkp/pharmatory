import { ByJsonErrorDetail } from '../types/by-json.types.js'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: ByJsonErrorDetail[]

  constructor(
    message: string,
    statusCode = 500,
    code = 'internal_error',
    details?: ByJsonErrorDetail[]
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'not_found')
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ByJsonErrorDetail[]) {
    super(message, 422, 'validation_error', details)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'bad_request')
  }
}
