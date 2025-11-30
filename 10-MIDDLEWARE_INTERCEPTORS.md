# 🛡️ Guards & Interceptors Guide

**Master the request/response pipeline to build secure, powerful APIs.**

> Learn how to protect routes, transform data, add headers, log requests, and create custom middleware - all with clean, decorator-based syntax.

---

## 📑 Table of Contents

<details open>
<summary><strong>Pipeline Topics</strong></summary>

### Fundamentals
- [Understanding the Pipeline](#overview) - How it works
- [Guards vs Interceptors](#guards-vs-interceptors) - When to use each
- [Execution Order](#execution-order) - Request flow
- [Scope](#scope) - Global, controller, method level

### Guards
- [What are Guards?](#guards) - Authentication & authorization
- [Built-in Guards](#built-in-guards) - JwtAuthGuard, etc.
- [Custom Guards](#custom-guards) - Create your own
- [Guard Examples](#guard-examples) - Real-world use cases

### Interceptors
- [What are Interceptors?](#interceptors) - Transform & enhance
- [Built-in Interceptors](#built-in-interceptors) - CORS, Security, etc.
- [Custom Interceptors](#custom-interceptors) - Build custom logic
- [Interceptor Patterns](#interceptor-patterns) - Common patterns

### Advanced
- [Combining Multiple](#combining-guards-and-interceptors) - Use together
- [Error Handling](#error-handling) - Handle failures
- [Performance Impact](#performance-impact) - Optimization tips
- [Testing](#testing) - Unit test guards/interceptors

</details>

---

## 🎯 Overview

<details open>
<summary><strong>Understanding the Request Pipeline</strong></summary>

RestJS processes every request through a **powerful, flexible pipeline**:

### Visual Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       ↓
┌─────────────────────┐
│   🛡️ Guards        │  ← Authentication, Authorization
│   Can I access?    │     Returns: true (allow) or false (deny)
└──────┬──────────────┘
       ↓ (if allowed)
┌─────────────────────┐
│   🔄 Interceptors   │  ← Transform request, add headers
│   (Before)          │     Modify incoming data
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│   🎯 Route Handler  │  ← Your controller method
│   (Your code)       │     Business logic executes
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│   🔄 Interceptors   │  ← Transform response, add headers
│   (After)           │     Modify outgoing data
└──────┬──────────────┘
       ↓
┌─────────────┐
│   Response  │
└─────────────┘
```

### Real-World Example

```typescript
@Controller('/api/users')
export class UsersController {
  
  @Get('/:id')
  @UseGuards(JwtAuthGuard)           // 1. Check JWT token
  @UseInterceptors(                   
    LoggingInterceptor,               // 2. Log request
    CacheInterceptor                  // 3. Check cache
  )
  async getUser(@Param('id') id: string) {
    return await this.userService.findById(id);  // 4. Execute
  }
  // 5. CacheInterceptor stores response
  // 6. LoggingInterceptor logs response
  // 7. Return to client
}
```

**What happens:**
1. ✅ `JwtAuthGuard` validates JWT token → Allow/Deny
2. ✅ `LoggingInterceptor` logs: "GET /api/users/123 started"
3. ✅ `CacheInterceptor` checks if response cached → return if found
4. ✅ `getUser()` executes your business logic
5. ✅ `CacheInterceptor` caches the response for next time
6. ✅ `LoggingInterceptor` logs: "GET /api/users/123 completed (42ms)"
7. ✅ Response sent to client

</details>

<details>
<summary><strong>🆚 Guards vs Interceptors - When to use what?</strong></summary>

| Feature | Guards | Interceptors |
|---------|--------|--------------|
| **Purpose** | Access control | Data transformation |
| **Returns** | `boolean` (allow/deny) | Modified request/response |
| **Timing** | Before everything | Before & after handler |
| **Can modify response?** | No (only allow/deny) | Yes |
| **Can modify request?** | No | Yes |
| **Stops execution?** | Yes (if false) | No (unless throws) |
| **Use for** | Auth, permissions | Logging, caching, headers |

**Use Guards when:**
- ✅ Checking authentication (is user logged in?)
- ✅ Checking authorization (can user do this?)
- ✅ Validating API keys
- ✅ IP whitelisting
- ✅ Feature flags

**Use Interceptors when:**
- ✅ Logging requests/responses
- ✅ Transforming data format
- ✅ Adding headers (CORS, security)
- ✅ Caching responses
- ✅ Measuring performance
- ✅ Rate limiting

**Example comparison:**

```typescript
// ✅ Good - Guard for access control
@UseGuards(AdminGuard)  // Only admins can access
@Delete('/users/:id')
deleteUser() {}

// ✅ Good - Interceptor for transformation
@UseInterceptors(TransformInterceptor)  // Format response
@Get('/users')
getUsers() {}

// ❌ Bad - Don't use interceptor for auth
@UseInterceptors(AuthInterceptor)  // Wrong tool!
@Get('/protected')
getData() {}

// ❌ Bad - Don't use guard for transformation
@UseGuards(TransformGuard)  // Guards can't transform!
@Get('/users')
getUsers() {}
```

</details>

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
