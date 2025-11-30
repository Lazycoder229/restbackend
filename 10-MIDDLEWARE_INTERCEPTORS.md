# Middleware & Interceptors Guide

Complete guide to using middleware, interceptors, and guards in RestJS.

## Table of Contents

1. [Overview](#overview)
2. [Guards](#guards)
3. [Interceptors](#interceptors)
4. [Built-in Guards](#built-in-guards)
5. [Built-in Interceptors](#built-in-interceptors)
6. [Custom Guards](#custom-guards)
7. [Custom Interceptors](#custom-interceptors)
8. [Execution Order](#execution-order)

---

## Overview

RestJS provides a powerful request/response processing pipeline:

```
Request → Guards → Interceptors (before) → Handler → Interceptors (after) → Response
```

### Key Concepts

- **Guards**: Control access (authentication, authorization)
- **Interceptors**: Transform requests/responses, add headers, logging
- **Execution Order**: Guards → Interceptors → Handler

---

## Guards

Guards determine if a request should be handled by the route handler.

### Basic Usage

```typescript
import { Controller, Get, UseGuards } from "restjs";
import { JwtAuthGuard } from "restjs/builtin";

@Controller("/protected")
export class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtectedData() {
    return { data: "This is protected" };
  }
}
```

### Guard Interface

```typescript
export interface RestGuard {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
```

---

## Interceptors

Interceptors can transform requests and responses.

### Basic Usage

```typescript
import { Controller, Get, UseInterceptors } from "restjs";
import { SecurityHeadersInterceptor } from "restjs/builtin";

@Controller("/secure")
export class SecureController {
  @Get()
  @UseInterceptors(SecurityHeadersInterceptor)
  getData() {
    return { data: "Secured with headers" };
  }
}
```

### Interceptor Interface

```typescript
export interface RestInterceptor {
  intercept(context: ExecutionContext, next: () => Promise<any>): Promise<any>;
}
```

---

## Built-in Guards

### JwtAuthGuard

Validates JWT tokens from Authorization header.

#### Usage

```typescript
import { UseGuards } from "restjs";
import { JwtAuthGuard } from "restjs/builtin";

@Controller("/api")
export class ApiController {
  @Get("/profile")
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    // req.user is populated by the guard
    return req.user;
  }
}
```

#### Configuration

Set `JWT_SECRET` in your `.env` file:

```env
JWT_SECRET=your-secret-key-here
```

#### Token Format

```
Authorization: Bearer <your-jwt-token>
```

#### Error Response

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Built-in Interceptors

### SecurityHeadersInterceptor

Adds security headers to all responses.

#### Usage

```typescript
import { UseInterceptors } from "restjs";
import { SecurityHeadersInterceptor } from "restjs/builtin";

@Controller("/api")
@UseInterceptors(SecurityHeadersInterceptor)
export class ApiController {
  @Get()
  getData() {
    return { data: "Protected with security headers" };
  }
}
```

#### Headers Added

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CorsInterceptor

Handles Cross-Origin Resource Sharing (CORS).

#### Usage

```typescript
import { UseInterceptors } from "restjs";
import { CorsInterceptor } from "restjs/builtin";

@Controller("/api")
@UseInterceptors(CorsInterceptor)
export class ApiController {
  @Get()
  getData() {
    return { data: "CORS enabled" };
  }
}
```

#### Headers Added

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization
```

### RateLimitInterceptor

Limits the number of requests per IP address.

#### Usage

```typescript
import { UseInterceptors } from "restjs";
import { RateLimitInterceptor } from "restjs/builtin";

@Controller("/api")
@UseInterceptors(RateLimitInterceptor)
export class ApiController {
  @Post("/login")
  login(@Body() credentials: any) {
    // Rate limited to prevent brute force
    return { token: "jwt-token" };
  }
}
```

#### Configuration

Default: 100 requests per 15 minutes per IP

#### Error Response

```json
{
  "statusCode": 429,
  "message": "Too many requests"
}
```

---

## Custom Guards

### Creating a Custom Guard

```typescript
import { Injectable } from "restjs";
import { RestGuard, ExecutionContext } from "restjs/common";

@Injectable()
export class AdminGuard implements RestGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check if user is admin
    return request.user?.role === "admin";
  }
}
```

### Using Custom Guard

```typescript
@Controller("/admin")
export class AdminController {
  @Get("/dashboard")
  @UseGuards(JwtAuthGuard, AdminGuard)
  getDashboard() {
    return { data: "Admin dashboard" };
  }
}
```

### Async Guard Example

```typescript
@Injectable()
export class ApiKeyGuard implements RestGuard {
  constructor(private securityService: SecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];

    if (!apiKey) {
      return false;
    }

    // Validate API key from database
    return await this.securityService.validateApiKey(apiKey);
  }
}
```

---

## Custom Interceptors

### Creating a Custom Interceptor

```typescript
import { Injectable } from "restjs";
import { RestInterceptor, ExecutionContext } from "restjs/common";

@Injectable()
export class LoggingInterceptor implements RestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: () => Promise<any>
  ): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    console.log(`→ ${request.method} ${request.url}`);

    // Execute handler
    const result = await next();

    const duration = Date.now() - start;
    console.log(`← ${request.method} ${request.url} - ${duration}ms`);

    return result;
  }
}
```

### Transform Response Example

```typescript
@Injectable()
export class TransformInterceptor implements RestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: () => Promise<any>
  ): Promise<any> {
    const result = await next();

    // Wrap all responses in a standard format
    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: result,
    };
  }
}
```

### Error Handling Example

```typescript
@Injectable()
export class ErrorInterceptor implements RestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: () => Promise<any>
  ): Promise<any> {
    try {
      return await next();
    } catch (error) {
      console.error("Error caught by interceptor:", error);

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
```

### Add Custom Headers Example

```typescript
@Injectable()
export class ApiVersionInterceptor implements RestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: () => Promise<any>
  ): Promise<any> {
    const response = context.switchToHttp().getResponse();

    response.setHeader("X-API-Version", "1.0.0");
    response.setHeader("X-Powered-By", "RestJS");

    return await next();
  }
}
```

---

## Execution Order

### Multiple Guards

Guards execute in the order they are declared:

```typescript
@Get()
@UseGuards(JwtAuthGuard, AdminGuard, ApiKeyGuard)
getData() {
  // All guards must pass
}
```

Execution: JwtAuthGuard → AdminGuard → ApiKeyGuard

If any guard returns `false`, request is rejected with 403.

### Multiple Interceptors

Interceptors create a chain:

```typescript
@Get()
@UseInterceptors(LoggingInterceptor, TransformInterceptor, CorsInterceptor)
getData() {
  return { data: 'test' };
}
```

Execution flow:

1. LoggingInterceptor (before)
2. TransformInterceptor (before)
3. CorsInterceptor (before)
4. Handler executes
5. CorsInterceptor (after)
6. TransformInterceptor (after)
7. LoggingInterceptor (after)

### Global Guards & Interceptors

Apply to all routes:

```typescript
const app = await RestFactory.create(AppModule);

// Global guards
app.useGlobalGuards(JwtAuthGuard);

// Global interceptors
app.useGlobalInterceptors(
  LoggingInterceptor,
  SecurityHeadersInterceptor,
  CorsInterceptor
);

await app.listen(3000);
```

### Controller-Level vs Route-Level

```typescript
@Controller("/api")
@UseGuards(JwtAuthGuard) // Applies to all routes
@UseInterceptors(LoggingInterceptor)
export class ApiController {
  @Get("/public")
  // Guard still applies - use specific guards to override
  getPublic() {
    return { data: "public" };
  }

  @Get("/admin")
  @UseGuards(AdminGuard) // Additional guard
  @UseInterceptors(TransformInterceptor) // Additional interceptor
  getAdmin() {
    return { data: "admin" };
  }
}
```

---

## Best Practices

### 1. Guard Composition

Create reusable guard combinations:

```typescript
const AuthenticatedAndAuthorized = [JwtAuthGuard, RoleGuard];

@Get('/protected')
@UseGuards(...AuthenticatedAndAuthorized)
getData() {
  return { data: 'protected' };
}
```

### 2. Interceptor Order Matters

Place transforming interceptors last:

```typescript
@UseInterceptors(
  LoggingInterceptor,      // 1. Log first
  SecurityHeadersInterceptor, // 2. Add headers
  TransformInterceptor     // 3. Transform last
)
```

### 3. Keep Guards Lightweight

Guards should be fast - avoid heavy database queries:

```typescript
// ❌ Bad - slow guard
@Injectable()
export class SlowGuard implements RestGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = await this.db.getUserPermissions(); // Slow!
    return permissions.includes("admin");
  }
}

// ✅ Good - cache or use JWT claims
@Injectable()
export class FastGuard implements RestGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return request.user.role === "admin"; // From JWT
  }
}
```

### 4. Error Handling in Interceptors

Always handle errors gracefully:

```typescript
@Injectable()
export class SafeInterceptor implements RestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: () => Promise<any>
  ): Promise<any> {
    try {
      const result = await next();
      return this.transform(result);
    } catch (error) {
      console.error("Interceptor error:", error);
      throw error; // Re-throw to let error handler deal with it
    }
  }
}
```

### 5. Dependency Injection

Use DI in guards and interceptors:

```typescript
@Injectable()
export class DatabaseGuard implements RestGuard {
  constructor(
    private securityService: SecurityService,
    private logger: Logger
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log("Checking access...");
    return await this.securityService.checkAccess(context);
  }
}
```

---

## Performance Considerations

### Fast Path Optimization

RestJS automatically optimizes routes without guards/interceptors:

```typescript
// Fastest - no guards/interceptors
@Get('/fast')
getData() {
  return { data: 'fast' };
}

// Slower - has guards/interceptors
@Get('/slow')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor)
getProtected() {
  return { data: 'protected' };
}
```

### Minimize Guard Count

Use single guard with multiple checks instead of many guards:

```typescript
// ❌ Multiple guards
@UseGuards(AuthGuard, RoleGuard, SubscriptionGuard, IpGuard)

// ✅ Single composite guard
@UseGuards(AccessGuard) // Checks all conditions
```

---

## Common Patterns

### Authentication + Authorization

```typescript
@Controller("/api")
@UseGuards(JwtAuthGuard) // All routes need auth
export class ApiController {
  @Get("/profile")
  getProfile(@Req() req: any) {
    return req.user;
  }

  @Delete("/users/:id")
  @UseGuards(AdminGuard) // Only admins
  deleteUser(@Param("id") id: string) {
    return { deleted: id };
  }
}
```

### Logging + Transformation

```typescript
@Controller("/api")
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class ApiController {
  @Get()
  getData() {
    // Returns: { success: true, timestamp: '...', data: {...} }
    return { name: "John" };
  }
}
```

### Rate Limiting Public Routes

```typescript
@Controller("/public")
@UseInterceptors(RateLimitInterceptor)
export class PublicController {
  @Post("/register")
  register(@Body() userData: any) {
    // Rate limited to prevent spam
    return { success: true };
  }
}
```

---

## Next Steps

- [Security Guide](05-SECURITY_GUIDE.md) - Detailed security practices
- [API Reference](02-API_REFERENCE.md) - Complete API documentation
- [Performance Guide](11-PERFORMANCE.md) - Optimization techniques
