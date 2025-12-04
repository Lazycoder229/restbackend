# Cache Service Documentation

## Overview

The CacheService provides flexible caching capabilities with support for in-memory LRU cache and Redis, including TTL (time-to-live), cache invalidation, and get-or-set patterns for Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Cache Stores](#cache-stores)
- [Cache Decorator](#cache-decorator)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  CacheService,
  CacheManager,
  LRUCacheStore,
  RedisCacheStore,
} from "./builtin/cache.service";
```

---

## Basic Usage

### In-Memory Cache

```typescript
const cache = new CacheManager(new LRUCacheStore(100), "app");

// Set cache
await cache.set("user:123", { id: 123, name: "John" }, 3600);

// Get from cache
const user = await cache.get("user:123");

// Delete from cache
await cache.delete("user:123");

// Clear all cache
await cache.clear();
```

### Get or Set Pattern

```typescript
const user = await cache.getOrSet(
  "user:123",
  async () => {
    return await database.query("SELECT * FROM users WHERE id = 123");
  },
  3600
);
```

---

## API Reference

### CacheManager

#### Constructor

```typescript
new CacheManager(store: CacheStore, namespace?: string)
```

#### Methods

##### `get<T>(key: string): Promise<T | undefined>`

Get value from cache.

```typescript
const user = await cache.get<User>("user:123");
```

##### `set<T>(key: string, value: T, ttl?: number): Promise<void>`

Set value in cache with optional TTL (in seconds).

```typescript
await cache.set("user:123", user, 3600); // 1 hour
```

##### `delete(key: string): Promise<void>`

Delete value from cache.

```typescript
await cache.delete("user:123");
```

##### `clear(): Promise<void>`

Clear all values in namespace.

```typescript
await cache.clear();
```

##### `getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>`

Get from cache or execute factory function and cache result.

```typescript
const user = await cache.getOrSet(
  "user:123",
  async () => {
    return await userService.findById(123);
  },
  3600
);
```

##### `remember<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>`

Alias for `getOrSet`.

```typescript
const posts = await cache.remember(
  "posts:recent",
  async () => {
    return await postService.getRecent();
  },
  300
);
```

---

## Cache Stores

### LRUCacheStore (In-Memory)

Least Recently Used cache with automatic eviction.

```typescript
import { LRUCacheStore } from "./builtin/cache.service";

const store = new LRUCacheStore(1000); // Max 1000 items
const cache = new CacheManager(store);
```

**Features:**

- Automatic eviction when max size reached
- No external dependencies
- Fast access
- Lost on server restart

### RedisCacheStore

Distributed cache using Redis.

```typescript
import { RedisCacheStore } from "./builtin/cache.service";
import Redis from "redis";

const redisClient = Redis.createClient({
  host: "localhost",
  port: 6379,
});

const store = new RedisCacheStore(redisClient);
const cache = new CacheManager(store);
```

**Features:**

- Persistent across server restarts
- Shared across multiple servers
- Supports distributed systems
- Requires Redis server

---

## Cache Decorator

### Using @Cache Decorator

```typescript
import { Cache } from "./builtin/cache.service";

@Injectable()
export class UserService {
  @Cache({ ttl: 300, key: "user" })
  async findById(id: number): Promise<User> {
    // This result will be cached for 300 seconds
    return await this.userRepo.findById(id);
  }

  @Cache({ ttl: 600, key: "users" })
  async findAll(): Promise<User[]> {
    return await this.userRepo.findAll();
  }
}
```

---

## Best Practices

### 1. Use Appropriate TTL

```typescript
// Good - appropriate TTLs
await cache.set("user:session", session, 1800); // 30 min
await cache.set("blog:post", post, 3600); // 1 hour
await cache.set("static:config", config, 86400); // 24 hours

// Bad - too long or too short
await cache.set("stock:price", price, 86400); // Should be shorter
await cache.set("user:profile", profile, 1); // Too short
```

### 2. Use Namespaced Keys

```typescript
// Good - clear namespacing
const userCache = new CacheManager(store, "user");
const postCache = new CacheManager(store, "post");

await userCache.set("123", user);
await postCache.set("456", post);

// Bad - no namespace
await cache.set("123", user); // Ambiguous key
```

### 3. Cache Expensive Operations

```typescript
// Good - cache database queries
const users = await cache.remember(
  "users:all",
  async () => {
    return await db.query("SELECT * FROM users");
  },
  300
);

// Good - cache API calls
const weather = await cache.remember(
  "weather:london",
  async () => {
    return await weatherAPI.getWeather("London");
  },
  600
);
```

### 4. Invalidate on Updates

```typescript
@Injectable()
export class UserService {
  constructor(private cache: CacheManager) {}

  async updateUser(id: number, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.update(id, data);

    // Invalidate cache after update
    await this.cache.delete(`user:${id}`);
    await this.cache.delete("users:all");

    return user;
  }
}
```

### 5. Handle Cache Failures Gracefully

```typescript
// Good - fallback on cache failure
async getUser(id: number): Promise<User> {
  try {
    return await this.cache.getOrSet(`user:${id}`, async () => {
      return await this.userRepo.findById(id);
    }, 3600);
  } catch (error) {
    // Log error but don't fail
    this.logger.error('Cache error', error);
    return await this.userRepo.findById(id);
  }
}
```

---

## Examples

### Complete Service with Caching

```typescript
@Injectable()
export class ProductService {
  private cache: CacheManager;

  constructor(private productRepo: ProductRepository, cacheStore: CacheStore) {
    this.cache = new CacheManager(cacheStore, "product");
  }

  async findById(id: number): Promise<Product> {
    return await this.cache.getOrSet(
      `${id}`,
      async () => await this.productRepo.findById(id),
      3600 // 1 hour
    );
  }

  async findAll(): Promise<Product[]> {
    return await this.cache.remember(
      "all",
      async () => await this.productRepo.findAll(),
      300 // 5 minutes
    );
  }

  async create(data: CreateProductDto): Promise<Product> {
    const product = await this.productRepo.create(data);

    // Invalidate list cache
    await this.cache.delete("all");

    return product;
  }

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    const product = await this.productRepo.update(id, data);

    // Invalidate caches
    await this.cache.delete(`${id}`);
    await this.cache.delete("all");

    return product;
  }

  async delete(id: number): Promise<void> {
    await this.productRepo.delete(id);

    // Invalidate caches
    await this.cache.delete(`${id}`);
    await this.cache.delete("all");
  }
}
```

### API Response Caching

```typescript
@Controller("/api/posts")
export class PostController {
  private cache: CacheManager;

  constructor(private postService: PostService, cacheStore: CacheStore) {
    this.cache = new CacheManager(cacheStore, "api:posts");
  }

  @Get()
  async getPosts(@Query() query: any) {
    const cacheKey = `list:${JSON.stringify(query)}`;

    return await this.cache.remember(
      cacheKey,
      async () => {
        return await this.postService.findAll(query);
      },
      60
    ); // 1 minute
  }

  @Get("/:id")
  async getPost(@Param("id") id: number) {
    return await this.cache.remember(
      `${id}`,
      async () => {
        return await this.postService.findById(id);
      },
      300
    ); // 5 minutes
  }
}
```

### Multi-Level Caching

```typescript
@Injectable()
export class UserService {
  private memoryCache: CacheManager;
  private redisCache: CacheManager;

  constructor(private userRepo: UserRepository) {
    this.memoryCache = new CacheManager(new LRUCacheStore(100), "user");
    this.redisCache = new CacheManager(
      new RedisCacheStore(redisClient),
      "user"
    );
  }

  async findById(id: number): Promise<User> {
    // Try memory cache first
    let user = await this.memoryCache.get<User>(`${id}`);
    if (user) return user;

    // Try Redis cache
    user = await this.redisCache.get<User>(`${id}`);
    if (user) {
      // Populate memory cache
      await this.memoryCache.set(`${id}`, user, 300);
      return user;
    }

    // Fetch from database
    user = await this.userRepo.findById(id);

    // Populate both caches
    await this.memoryCache.set(`${id}`, user, 300);
    await this.redisCache.set(`${id}`, user, 3600);

    return user;
  }
}
```

### Cache Warming

```typescript
@Injectable()
export class CacheWarmingService {
  private cache: CacheManager;

  constructor(private productService: ProductService, cacheStore: CacheStore) {
    this.cache = new CacheManager(cacheStore, "product");
  }

  async warmCache(): Promise<void> {
    console.log("Warming cache...");

    // Cache popular products
    const popularIds = await this.getPopularProductIds();

    for (const id of popularIds) {
      const product = await this.productService.findById(id);
      await this.cache.set(`${id}`, product, 3600);
    }

    // Cache categories
    const categories = await this.productService.getCategories();
    await this.cache.set("categories", categories, 86400);

    console.log("Cache warmed successfully");
  }

  private async getPopularProductIds(): Promise<number[]> {
    // Get most viewed products
    return await this.analyticsService.getTopProducts(100);
  }
}
```

---

## Related Documentation

- [Config Service](./CONFIG_SERVICE.md)
- [Database Service](./DATABASE_SERVICE.md)
- [Redis Cache Store](./CACHE_SERVICE.md#rediscachestore)
- [Performance Optimization](./PERFORMANCE_SERVICE.md)

---

**Last Updated**: December 4, 2025
