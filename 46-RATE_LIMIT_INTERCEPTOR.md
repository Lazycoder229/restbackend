# Rate Limit Interceptor Documentation

## Overview

The RateLimitInterceptor provides request rate limiting to protect your API from abuse, DDoS attacks, and ensure fair usage across all clients in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { RateLimitInterceptor } from "./builtin/rate-limit.interceptor";
```

---

## Basic Usage

```typescript
const rateLimit = new RateLimitInterceptor();

// Configure
rateLimit.configure({
  maxRequests: 100, // Max requests per window
  windowMs: 60000, // Time window in ms (1 minute)
});

// Apply to controller
@Controller("/api")
@UseInterceptors(rateLimit)
export class ApiController {
  @Get("/data")
  async getData() {
    return { data: "protected resource" };
  }
}
```

---

## Configuration

### Options

| Option        | Type   | Default | Description                 |
| ------------- | ------ | ------- | --------------------------- |
| `maxRequests` | number | 100     | Maximum requests per window |
| `windowMs`    | number | 60000   | Time window in milliseconds |

```typescript
rateLimit.configure({
  maxRequests: 50,
  windowMs: 300000, // 5 minutes
});
```

---

## Best Practices

### 1. Set Appropriate Limits

```typescript
// Stricter for auth endpoints
const authRateLimit = new RateLimitInterceptor();
authRateLimit.configure({ maxRequests: 5, windowMs: 60000 });

// More lenient for read operations
const readRateLimit = new RateLimitInterceptor();
readRateLimit.configure({ maxRequests: 100, windowMs: 60000 });
```

### 2. Use Per-Endpoint Limits

```typescript
@Controller("/api")
export class ApiController {
  @Post("/login")
  @UseInterceptors(authRateLimit)
  async login() {}

  @Get("/posts")
  @UseInterceptors(readRateLimit)
  async getPosts() {}
}
```

---

## Examples

### API Protection

```typescript
@Controller("/api")
@UseInterceptors(rateLimit)
export class ApiController {
  @Get("/data")
  async getData() {
    return { message: "Rate limited endpoint" };
  }
}
```

---

## Related Documentation

- [Advanced Rate Limit](./ADVANCED_RATE_LIMIT_INTERCEPTOR.md)
- [Interceptors](./INTERCEPTORS_DECORATOR.md)
- [CORS Interceptor](./CORS_INTERCEPTOR.md)

---

**Last Updated**: December 4, 2025
