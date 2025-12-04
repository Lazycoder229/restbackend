/**
 * Exception Filters for custom error handling
 */

import * as http from "http";

/**
 * Base HTTP Exception
 */
export class HttpException extends Error {
  constructor(
    private readonly response: string | object,
    private readonly status: number
  ) {
    super(
      typeof response === "string"
        ? response
        : (response as any).message || "Internal Server Error"
    );
    this.name = "HttpException";
  }

  getStatus(): number {
    return this.status;
  }

  getResponse(): string | object {
    return this.response;
  }
}

/**
 * Built-in HTTP Exceptions
 */
export class BadRequestException extends HttpException {
  constructor(message: string | object = "Bad Request") {
    super(message, 400);
    this.name = "BadRequestException";
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string | object = "Unauthorized") {
    super(message, 401);
    this.name = "UnauthorizedException";
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string | object = "Forbidden") {
    super(message, 403);
    this.name = "ForbiddenException";
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string | object = "Not Found") {
    super(message, 404);
    this.name = "NotFoundException";
  }
}

export class MethodNotAllowedException extends HttpException {
  constructor(message: string | object = "Method Not Allowed") {
    super(message, 405);
    this.name = "MethodNotAllowedException";
  }
}

export class NotAcceptableException extends HttpException {
  constructor(message: string | object = "Not Acceptable") {
    super(message, 406);
    this.name = "NotAcceptableException";
  }
}

export class RequestTimeoutException extends HttpException {
  constructor(message: string | object = "Request Timeout") {
    super(message, 408);
    this.name = "RequestTimeoutException";
  }
}

export class ConflictException extends HttpException {
  constructor(message: string | object = "Conflict") {
    super(message, 409);
    this.name = "ConflictException";
  }
}

export class GoneException extends HttpException {
  constructor(message: string | object = "Gone") {
    super(message, 410);
    this.name = "GoneException";
  }
}

export class PayloadTooLargeException extends HttpException {
  constructor(message: string | object = "Payload Too Large") {
    super(message, 413);
    this.name = "PayloadTooLargeException";
  }
}

export class UnsupportedMediaTypeException extends HttpException {
  constructor(message: string | object = "Unsupported Media Type") {
    super(message, 415);
    this.name = "UnsupportedMediaTypeException";
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message: string | object = "Unprocessable Entity") {
    super(message, 422);
    this.name = "UnprocessableEntityException";
  }
}

export class TooManyRequestsException extends HttpException {
  constructor(message: string | object = "Too Many Requests") {
    super(message, 429);
    this.name = "TooManyRequestsException";
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message: string | object = "Internal Server Error") {
    super(message, 500);
    this.name = "InternalServerErrorException";
  }
}

export class NotImplementedException extends HttpException {
  constructor(message: string | object = "Not Implemented") {
    super(message, 501);
    this.name = "NotImplementedException";
  }
}

export class BadGatewayException extends HttpException {
  constructor(message: string | object = "Bad Gateway") {
    super(message, 502);
    this.name = "BadGatewayException";
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(message: string | object = "Service Unavailable") {
    super(message, 503);
    this.name = "ServiceUnavailableException";
  }
}

export class GatewayTimeoutException extends HttpException {
  constructor(message: string | object = "Gateway Timeout") {
    super(message, 504);
    this.name = "GatewayTimeoutException";
  }
}

/**
 * Exception Filter interface
 */
export interface ExceptionFilter<T = any> {
  catch(
    exception: T,
    request: http.IncomingMessage,
    response: http.ServerResponse
  ): void;
}

/**
 * Exception filter metadata
 */
const EXCEPTION_FILTER_METADATA = Symbol("exception:filter");

/**
 * @Catch decorator - Mark exception filter for specific exception types
 */
export function Catch(...exceptions: any[]): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EXCEPTION_FILTER_METADATA, exceptions, target);
  };
}

/**
 * Get exception types handled by a filter
 */
export function getCatchExceptions(filter: any): any[] {
  return Reflect.getMetadata(EXCEPTION_FILTER_METADATA, filter) || [];
}

/**
 * Default HTTP Exception Filter
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(
    exception: HttpException,
    request: http.IncomingMessage,
    response: http.ServerResponse
  ): void {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message,
      ...(typeof exceptionResponse === "object" ? exceptionResponse : {}),
    };

    response.statusCode = status;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(errorResponse));
  }
}

/**
 * All Exceptions Filter (catch-all)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(
    exception: Error,
    request: http.IncomingMessage,
    response: http.ServerResponse
  ): void {
    const isDevelopment = process.env.NODE_ENV !== "production";

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message || "Internal Server Error",
    };

    // Include stack trace in development mode
    if (isDevelopment) {
      errorResponse.stack = exception.stack;
      errorResponse.name = exception.name;
    }

    // Include validation errors if present
    if ((exception as any).validationErrors) {
      errorResponse.errors = (exception as any).validationErrors;
    }

    response.statusCode = status;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(errorResponse));

    // Log error
    console.error(
      `[${new Date().toISOString()}] [ERROR] ${exception.name}: ${
        exception.message
      }`
    );
    if (isDevelopment && exception.stack) {
      console.error(exception.stack);
    }
  }
}

/**
 * Exception Handler - manages multiple exception filters
 */
export class ExceptionHandler {
  private filters: Array<{
    filter: ExceptionFilter;
    exceptions: any[];
  }> = [];

  /**
   * Add an exception filter
   */
  addFilter(FilterClass: any): void {
    const filter = new FilterClass();
    const exceptions = getCatchExceptions(FilterClass);
    this.filters.push({ filter, exceptions });
  }

  /**
   * Handle an exception
   */
  handle(
    exception: any,
    request: http.IncomingMessage,
    response: http.ServerResponse
  ): void {
    // Find matching filter
    for (const { filter, exceptions } of this.filters) {
      // If no specific exceptions, it's a catch-all filter
      if (exceptions.length === 0) {
        filter.catch(exception, request, response);
        return;
      }

      // Check if exception matches
      for (const ExceptionType of exceptions) {
        if (exception instanceof ExceptionType) {
          filter.catch(exception, request, response);
          return;
        }
      }
    }

    // No filter found, use default error response
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        statusCode: status,
        message: exception.message || "Internal Server Error",
        timestamp: new Date().toISOString(),
        path: request.url,
      })
    );
  }
}
