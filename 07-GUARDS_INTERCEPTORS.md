# Guards & Interceptors

Guards and interceptors are powerful features that allow you to add cross-cutting concerns to your application, just like in NestJS.

---

## 📋 Table of Contents

- [Guards](#guards)
- [Interceptors](#interceptors)
- [Built-in Features](#built-in-features)
- [Execution Order](#execution-order)
- [Best Practices](#best-practices)

---

## 🛡️ Guards

Guards determine whether a request should be handled or rejected. They're executed **before** the route handler.

### Creating a Guard

All guards must implement the `CanActivate` interface:

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@fynixjs/fynix";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    return true;
  }
}
```

### Using Guards

#### On a Single Route

```typescript
@Controller("/users")
export class UserController {
  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return { users: [] };
  }
}
```

#### On Entire Controller

```typescript
@Controller("/admin")
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  // All routes require authentication and admin role

  @Get("/users")
  getAllUsers() {
    return { users: [] };
  }

  @Delete("/users/:id")
  deleteUser(@Param("id") id: string) {
    return { message: "User deleted" };
  }
}
```

#### Multiple Guards

Guards are executed in the order they're listed:

```typescript
@Get("/sensitive-data")
@UseGuards(JwtAuthGuard, RoleGuard, PermissionGuard)
getSensitiveData() {
  // JwtAuthGuard runs first
  // Then RoleGuard
  // Finally PermissionGuard
  return { data: "secret" };
}
```

### Guard Examples

#### JWT Authentication Guard

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SecurityService,
} from "@fynixjs/fynix";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private security: SecurityService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("No token provided");
    }

    const token = authHeader.substring(7);

    try {
      const decoded = this.security.verifyToken(token);
      request.user = decoded; // Attach user to request
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
```

#### Role-Based Guard

```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private requiredRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("User not authenticated");
    }

    if (!this.requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}

// Usage
@Get("/admin-only")
@UseGuards(JwtAuthGuard, new RoleGuard(["admin"]))
getAdminData() {
  return { data: "admin data" };
}
```

#### Custom Permission Guard

```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private requiredPermission: string) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    // Check permissions from database
    const hasPermission = await this.checkUserPermission(
      user.id,
      this.requiredPermission
    );

    if (!hasPermission) {
      throw new ForbiddenException("Permission denied");
    }

    return true;
  }

  private async checkUserPermission(
    userId: number,
    permission: string
  ): Promise<boolean> {
    // Query database for user permissions
    // Return true if user has permission
    return true;
  }
}
```

---

## 🔄 Interceptors

Interceptors can transform the result returned from a function, bind extra logic before/after method execution, or extend behavior.

### Creating an Interceptor

All interceptors must implement the `FynixInterceptor` interface:

```typescript
import {
  Injectable,
  FynixInterceptor,
  ExecutionContext,
  CallHandler,
} from "@fynixjs/fynix";

@Injectable()
export class LoggingInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    console.log(`[${request.method}] ${request.url} - Start`);

    // Call the route handler
    const result = await next.handle();

    const duration = Date.now() - start;
    console.log(
      `[${request.method}] ${request.url} - Completed in ${duration}ms`
    );

    return result;
  }
}
```

### Using Interceptors

#### On a Single Route

```typescript
@Controller("/users")
export class UserController {
  @Get()
  @UseInterceptors(LoggingInterceptor)
  findAll() {
    return { users: [] };
  }
}
```

#### On Entire Controller

```typescript
@Controller("/api")
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class ApiController {
  // All routes use these interceptors
}
```

#### Globally

```typescript
// main.ts
const app = await FynixFactory.create(AppModule);
await app.init();

app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

await app.listen(3000);
```

### Interceptor Examples

#### Response Transformation

```typescript
@Injectable()
export class TransformInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const result = await next.handle();

    // Wrap response in standard format
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}

// Before: { users: [] }
// After: { success: true, data: { users: [] }, timestamp: "2025-12-03T..." }
```

#### Error Handling

```typescript
@Injectable()
export class ErrorInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    try {
      return await next.handle();
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

#### Caching

```typescript
@Injectable()
export class CacheInterceptor implements FynixInterceptor {
  private cache = new Map<string, any>();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = `${request.method}:${request.url}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      console.log("Returning cached result");
      return this.cache.get(cacheKey);
    }

    // Execute handler
    const result = await next.handle();

    // Store in cache
    this.cache.set(cacheKey, result);

    // Clear cache after 60 seconds
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, 60000);

    return result;
  }
}
```

#### Request Timing

```typescript
@Injectable()
export class TimingInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    const result = await next.handle();

    const duration = Date.now() - start;

    // Add timing header to response
    const response = context.switchToHttp().getResponse();
    response.setHeader("X-Response-Time", `${duration}ms`);

    return result;
  }
}
```

---

## 🏭 Built-in Features

FynixJS includes several built-in guards and interceptors:

### CORS Interceptor

```typescript
import { CorsInterceptor } from "@fynixjs/fynix";

@Controller("/api")
@UseInterceptors(
  new CorsInterceptor({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)
export class ApiController {}
```

### Security Headers Interceptor

```typescript
import { SecurityHeadersInterceptor } from "@fynixjs/fynix";

// Adds security headers like X-Frame-Options, X-Content-Type-Options, etc.
@Controller("/api")
@UseInterceptors(new SecurityHeadersInterceptor())
export class ApiController {}
```

### Rate Limiting Interceptor

```typescript
import { RateLimitInterceptor } from "@fynixjs/fynix";

@Controller("/auth")
@UseInterceptors(
  new RateLimitInterceptor({
    maxRequests: 5,
    windowMs: 60000, // 5 requests per minute
  })
)
export class AuthController {
  @Post("/login")
  login() {
    // Protected by rate limiting
  }
}
```

### Logging Interceptor

```typescript
import { LoggingInterceptor } from "@fynixjs/fynix";

@Controller("/api")
@UseInterceptors(new LoggingInterceptor())
export class ApiController {}
```

---

## 🔄 Execution Order

Understanding the order of execution:

```
1. Incoming Request
   ↓
2. Global Interceptors (before)
   ↓
3. Controller-level Interceptors (before)
   ↓
4. Route-level Interceptors (before)
   ↓
5. Controller-level Guards
   ↓
6. Route-level Guards
   ↓
7. Route Handler (Controller Method)
   ↓
8. Route-level Interceptors (after)
   ↓
9. Controller-level Interceptors (after)
   ↓
10. Global Interceptors (after)
    ↓
11. Response Sent
```

### Example

```typescript
// Global interceptor
app.useGlobalInterceptors(new GlobalInterceptor());

@Controller("/users")
@UseGuards(ControllerGuard)
@UseInterceptors(ControllerInterceptor)
export class UserController {
  @Get()
  @UseGuards(RouteGuard)
  @UseInterceptors(RouteInterceptor)
  findAll() {
    return { users: [] };
  }
}

// Execution order:
// 1. GlobalInterceptor (before)
// 2. ControllerInterceptor (before)
// 3. RouteInterceptor (before)
// 4. ControllerGuard
// 5. RouteGuard
// 6. findAll() method
// 7. RouteInterceptor (after)
// 8. ControllerInterceptor (after)
// 9. GlobalInterceptor (after)
```

---

## ✅ Best Practices

### 1. Keep Guards Simple

```typescript
// ✅ Good - single responsibility
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Only check if user is authenticated
    return !!context.switchToHttp().getRequest().user;
  }
}

// ❌ Bad - doing too much
@Injectable()
export class MegaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Checking auth, roles, permissions, rate limits...
    // Too many responsibilities!
  }
}
```

### 2. Use Interceptors for Cross-Cutting Concerns

```typescript
// ✅ Good use cases for interceptors:
- Logging
- Response transformation
- Error handling
- Caching
- Performance monitoring

// ❌ Bad use cases:
- Business logic
- Database operations
- Complex validations
```

### 3. Order Matters

```typescript
// ✅ Good - correct order
@UseGuards(AuthGuard, RoleGuard)
// First authenticate, then check role

// ❌ Bad - wrong order
@UseGuards(RoleGuard, AuthGuard)
// Checking role before authentication
```

### 4. Use Class References for DI or Instances for Configuration

```typescript
// ✅ Good - class reference with DI
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private security: SecurityService) {}
}

// Register as provider if using class reference
@Module({
  providers: [JwtAuthGuard, SecurityService],
  controllers: [UserController],
})

// In controller - class reference (gets DI)
@UseGuards(JwtAuthGuard)

// ✅ Also good - instantiate with config
@UseInterceptors(new RateLimitInterceptor({ maxRequests: 100 }))
```

### 5. Handle Errors Properly

```typescript
@Injectable()
export class SafeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    try {
      // Guard logic
      return true;
    } catch (error) {
      // Always throw appropriate HTTP exceptions
      throw new ForbiddenException("Access denied");
    }
  }
}
```

---

## 🎯 Real-World Example

Complete authentication and authorization setup:

```typescript
// guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private security: SecurityService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const decoded = this.security.verifyToken(token);
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}

// guards/roles.guard.ts - Use instance pattern for configuration
export class RolesGuard implements CanActivate {
  constructor(private allowedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}

// interceptors/response-transform.interceptor.ts
@Injectable()
export class ResponseTransformInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const result = await next.handle();

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}

// admin.module.ts - Register providers
@Module({
  providers: [JwtAuthGuard, ResponseTransformInterceptor, SecurityService],
  controllers: [AdminController],
})
export class AdminModule {}

// admin.controller.ts
@Controller("/admin")
@UseGuards(JwtAuthGuard, new RolesGuard(["admin"])) // Class ref + instance
@UseInterceptors(ResponseTransformInterceptor) // Class ref uses DI
export class AdminController {
  @Get("/users")
  getAllUsers() {
    return { users: [] };
  }

  @Delete("/users/:id")
  @UseInterceptors(
    new RateLimitInterceptor({ maxRequests: 10, windowMs: 60000 })
  )
  deleteUser(@Param("id") id: string) {
    return { message: "User deleted" };
  }
}
```

---

## 📚 Next Steps

- [Decorators Reference](./08-DECORATORS.md)
- [API Reference](./09-API_REFERENCE.md)
- [Examples](./10-EXAMPLES.md)

---

**Use guards and interceptors to build robust, secure applications with FynixJS!**
