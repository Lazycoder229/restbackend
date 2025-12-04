# Interceptors Decorator Documentation

## Overview

The Interceptors Decorator enables you to intercept and transform HTTP requests and responses in the Fynix framework. Interceptors are powerful tools for implementing cross-cutting concerns like logging, transformation, caching, error handling, and performance monitoring.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Creating Interceptors](#creating-interceptors)
- [Usage Examples](#usage-examples)
- [Execution Order](#execution-order)
- [Best Practices](#best-practices)
- [Common Use Cases](#common-use-cases)
- [Advanced Patterns](#advanced-patterns)
- [Troubleshooting](#troubleshooting)

---

## Installation & Setup

```typescript
import "reflect-metadata";
import { UseInterceptors } from "./decorators/interceptors.decorator";
```

---

## Basic Usage

Apply interceptors at the method or class level:

```typescript
@Controller("/api/users")
@UseInterceptors(LoggingInterceptor)
export class UserController {
  @Get("/")
  listUsers() {
    return { users: [] };
  }

  @Get("/:id")
  @UseInterceptors(CacheInterceptor) // Additional interceptor
  getUserById(@Param("id") id: string) {
    return { user: { id } };
  }
}
```

---

## API Reference

### @UseInterceptors

**Signature:**

```typescript
@UseInterceptors(...interceptors: any[]): MethodDecorator & ClassDecorator
```

**Parameters:**

- `...interceptors` - One or more interceptor classes

**Returns:** Combined method and class decorator

**Metadata Key:** `INTERCEPTORS_METADATA`

**Scope:**

- **Class-level**: Applies to all routes in the controller
- **Method-level**: Applies only to the specific route

**Example:**

```typescript
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
```

---

## Creating Interceptors

Interceptors implement an `intercept` method that wraps the route handler:

```typescript
import { Injectable } from "./decorators/injectable.decorator";

@Injectable()
export class LoggingInterceptor {
  async intercept(context: any, next: () => Promise<any>): Promise<any> {
    const start = Date.now();
    const { method, url } = context.request;

    console.log(`[REQUEST] ${method} ${url}`);

    try {
      const result = await next();
      const duration = Date.now() - start;
      console.log(`[RESPONSE] ${method} ${url} - ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[ERROR] ${method} ${url} - ${duration}ms`);
      throw error;
    }
  }
}
```

---

## Usage Examples

### Logging Interceptor

```typescript
@Injectable()
export class LoggingInterceptor {
  async intercept(context: any, next: () => Promise<any>): Promise<any> {
    const { method, url, headers } = context.request;
    const start = Date.now();

    console.log(`→ ${method} ${url}`);
    console.log(`  User-Agent: ${headers["user-agent"]}`);

    try {
      const result = await next();
      const duration = Date.now() - start;
      const statusCode = context.response?.statusCode || 200;

      console.log(`← ${method} ${url} [${statusCode}] ${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`✗ ${method} ${url} [ERROR] ${duration}ms`, error);
      throw error;
    }
  }
}

// Usage
@Controller("/api/users")
@UseInterceptors(LoggingInterceptor)
export class UserController {
  @Get("/")
  listUsers() {
    return { users: [] };
  }
}
```

### Transform Interceptor

```typescript
@Injectable()
export class TransformInterceptor {
  async intercept(context: any, next: () => Promise<any>): Promise<any> {
    const result = await next();

    // Wrap response in standard format
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}

// Usage
@Controller("/api/products")
@UseInterceptors(TransformInterceptor)
export class ProductController {
  @Get("/")
  listProducts() {
    return [{ id: 1, name: "Product 1" }];
  }
}

// Response:
// {
//   "success": true,
//   "data": [{ "id": 1, "name": "Product 1" }],
//   "timestamp": "2025-12-04T10:00:00.000Z"
// }
```

### Cache Interceptor

```typescript
@Injectable()
export class CacheInterceptor {
  private cache = new Map<string, { data: any; expires: number }>();

  async intercept(context: any, next: () => Promise<any>): Promise<any> {
    const { method, url } = context.request;

    // Only cache GET requests
    if (method !== "GET") {
      return next();
    }

    const cacheKey = url;
    const cached = this.cache.get(cacheKey);

    // Return cached response if valid
    if (cached && cached.expires > Date.now()) {
      console.log(`[CACHE HIT] ${url}`);
      return cached.data;
    }

    // Execute request and cache result
    const result = await next();

    this.cache.set(cacheKey, {
      data: result,
      expires: Date.now() + 60000, // 1 minute
    });

    console.log(`[CACHE MISS] ${url}`);
    return result;
  }
}

// Usage
@Controller("/api/posts")
export class PostController {
  @Get("/:id")
  @UseInterceptors(CacheInterceptor)
  getPost(@Param("id") id: string) {
    // This will be cached for 1 minute
    return { id, title: "Post Title" };
  }
}
```

### Error Handling Interceptor

```typescript
@Injectable()
export class ErrorInterceptor {
  async intercept(context: any, next: () => Promise<any>): Promise<any> {
    try {
      return await next();
    } catch (error: any) {
      // Transform error into standard format
      return {
        success: false,
        error: {
          message: error.message || "Internal server error",
          code: error.code || "INTERNAL_ERROR",
          statusCode: error.statusCode || 500,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Usage
@Controller("/api/users")
@UseInterceptors(ErrorInterceptor)
export class UserController {
  @Get("/:id")
  getUser(@Param("id") id: string) {
    if (id === "0") {
      throw new Error("Invalid user ID");
    }
    return { id, name: "John" };
  }
}
```

### Timeout Interceptor

```typescript
@Injectable()
export class TimeoutInterceptor {
  private timeout = 5000; // 5 seconds

  async intercept(context: any, next: () => Promise<any>): Promise<any> {
    return Promise.race([
      next(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout"));
        }, this.timeout);
      }),
    ]);
  }
}

// Usage
@Controller("/api/slow")
@UseInterceptors(TimeoutInterceptor)
export class SlowController {
  @Get("/data")
  async getData() {
    // Will timeout if this takes more than 5 seconds
    await this.longRunningOperation();
    return { data: "result" };
  }
}
```

### Response Header Interceptor

```typescript
@Injectable()
export class HeaderInterceptor {
  async intercept(context: any, next: () => Promise<any>): Promise<any> {
    const result = await next();

    // Add custom headers
    context.response.setHeader("X-Powered-By", "Fynix Framework");
    context.response.setHeader("X-Request-Id", Math.random().toString(36));
    context.response.setHeader("X-Response-Time", Date.now().toString());

    return result;
  }
}

// Usage
@Controller("/api/data")
@UseInterceptors(HeaderInterceptor)
export class DataController {
  @Get("/")
  getData() {
    return { data: [] };
  }
}
```

### Performance Monitoring Interceptor

```typescript
@Injectable()
export class PerformanceInterceptor {
  private metrics: any[] = [];

  async intercept(context: any, next: () => Promise<any>): Promise<any> {
    const { method, url } = context.request;
    const start = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = await next();

      const duration = Date.now() - start;
      const memoryDelta = process.memoryUsage().heapUsed - startMemory;

      this.metrics.push({
        method,
        url,
        duration,
        memoryDelta,
        timestamp: new Date(),
        success: true,
      });

      if (duration > 1000) {
        console.warn(`⚠ Slow request: ${method} ${url} - ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      this.metrics.push({
        method,
        url,
        duration,
        timestamp: new Date(),
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  getMetrics() {
    return this.metrics;
  }
}
```

### Data Sanitization Interceptor

```typescript
@Injectable()
export class SanitizeInterceptor {
  async intercept(context: any, next: () => Promise<any>): Promise<any> {
    const result = await next();

    // Remove sensitive fields from response
    return this.sanitize(result);
  }

  private sanitize(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    if (obj && typeof obj === "object") {
      const sanitized: any = {};

      for (const key in obj) {
        // Remove sensitive fields
        if (["password", "passwordHash", "secret", "token"].includes(key)) {
          continue;
        }

        sanitized[key] = this.sanitize(obj[key]);
      }

      return sanitized;
    }

    return obj;
  }
}

// Usage
@Controller("/api/users")
@UseInterceptors(SanitizeInterceptor)
export class UserController {
  @Get("/:id")
  getUser(@Param("id") id: string) {
    return {
      id,
      email: "user@example.com",
      passwordHash: "secret_hash", // This will be removed
    };
  }
}
```

### Compression Interceptor

```typescript
@Injectable()
export class CompressionInterceptor {
  async intercept(context: any, next: () => Promise<any>): Promise<any> {
    const result = await next();
    const acceptEncoding = context.request.headers["accept-encoding"] || "";

    if (acceptEncoding.includes("gzip") && this.shouldCompress(result)) {
      context.response.setHeader("Content-Encoding", "gzip");
      // Implement actual compression
      return result;
    }

    return result;
  }

  private shouldCompress(data: any): boolean {
    const json = JSON.stringify(data);
    return json.length > 1024; // Only compress if > 1KB
  }
}
```

---

## Execution Order

### Class-Level and Method-Level Interceptors

```typescript
@Controller("/api/users")
@UseInterceptors(Interceptor1, Interceptor2) // Execute first
export class UserController {
  @Get("/:id")
  @UseInterceptors(Interceptor3, Interceptor4) // Execute second
  getUser() {
    return { user: {} };
  }
}
```

**Execution Order:**

1. Interceptor1
2. Interceptor2
3. Interceptor3
4. Interceptor4
5. Route Handler
6. Interceptor4 (after)
7. Interceptor3 (after)
8. Interceptor2 (after)
9. Interceptor1 (after)

### Multiple UseInterceptors Decorators

```typescript
@Controller("/api/data")
@UseInterceptors(LoggingInterceptor)
@UseInterceptors(CacheInterceptor)
export class DataController {
  @Get("/")
  @UseInterceptors(TransformInterceptor)
  @UseInterceptors(SanitizeInterceptor)
  getData() {
    return { data: [] };
  }
}
```

**Order:** Logging → Cache → Transform → Sanitize → Handler → ...reverse

---

## Best Practices

### 1. Keep Interceptors Focused

```typescript
// Good - single responsibility
@Injectable()
export class LoggingInterceptor {
  async intercept(context: any, next: () => Promise<any>) {
    // Only handles logging
  }
}

@Injectable()
export class CacheInterceptor {
  async intercept(context: any, next: () => Promise<any>) {
    // Only handles caching
  }
}

// Avoid - multiple responsibilities
@Injectable()
export class MegaInterceptor {
  async intercept(context: any, next: () => Promise<any>) {
    // Logging, caching, transforming, validating...
  }
}
```

### 2. Always Call next()

```typescript
// Good
@Injectable()
export class MyInterceptor {
  async intercept(context: any, next: () => Promise<any>) {
    const result = await next(); // Always call next
    return this.transform(result);
  }
}

// Avoid
@Injectable()
export class BadInterceptor {
  async intercept(context: any, next: () => Promise<any>) {
    // Forgot to call next() - route handler never executes!
    return { error: "oops" };
  }
}
```

### 3. Handle Errors Appropriately

```typescript
// Good
@Injectable()
export class SafeInterceptor {
  async intercept(context: any, next: () => Promise<any>) {
    try {
      const result = await next();
      return this.process(result);
    } catch (error) {
      console.error("Error in interceptor:", error);
      throw error; // Re-throw to maintain error flow
    }
  }
}
```

### 4. Use Dependency Injection

```typescript
@Injectable()
export class CacheInterceptor {
  constructor(
    private cacheService: CacheService,
    private logger: LoggerService
  ) {}

  async intercept(context: any, next: () => Promise<any>) {
    const cached = await this.cacheService.get(context.url);
    if (cached) {
      this.logger.log("Cache hit");
      return cached;
    }

    const result = await next();
    await this.cacheService.set(context.url, result);
    return result;
  }
}
```

### 5. Apply at Appropriate Level

```typescript
// Good - logging for all routes
@Controller("/api/users")
@UseInterceptors(LoggingInterceptor)
export class UserController {
  // All routes logged
}

// Good - caching for specific route
@Controller("/api/posts")
export class PostController {
  @Get("/:id")
  @UseInterceptors(CacheInterceptor) // Only this route cached
  getPost() {}
}
```

### 6. Document Side Effects

```typescript
/**
 * Logs all incoming requests and outgoing responses
 * Adds X-Request-Id header to responses
 * Measures and logs request duration
 */
@Injectable()
export class LoggingInterceptor {
  async intercept(context: any, next: () => Promise<any>) {
    // Implementation
  }
}
```

---

## Common Use Cases

### API Response Standardization

```typescript
@Controller("/api")
@UseInterceptors(TransformInterceptor, ErrorInterceptor)
export class ApiController {
  // All responses will be in standard format
}
```

### Performance Monitoring

```typescript
@Controller("/api/analytics")
@UseInterceptors(PerformanceInterceptor, LoggingInterceptor)
export class AnalyticsController {
  // All routes monitored for performance
}
```

### Caching Strategy

```typescript
@Controller("/api/products")
export class ProductController {
  @Get("/")
  @UseInterceptors(CacheInterceptor) // Cache list
  listProducts() {}

  @Get("/:id")
  @UseInterceptors(CacheInterceptor) // Cache individual
  getProduct() {}

  @Post("/")
  // No caching for mutations
  createProduct() {}
}
```

---

## Advanced Patterns

### Conditional Interceptor

```typescript
@Injectable()
export class ConditionalCacheInterceptor {
  async intercept(context: any, next: () => Promise<any>) {
    const cacheHeader = context.request.headers["x-no-cache"];

    // Skip caching if header present
    if (cacheHeader) {
      return next();
    }

    // Otherwise apply caching
    return this.cache(context, next);
  }

  private async cache(context: any, next: () => Promise<any>) {
    // Caching logic
  }
}
```

### Parameterized Interceptor

```typescript
export function Cache(ttl: number) {
  return UseInterceptors(class {
    async intercept(context: any, next: () => Promise<any>) {
      // Use ttl parameter
      const cached = getCached(context.url, ttl);
      return cached || await next();
    }
  });
}

// Usage
@Get('/data')
@Cache(60000)  // 1 minute
getData() { }
```

---

## Related Documentation

- [Guards](./GUARDS_DECORATOR.md)
- [Pipes](./PIPES_DECORATOR.md)
- [Controller](./CONTROLLER_DECORATOR.md)
- [Injectable](./INJECTABLE_DECORATOR.md)

---

**Last Updated**: December 4, 2025
