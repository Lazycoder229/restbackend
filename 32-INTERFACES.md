# Interfaces Documentation

## Overview

The common interfaces module defines all core interfaces for guards, interceptors, pipes, exception filters, and HTTP exceptions used throughout Fynix applications.

## Table of Contents

- [Core Interfaces](#core-interfaces)
- [Exception Classes](#exception-classes)
- [Built-in Pipes](#built-in-pipes)
- [Examples](#examples)

---

## Core Interfaces

### ExecutionContext

Provides context information for guards, interceptors, and pipes.

```typescript
interface ExecutionContext {
  getRequest<T = any>(): T;
  getResponse<T = any>(): T;
  getHandler(): Function;
  getClass(): any;
  switchToHttp(): {
    getRequest(): any;
    getResponse(): any;
  };
}
```

### PipeTransform

Interface for implementing custom pipes.

```typescript
interface PipeTransform<T = any, R = any> {
  transform(value: T, metadata?: ArgumentMetadata): R | Promise<R>;
}
```

### CanActivate

Interface for implementing guards.

```typescript
interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
```

### FynixInterceptor

Interface for implementing interceptors.

```typescript
interface FynixInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Promise<any> | any;
}
```

### ExceptionFilter

Interface for implementing exception filters.

```typescript
interface ExceptionFilter<T = any> {
  catch(exception: T, context: ExecutionContext): any;
}
```

---

## Exception Classes

### HttpException

Base HTTP exception class.

```typescript
class HttpException extends Error {
  constructor(
    response: string | Record<string, any>,
    status: number,
    details?: any
  );

  getStatus(): number;
  getResponse(): string | Record<string, any>;
}
```

### Built-in HTTP Exceptions

```typescript
// 400 Bad Request
class BadRequestException extends HttpException {
  constructor(message?: string);
}

// 401 Unauthorized
class UnauthorizedException extends HttpException {
  constructor(message?: string);
}

// 403 Forbidden
class ForbiddenException extends HttpException {
  constructor(message?: string);
}

// 404 Not Found
class NotFoundException extends HttpException {
  constructor(message?: string);
}

// 500 Internal Server Error
class InternalServerErrorException extends HttpException {
  constructor(message?: string);
}
```

---

## Built-in Pipes

### ValidationPipe

Basic validation pipe for required values.

```typescript
class ValidationPipe implements PipeTransform {
  transform(value: any, metadata?: ArgumentMetadata): any;
}
```

### ParseIntPipe

Parse string to integer.

```typescript
class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata?: ArgumentMetadata): number;
}
```

---

## Examples

### Custom Guard

```typescript
import { CanActivate, ExecutionContext } from './common/interfaces';

export class RoleGuard implements CanActivate {
  constructor(private requiredRole: string) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.getRequest();
    const user = request.user;

    return user && user.role === this.requiredRole;
  }
}

// Usage
@UseGuards(new RoleGuard('admin'))
@Get('/admin')
adminOnly() {
  return { message: 'Admin access' };
}
```

### Custom Pipe

```typescript
import { PipeTransform, BadRequestException } from './common/interfaces';

export class ParseEmailPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      throw new BadRequestException('Invalid email format');
    }

    return value.toLowerCase();
  }
}

// Usage
@Post('/register')
register(@Body('email', ParseEmailPipe) email: string) {
  return { email };
}
```

### Custom Interceptor

```typescript
import {
  FynixInterceptor,
  ExecutionContext,
  CallHandler,
} from "./common/interfaces";

export class TimingInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const startTime = Date.now();

    const result = await next.handle();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Request took ${duration}ms`);

    return result;
  }
}

// Usage
@UseInterceptors(TimingInterceptor)
@Controller("/api")
export class ApiController {}
```

### Custom Exception Filter

```typescript
import {
  ExceptionFilter,
  ExecutionContext,
  HttpException,
} from "./common/interfaces";

export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    response.statusCode = status;
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      })
    );
  }
}
```

### Using HTTP Exceptions

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "./common/interfaces";

@Controller("/users")
export class UserController {
  @Get("/:id")
  async getUser(@Param("id") id: string) {
    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  @Post()
  async createUser(@Body() data: any) {
    if (!data.email) {
      throw new BadRequestException("Email is required");
    }

    return await User.create(data);
  }

  @Delete("/:id")
  async deleteUser(@Param("id") id: string, @Req() req: any) {
    if (!req.user || !req.user.isAdmin) {
      throw new UnauthorizedException("Admin access required");
    }

    await User.delete(id);
    return { message: "User deleted" };
  }
}
```

### Using Built-in Pipes

```typescript
import { ValidationPipe, ParseIntPipe } from "./common/interfaces";

@Controller("/posts")
export class PostController {
  @Get("/:id")
  getPost(@Param("id", ParseIntPipe) id: number) {
    // id is guaranteed to be a number
    return Post.findById(id);
  }

  @Post()
  createPost(@Body(ValidationPipe) data: any) {
    // data is validated to exist
    return Post.create(data);
  }
}
```

---

## Related Documentation

- [Guards Decorator](./GUARDS_DECORATOR.md)
- [Interceptors Decorator](./INTERCEPTORS_DECORATOR.md)
- [Pipes Decorator](./PIPES_DECORATOR.md)
- [Exception Filter](./EXCEPTION_FILTER.md)

---

**Last Updated**: December 4, 2025
