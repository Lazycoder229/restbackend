# Advanced Rate Limit Interceptor Documentation

## Overview

The AdvancedRateLimitInterceptor provides sophisticated rate limiting with Redis support, custom key generation, per-user limits, and flexible configuration for Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Rate Limit Stores](#rate-limit-stores)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  AdvancedRateLimitInterceptor,
  InMemoryRateLimitStore,
  RedisRateLimitStore,
} from "./builtin/advanced-rate-limit.interceptor";
```

---

## Configuration

```typescript
const rateLimiter = new AdvancedRateLimitInterceptor({
  windowMs: 60000, // 1 minute
  max: 100, // Max requests per window
  store: new InMemoryRateLimitStore(),
  keyGenerator: (req) => req.socket.remoteAddress,
  standardHeaders: true,
  message: "Too many requests",
});
```

---

## Rate Limit Stores

### In-Memory Store

```typescript
const store = new InMemoryRateLimitStore();
```

### Redis Store

```typescript
import Redis from "redis";

const redisClient = Redis.createClient();
const store = new RedisRateLimitStore(redisClient);
```

---

## Examples

### Per-User Rate Limiting

```typescript
const rateLimiter = new AdvancedRateLimitInterceptor({
  windowMs: 60000,
  max: 50,
  keyGenerator: (req) => {
    return req.user ? `user:${req.user.id}` : req.socket.remoteAddress;
  },
});

@Controller("/api")
@UseInterceptors(rateLimiter)
export class ApiController {
  // Protected endpoints
}
```

### Different Limits for Different Endpoints

```typescript
const strictLimit = new AdvancedRateLimitInterceptor({
  windowMs: 60000,
  max: 5,
});

const normalLimit = new AdvancedRateLimitInterceptor({
  windowMs: 60000,
  max: 100,
});

@Controller("/api")
export class ApiController {
  @Post("/login")
  @UseInterceptors(strictLimit)
  async login() {}

  @Get("/data")
  @UseInterceptors(normalLimit)
  async getData() {}
}
```

---

## Related Documentation

- [Rate Limit Interceptor](./RATE_LIMIT_INTERCEPTOR.md)
- [Interceptors](./INTERCEPTORS_DECORATOR.md)
- [Cache Service](./CACHE_SERVICE.md)

---

**Last Updated**: December 4, 2025
