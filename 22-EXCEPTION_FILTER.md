# Exception Filter Documentation

## Overview

Exception Filters provide centralized error handling in Fynix applications. They catch exceptions thrown during request processing and transform them into appropriate HTTP responses. Fynix includes built-in HTTP exception classes for common error scenarios.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Built-in Exceptions](#built-in-exceptions)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Custom Exceptions](#custom-exceptions)
- [Global Error Handler](#global-error-handler)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from "./builtin/exception.filter";
```

---

## Built-in Exceptions

### HTTP Exception Classes

| Exception                       | Status Code | Description                    |
| ------------------------------- | ----------- | ------------------------------ |
| `BadRequestException`           | 400         | Invalid request data           |
| `UnauthorizedException`         | 401         | Authentication required        |
| `ForbiddenException`            | 403         | Access denied                  |
| `NotFoundException`             | 404         | Resource not found             |
| `MethodNotAllowedException`     | 405         | HTTP method not allowed        |
| `NotAcceptableException`        | 406         | Response format not acceptable |
| `RequestTimeoutException`       | 408         | Request timed out              |
| `ConflictException`             | 409         | Resource conflict              |
| `GoneException`                 | 410         | Resource no longer available   |
| `PayloadTooLargeException`      | 413         | Request payload too large      |
| `UnsupportedMediaTypeException` | 415         | Media type not supported       |
| `UnprocessableEntityException`  | 422         | Validation failed              |
| `TooManyRequestsException`      | 429         | Rate limit exceeded            |
| `InternalServerErrorException`  | 500         | Server error                   |
| `NotImplementedException`       | 501         | Feature not implemented        |
| `BadGatewayException`           | 502         | Bad gateway                    |
| `ServiceUnavailableException`   | 503         | Service unavailable            |
| `GatewayTimeoutException`       | 504         | Gateway timeout                |

---

## Basic Usage

### Throwing Exceptions

```typescript
import {
  NotFoundException,
  BadRequestException,
} from "./builtin/exception.filter";

@Injectable()
export class UserController {
  @Get("/:id")
  async getUser(@Param("id") id: number) {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  @Post()
  async createUser(@Body() data: CreateUserDto) {
    if (!data.email) {
      throw new BadRequestException("Email is required");
    }

    return await this.userService.create(data);
  }
}
```

### Exception with Detailed Response

```typescript
@Post('/register')
async register(@Body() data: RegisterDto) {
  const existingUser = await this.userService.findByEmail(data.email);

  if (existingUser) {
    throw new ConflictException({
      message: 'User already exists',
      error: 'DUPLICATE_EMAIL',
      field: 'email'
    });
  }

  return await this.userService.create(data);
}
```

---

## API Reference

### HttpException

Base class for all HTTP exceptions.

```typescript
class HttpException extends Error {
  constructor(response: string | object, status: number);
  getStatus(): number;
  getResponse(): string | object;
}
```

#### Usage

```typescript
// String message
throw new HttpException("Something went wrong", 500);

// Object response
throw new HttpException(
  {
    message: "Validation failed",
    errors: ["Email is invalid", "Password too short"],
  },
  400
);
```

### BadRequestException (400)

```typescript
class BadRequestException extends HttpException {
  constructor(message?: string | object);
}
```

```typescript
// Simple message
throw new BadRequestException("Invalid input");

// Detailed errors
throw new BadRequestException({
  message: "Validation failed",
  errors: {
    email: "Invalid email format",
    age: "Must be at least 18",
  },
});
```

### UnauthorizedException (401)

```typescript
class UnauthorizedException extends HttpException {
  constructor(message?: string | object);
}
```

```typescript
throw new UnauthorizedException("Invalid credentials");
throw new UnauthorizedException({
  message: "Token expired",
  code: "TOKEN_EXPIRED",
});
```

### ForbiddenException (403)

```typescript
class ForbiddenException extends HttpException {
  constructor(message?: string | object);
}
```

```typescript
throw new ForbiddenException(
  "You do not have permission to access this resource"
);
```

### NotFoundException (404)

```typescript
class NotFoundException extends HttpException {
  constructor(message?: string | object);
}
```

```typescript
throw new NotFoundException("User not found");
throw new NotFoundException({
  message: "Resource not found",
  resourceType: "User",
  resourceId: id,
});
```

### ConflictException (409)

```typescript
class ConflictException extends HttpException {
  constructor(message?: string | object);
}
```

```typescript
throw new ConflictException("Email already registered");
```

### UnprocessableEntityException (422)

```typescript
class UnprocessableEntityException extends HttpException {
  constructor(message?: string | object);
}
```

```typescript
throw new UnprocessableEntityException({
  message: "Validation failed",
  errors: validationErrors,
});
```

### InternalServerErrorException (500)

```typescript
class InternalServerErrorException extends HttpException {
  constructor(message?: string | object);
}
```

```typescript
throw new InternalServerErrorException("An unexpected error occurred");
```

---

## Custom Exceptions

### Creating Custom Exception

```typescript
export class PaymentFailedException extends HttpException {
  constructor(reason: string) {
    super(
      {
        message: "Payment processing failed",
        reason,
        timestamp: new Date().toISOString(),
      },
      402
    );
    this.name = "PaymentFailedException";
  }
}

// Usage
throw new PaymentFailedException("Insufficient funds");
```

### Domain-Specific Exceptions

```typescript
export class DuplicateEmailException extends ConflictException {
  constructor(email: string) {
    super({
      message: "Email already registered",
      email,
      code: "DUPLICATE_EMAIL",
    });
  }
}

export class InvalidPasswordException extends BadRequestException {
  constructor() {
    super({
      message:
        "Password must be at least 8 characters and contain uppercase, lowercase, and numbers",
      code: "INVALID_PASSWORD",
    });
  }
}

export class AccountLockedException extends ForbiddenException {
  constructor(unlockAt: Date) {
    super({
      message: "Account is locked",
      unlockAt: unlockAt.toISOString(),
      code: "ACCOUNT_LOCKED",
    });
  }
}
```

---

## Global Error Handler

### Creating Error Filter

```typescript
import { ExceptionFilter } from "../common/interfaces";

export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: Error, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    let status = 500;
    let message = "Internal server error";
    let errorResponse: any = { message };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse =
        typeof exceptionResponse === "string"
          ? { message: exceptionResponse }
          : exceptionResponse;
    } else {
      // Log unexpected errors
      console.error("Unexpected error:", exception);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorResponse,
    });
  }
}
```

### Using Error Filter

```typescript
const app = await FynixFactory.create(AppModule, {
  exceptionFilter: new GlobalExceptionFilter(),
});
```

---

## Best Practices

### 1. Use Appropriate Exception Types

```typescript
// Good - specific exception types
if (!user) {
  throw new NotFoundException("User not found");
}

if (user.email !== authUser.email) {
  throw new ForbiddenException("Cannot access other user data");
}

// Bad - generic exceptions
if (!user) {
  throw new HttpException("Error", 500);
}
```

### 2. Provide Meaningful Error Messages

```typescript
// Good - descriptive and actionable
throw new BadRequestException({
  message: "Validation failed",
  errors: {
    email: "Email must be a valid email address",
    age: "Age must be at least 18",
  },
});

// Bad - vague error
throw new BadRequestException("Invalid input");
```

### 3. Don't Expose Internal Details

```typescript
// Good - safe error message
try {
  await this.db.query("SELECT * FROM users");
} catch (error) {
  throw new InternalServerErrorException("Failed to fetch users");
}

// Bad - exposes implementation details
try {
  await this.db.query("SELECT * FROM users");
} catch (error) {
  throw new InternalServerErrorException(error.message); // Could expose SQL
}
```

### 4. Use Error Codes for Client Handling

```typescript
throw new UnauthorizedException({
  message: "Authentication failed",
  code: "INVALID_TOKEN",
  action: "Please log in again",
});

// Client can handle based on code
if (error.code === "INVALID_TOKEN") {
  redirectToLogin();
}
```

### 5. Validate Input Early

```typescript
@Post()
async createUser(@Body() data: CreateUserDto) {
  // Validate at the start
  if (!data.email) {
    throw new BadRequestException('Email is required');
  }

  if (!data.password || data.password.length < 8) {
    throw new BadRequestException('Password must be at least 8 characters');
  }

  // Continue with business logic
  return await this.userService.create(data);
}
```

---

## Examples

### Authentication Example

```typescript
@Injectable()
export class AuthService {
  async login(email: string, password: string): Promise<AuthToken> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValidPassword = await this.comparePasswords(
      password,
      user.password
    );

    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.isLocked) {
      throw new ForbiddenException({
        message: "Account is locked",
        code: "ACCOUNT_LOCKED",
        unlockAt: user.lockExpires,
      });
    }

    return this.generateToken(user);
  }
}
```

### Resource Management Example

```typescript
@Controller("/posts")
export class PostController {
  @Get("/:id")
  async getPost(@Param("id") id: number) {
    const post = await this.postService.findById(id);

    if (!post) {
      throw new NotFoundException({
        message: "Post not found",
        resourceType: "Post",
        resourceId: id,
      });
    }

    return post;
  }

  @Put("/:id")
  async updatePost(
    @Param("id") id: number,
    @Body() data: UpdatePostDto,
    @Req() req: Request
  ) {
    const post = await this.postService.findById(id);

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (post.authorId !== req.user.id) {
      throw new ForbiddenException("You can only edit your own posts");
    }

    return await this.postService.update(id, data);
  }

  @Delete("/:id")
  async deletePost(@Param("id") id: number, @Req() req: Request) {
    const post = await this.postService.findById(id);

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (post.authorId !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException("Insufficient permissions");
    }

    await this.postService.delete(id);

    return { message: "Post deleted successfully" };
  }
}
```

### Validation Example

```typescript
@Post('/register')
async register(@Body() data: RegisterDto) {
  // Email validation
  if (!data.email || !this.isValidEmail(data.email)) {
    throw new BadRequestException({
      message: 'Invalid email format',
      field: 'email'
    });
  }

  // Check for existing user
  const existing = await this.userService.findByEmail(data.email);
  if (existing) {
    throw new ConflictException({
      message: 'Email already registered',
      code: 'DUPLICATE_EMAIL'
    });
  }

  // Password strength
  if (data.password.length < 8) {
    throw new BadRequestException({
      message: 'Password must be at least 8 characters',
      field: 'password'
    });
  }

  // Age validation
  if (data.age < 18) {
    throw new UnprocessableEntityException({
      message: 'Must be at least 18 years old',
      field: 'age'
    });
  }

  return await this.userService.register(data);
}
```

---

## Related Documentation

- [Guards](./GUARDS_DECORATOR.md)
- [Interceptors](./INTERCEPTORS_DECORATOR.md)
- [Validation Pipes](./VALIDATION_PIPE.md)
- [Controllers](./CONTROLLER_DECORATOR.md)

---

**Last Updated**: December 4, 2025
