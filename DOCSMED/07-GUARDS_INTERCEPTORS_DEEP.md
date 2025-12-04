# 07 - Guards & Interceptors Deep Dive

## 📋 Table of Contents

- [Understanding Guards](#understanding-guards)
- [Understanding Interceptors](#understanding-interceptors)
- [Execution Order](#execution-order)
- [Built-in Guards](#built-in-guards)
- [Built-in Interceptors](#built-in-interceptors)
- [Creating Custom Guards](#creating-custom-guards)
- [Creating Custom Interceptors](#creating-custom-interceptors)
- [Combining Guards and Interceptors](#combining-guards-and-interceptors)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)

---

## 🛡️ Understanding Guards

**Guards** determine whether a request should be handled by the route handler. They execute **before** the route handler and can prevent access.

### Guard Interface

```typescript
import { CanActivate, ExecutionContext } from "@fynixjs/fynix";

export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
```

### When to Use Guards

✅ Authentication (is user logged in?)  
✅ Authorization (does user have permission?)  
✅ Role checking  
✅ Feature flags  
✅ IP whitelisting

### Basic Guard Example

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@fynixjs/fynix";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    return true;
  }
}

// Usage
@Controller("/api/users")
export class UserController {
  @Get("/profile")
  @UseGuards(AuthGuard)
  getProfile() {
    return { message: "Protected route" };
  }
}
```

---

## 🔄 Understanding Interceptors

**Interceptors** can transform requests/responses, add extra logic before/after route handlers, and handle cross-cutting concerns.

### Interceptor Interface

```typescript
import {
  FynixInterceptor,
  ExecutionContext,
  CallHandler,
} from "@fynixjs/fynix";

export interface FynixInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Promise<any>;
}
```

### When to Use Interceptors

✅ Logging  
✅ Response transformation  
✅ Caching  
✅ Error handling  
✅ Performance monitoring  
✅ Adding headers

### Basic Interceptor Example

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

    console.log(`Before: ${request.method} ${request.url}`);

    const result = await next.handle();

    const duration = Date.now() - start;
    console.log(`After: ${request.method} ${request.url} - ${duration}ms`);

    return result;
  }
}

// Usage
@Controller("/api")
@UseInterceptors(LoggingInterceptor)
export class ApiController {}
```

---

## 🔄 Execution Order

Understanding the complete request lifecycle:

```
┌─────────────────────────────────────────┐
│      1. Incoming HTTP Request           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   2. Global Interceptors (before)       │
│      - Logging, CORS, etc.              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   3. Controller Interceptors (before)   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   4. Route Interceptors (before)        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   5. Controller-Level Guards            │
│      - Authentication, etc.             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   6. Route-Level Guards                 │
│      - Role check, etc.                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   7. Pipes (Validation/Transform)       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   8. Route Handler (Controller Method)  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   9. Route Interceptors (after)         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   10. Controller Interceptors (after)   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   11. Global Interceptors (after)       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   12. Exception Filter (if error)       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      13. HTTP Response Sent             │
└─────────────────────────────────────────┘
```

### Example Demonstrating Order

```typescript
// main.ts
const app = await FynixFactory.create(AppModule);
app.useGlobalInterceptors(new GlobalInterceptor()); // Step 2 & 11

@Controller("/api")
@UseGuards(ControllerGuard) // Step 5
@UseInterceptors(ControllerInterceptor) // Step 3 & 10
export class ApiController {
  @Get("/data")
  @UseGuards(RouteGuard) // Step 6
  @UseInterceptors(RouteInterceptor) // Step 4 & 9
  getData() {
    // Step 8
    return { data: "example" };
  }
}
```

---

## 🏭 Built-in Guards

### JwtAuthGuard

```typescript
import { JwtAuthGuard } from "@fynixjs/fynix";

@Controller("/api/users")
export class UserController {
  @Get("/profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    // req.user contains decoded JWT payload
    return { user: req.user };
  }
}
```

### ApiKeyGuard

```typescript
import { ApiKeyGuard } from "@fynixjs/fynix";

@Controller("/api/external")
@UseGuards(ApiKeyGuard)
export class ExternalApiController {
  @Get("/data")
  getData() {
    return { data: "Protected by API key" };
  }
}
```

---

## 🏭 Built-in Interceptors

### CorsInterceptor

```typescript
import { CorsInterceptor } from "@fynixjs/fynix";

const app = await FynixFactory.create(AppModule);
app.useGlobalInterceptors(
  new CorsInterceptor({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

### SecurityHeadersInterceptor

```typescript
import { SecurityHeadersInterceptor } from "@fynixjs/fynix";

app.useGlobalInterceptors(new SecurityHeadersInterceptor());

// Adds:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
// - Strict-Transport-Security
```

### RateLimitInterceptor

```typescript
import { RateLimitInterceptor } from "@fynixjs/fynix";

@Controller("/auth")
export class AuthController {
  @Post("/login")
  @UseInterceptors(
    new RateLimitInterceptor({
      maxRequests: 5,
      windowMs: 60000, // 5 requests per minute
    })
  )
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body);
  }
}
```

### CompressionInterceptor

```typescript
import { CompressionInterceptor } from "@fynixjs/fynix";

app.useGlobalInterceptors(
  new CompressionInterceptor({
    threshold: 1024, // Compress responses > 1KB
  })
);
```

### StaticFilesInterceptor

```typescript
import { StaticFilesInterceptor } from "@fynixjs/fynix";

app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    rootDir: "public",
    prefix: "/static",
    maxAge: 86400, // Cache for 1 day
  })
);
```

---

## 🎨 Creating Custom Guards

### Role-Based Guard

```typescript
export class RolesGuard implements CanActivate {
  constructor(private allowedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("User not authenticated");
    }

    if (!this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}

// Usage
@Controller("/admin")
export class AdminController {
  @Get("/users")
  @UseGuards(JwtAuthGuard, new RolesGuard(["admin", "moderator"]))
  getAllUsers() {
    return { users: [] };
  }
}
```

### Permission-Based Guard

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private required: string[]) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    // Fetch user permissions from database
    const userPermissions = await this.getUserPermissions(user.id);

    const hasAllPermissions = this.required.every(perm =>
      userPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Missing required permissions');
    }

    return true;
  }

  private async getUserPermissions(userId: number): Promise<string[]> {
    // Query database for user permissions
    return ['posts:read', 'posts:write', 'users:read'];
  }
}

// Usage
@Post('/posts')
@UseGuards(JwtAuthGuard, new PermissionsGuard(['posts:write']))
async createPost(@Body() dto: CreatePostDto) {
  return await this.postService.create(dto);
}
```

### IP Whitelist Guard

```typescript
@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private allowedIps = ["127.0.0.1", "::1", "192.168.1.0/24"];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const clientIp = request.ip || request.connection.remoteAddress;

    if (!this.isIpAllowed(clientIp)) {
      throw new ForbiddenException("IP not allowed");
    }

    return true;
  }

  private isIpAllowed(ip: string): boolean {
    return this.allowedIps.some((allowedIp) => {
      // Simple check (production should use proper IP matching)
      return ip === allowedIp || ip.startsWith(allowedIp.split("/")[0]);
    });
  }
}
```

### Ownership Guard

```typescript
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private resource: string, // 'post', 'comment', etc.
    private resourceService: any
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    const resource = await this.resourceService.findById(resourceId);

    if (!resource) {
      throw new NotFoundException(`${this.resource} not found`);
    }

    if (resource.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You do not own this resource');
    }

    return true;
  }
}

// Usage
@Delete('/posts/:id')
@UseGuards(JwtAuthGuard, new OwnershipGuard('post', postService))
async deletePost(@Param('id') id: string) {
  return await this.postService.delete(Number(id));
}
```

---

## 🎨 Creating Custom Interceptors

### Response Transform Interceptor

```typescript
@Injectable()
export class ResponseTransformInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const result = await next.handle();

    // Wrap all responses in standard format
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}

// Before: { id: 1, name: "John" }
// After: { success: true, data: { id: 1, name: "John" }, timestamp: "2025-12-04T..." }
```

### Caching Interceptor

```typescript
@Injectable()
export class CacheInterceptor implements FynixInterceptor {
  private cache = new Map<string, { data: any; expiresAt: number }>();

  constructor(private ttl: number = 60000) {} // Default 1 minute

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = `${request.method}:${request.url}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      console.log('Cache hit:', cacheKey);
      return cached.data;
    }

    // Execute handler
    const result = await next.handle();

    // Store in cache
    this.cache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + this.ttl
    });

    return result;
  }
}

// Usage
@Get('/products')
@UseInterceptors(new CacheInterceptor(300000)) // Cache for 5 minutes
async getProducts() {
  return await this.productService.findAll();
}
```

### Performance Monitoring Interceptor

```typescript
@Injectable()
export class PerformanceInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = Date.now();

    try {
      const result = await next.handle();
      const duration = Date.now() - start;

      // Add performance header
      response.setHeader("X-Response-Time", `${duration}ms`);

      // Log slow requests
      if (duration > 1000) {
        console.warn(
          `Slow request: ${request.method} ${request.url} - ${duration}ms`
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(
        `Error in ${request.method} ${request.url} after ${duration}ms`,
        error
      );
      throw error;
    }
  }
}
```

### Error Handling Interceptor

```typescript
@Injectable()
export class ErrorHandlingInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    try {
      return await next.handle();
    } catch (error) {
      const request = context.switchToHttp().getRequest();

      // Log error with context
      console.error("Error:", {
        url: request.url,
        method: request.method,
        user: request.user?.id,
        error: error.message,
        stack: error.stack,
      });

      // Transform error for client
      if (error.name === "ValidationError") {
        throw new BadRequestException({
          message: "Validation failed",
          errors: error.details,
        });
      }

      throw error;
    }
  }
}
```

### Request/Response Logger

```typescript
@Injectable()
export class RequestLoggerInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    console.log("→ Request:", {
      method: request.method,
      url: request.url,
      body: request.body,
      user: request.user?.email,
    });

    const result = await next.handle();
    const duration = Date.now() - start;

    console.log("← Response:", {
      method: request.method,
      url: request.url,
      duration: `${duration}ms`,
      statusCode: 200,
    });

    return result;
  }
}
```

---

## 🔗 Combining Guards and Interceptors

### Complete Protected Route

```typescript
@Controller("/api/admin")
@UseGuards(JwtAuthGuard, new RolesGuard(["admin"]))
@UseInterceptors(LoggingInterceptor, PerformanceInterceptor)
export class AdminController {
  @Get("/users")
  @UseInterceptors(new CacheInterceptor(60000))
  async getAllUsers() {
    return await this.userService.findAll();
  }

  @Post("/users")
  @UseGuards(new PermissionsGuard(["users:create"]))
  @UseInterceptors(ResponseTransformInterceptor)
  async createUser(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }
}
```

### Global + Route Level

```typescript
// main.ts - Global level
const app = await FynixFactory.create(AppModule);

app.useGlobalInterceptors(
  new SecurityHeadersInterceptor(),
  new CompressionInterceptor(),
  new RequestLoggerInterceptor()
);

// Controller - Route level
@Controller("/api/posts")
export class PostController {
  @Get()
  @UseInterceptors(new CacheInterceptor(300000))
  async findAll() {
    return await this.postService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, new RolesGuard(["user"]))
  @UseInterceptors(ResponseTransformInterceptor)
  async create(@Body() dto: CreatePostDto) {
    return await this.postService.create(dto);
  }
}
```

---

## 🎯 Advanced Patterns

### Conditional Guard

```typescript
export class ConditionalGuard implements CanActivate {
  constructor(
    private condition: (context: ExecutionContext) => boolean,
    private guard: CanActivate
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    if (this.condition(context)) {
      return this.guard.canActivate(context);
    }
    return true;
  }
}

// Usage - Only require auth for non-GET requests
@Controller("/api/posts")
export class PostController {
  @Get()
  @UseGuards(
    new ConditionalGuard(
      (ctx) => ctx.switchToHttp().getRequest().method !== "GET",
      new JwtAuthGuard()
    )
  )
  async findAll() {}
}
```

### Composable Guards

```typescript
export class CompositeGuard implements CanActivate {
  constructor(private guards: CanActivate[]) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    for (const guard of this.guards) {
      const result = await Promise.resolve(guard.canActivate(context));
      if (!result) return false;
    }
    return true;
  }
}

// Usage
@UseGuards(
  new CompositeGuard([
    new JwtAuthGuard(),
    new RolesGuard(['admin']),
    new IpWhitelistGuard()
  ])
)
```

### Interceptor Chain

```typescript
export class InterceptorChain implements FynixInterceptor {
  constructor(private interceptors: FynixInterceptor[]) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    let handler = next;

    // Build chain in reverse order
    for (let i = this.interceptors.length - 1; i >= 0; i--) {
      const currentHandler = handler;
      const interceptor = this.interceptors[i];

      handler = {
        handle: () => interceptor.intercept(context, currentHandler),
      };
    }

    return await handler.handle();
  }
}
```

---

## ✅ Best Practices

### 1. Keep Guards Simple

```typescript
// ✅ Good - single responsibility
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return !!context.switchToHttp().getRequest().user;
  }
}

// ❌ Bad - too much logic
@Injectable()
export class MegaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Checks auth, roles, permissions, IP, rate limits...
    // Too many responsibilities!
  }
}
```

### 2. Use Interceptors for Cross-Cutting Concerns

```typescript
// ✅ Good
- Logging
- Caching
- Response transformation
- Performance monitoring
- Error handling

// ❌ Bad
- Business logic
- Database operations
- Complex validations
```

### 3. Order Matters

```typescript
// ✅ Good - correct order
@UseGuards(AuthGuard, RoleGuard)  // First auth, then role

// ❌ Bad - wrong order
@UseGuards(RoleGuard, AuthGuard)  // Role before auth
```

### 4. Throw Specific Exceptions

```typescript
// ✅ Good
if (!user) {
  throw new UnauthorizedException("User not authenticated");
}

if (!hasPermission) {
  throw new ForbiddenException("Insufficient permissions");
}

// ❌ Bad
if (!user) {
  return false; // Unclear why it failed
}
```

---

## 🎯 Real-World Examples

### Complete Authentication Flow

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

// guards/roles.guard.ts
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

// controller
@Controller("/api/admin")
@UseGuards(JwtAuthGuard, new RolesGuard(["admin"]))
@UseInterceptors(
  LoggingInterceptor,
  ResponseTransformInterceptor,
  new CacheInterceptor(60000)
)
export class AdminController {
  @Get("/users")
  async getAllUsers() {
    return await this.userService.findAll();
  }

  @Delete("/users/:id")
  @UseInterceptors(
    new RateLimitInterceptor({ maxRequests: 10, windowMs: 60000 })
  )
  async deleteUser(@Param("id") id: string) {
    return await this.userService.delete(Number(id));
  }
}
```

---

## 📚 Next Steps

- **[08-VALIDATION_PIPES.md](./08-VALIDATION_PIPES.md)** - Input validation
- **[09-ERROR_HANDLING.md](./09-ERROR_HANDLING.md)** - Exception handling
- **[13-BEST_PRACTICES.md](./13-BEST_PRACTICES.md)** - Guard/interceptor patterns

---

## 💡 Key Takeaways

✅ Guards control access to routes  
✅ Interceptors transform requests/responses  
✅ Execution order matters  
✅ Keep guards simple and focused  
✅ Use interceptors for cross-cutting concerns  
✅ Combine multiple guards for complex auth  
✅ Global interceptors apply to all routes  
✅ Throw specific exceptions from guards

---

**Master Guards & Interceptors** to build secure, maintainable APIs!
