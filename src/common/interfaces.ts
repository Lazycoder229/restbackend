/**
 * Execution context for guards, interceptors, and pipes
 */
export interface ExecutionContext {
  getRequest<T = any>(): T;
  getResponse<T = any>(): T;
  getHandler(): Function;
  getClass(): any;
  switchToHttp(): {
    getRequest(): any;
    getResponse(): any;
  };
}

/**
 * Pipe interface - transforms and validates input data
 */
export interface PipeTransform<T = any, R = any> {
  transform(value: T, metadata?: ArgumentMetadata): R | Promise<R>;
}

/**
 * Argument metadata for pipes
 */
export interface ArgumentMetadata {
  type: "body" | "query" | "param" | "custom";
  metatype?: any;
  data?: string;
}

/**
 * Guard interface - determines if a request should be handled
 */
export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

/**
 * Interceptor interface - transforms responses and adds cross-cutting logic
 */
export interface RestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Promise<any> | any;
}

/**
 * Call handler for interceptors
 */
export interface CallHandler<T = any> {
  handle(): Promise<T>;
}

/**
 * Exception filter interface
 */
export interface ExceptionFilter<T = any> {
  catch(exception: T, context: ExecutionContext): any;
}

/**
 * HTTP Exception
 */
export class HttpException extends Error {
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    private readonly response: string | Record<string, any>,
    private readonly status: number,
    details?: any
  ) {
    super();
    this.message =
      typeof response === "string" ? response : JSON.stringify(response);
    this.statusCode = status;
    this.details = details;
  }

  getStatus(): number {
    return this.status;
  }

  getResponse(): string | Record<string, any> {
    return this.response;
  }
}

/**
 * Common HTTP Exceptions
 */
export class BadRequestException extends HttpException {
  constructor(message?: string) {
    super(message || "Bad Request", 400);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message?: string) {
    super(message || "Unauthorized", 401);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message?: string) {
    super(message || "Forbidden", 403);
  }
}

export class NotFoundException extends HttpException {
  constructor(message?: string) {
    super(message || "Not Found", 404);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message?: string) {
    super(message || "Internal Server Error", 500);
  }
}

/**
 * Built-in validation pipe
 */
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata?: ArgumentMetadata): any {
    // Basic validation - can be extended with class-validator
    if (value === undefined || value === null) {
      throw new BadRequestException(
        `Validation failed: ${metadata?.data || "value"} is required`
      );
    }
    return value;
  }
}

/**
 * Built-in parse int pipe
 */
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata?: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException(
        `Validation failed: ${metadata?.data || "value"} must be a number`
      );
    }
    return val;
  }
}
