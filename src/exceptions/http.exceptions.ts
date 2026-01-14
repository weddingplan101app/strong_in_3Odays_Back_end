

/**
 * Base HTTP Exception class
 */
export class HttpException extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public timestamp: Date;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HttpException.prototype);
    
    // Capture stack trace (excluding constructor call)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request Exception
 * Used when the request is malformed or missing required data
 */
export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request') {
    super(message, 400);
    Object.setPrototypeOf(this, BadRequestException.prototype);
  }
}

/**
 * 401 Unauthorized Exception
 * Used when authentication is required and has failed or not been provided
 */
export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}

/**
 * 403 Forbidden Exception
 * Used when the user doesn't have permission to access a resource
 */
export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }
}

/**
 * 404 Not Found Exception
 * Used when a resource is not found
 */
export class NotFoundException extends HttpException {
  constructor(message = 'Not Found') {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

/**
 * 409 Conflict Exception
 * Used when there's a conflict with the current state of the resource
 */
export class ConflictException extends HttpException {
  constructor(message = 'Conflict') {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictException.prototype);
  }
}

/**
 * 422 Unprocessable Entity Exception
 * Used when the request is well-formed but contains semantic errors
 */
export class UnprocessableEntityException extends HttpException {
  constructor(message = 'Unprocessable Entity') {
    super(message, 422);
    Object.setPrototypeOf(this, UnprocessableEntityException.prototype);
  }
}

/**
 * 429 Too Many Requests Exception
 * Used when rate limiting is exceeded
 */
export class TooManyRequestsException extends HttpException {
  constructor(message = 'Too Many Requests') {
    super(message, 429);
    Object.setPrototypeOf(this, TooManyRequestsException.prototype);
  }
}

/**
 * 500 Internal Server Error Exception
 * Used for unexpected server errors
 */
export class InternalServerErrorException extends HttpException {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
    this.isOperational = false;
    Object.setPrototypeOf(this, InternalServerErrorException.prototype);
  }
}

/**
 * 503 Service Unavailable Exception
 * Used when the service is temporarily unavailable
 */
export class ServiceUnavailableException extends HttpException {
  constructor(message = 'Service Unavailable') {
    super(message, 503);
    Object.setPrototypeOf(this, ServiceUnavailableException.prototype);
  }
}

/**
 * Type guard to check if an error is an HttpException
 */
export function isHttpException(error: unknown): error is HttpException {
  return error instanceof HttpException;
}

/**
 * Create a custom HTTP exception
 */
export function createHttpException(
  message: string, 
  statusCode: number, 
  isOperational = true
): HttpException {
  return new (class extends HttpException {
    constructor() {
      super(message, statusCode, isOperational);
    }
  })();
}