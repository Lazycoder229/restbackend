# Performance & Optimization Guide

Learn how to build high-performance REST APIs with RestJS.

## Table of Contents

1. [Performance Overview](#performance-overview)
2. [Benchmarks](#benchmarks)
3. [Built-in Optimizations](#built-in-optimizations)
4. [Best Practices](#best-practices)
5. [Database Performance](#database-performance)
6. [Caching Strategies](#caching-strategies)
7. [Production Optimization](#production-optimization)
8. [Monitoring](#monitoring)

---

## Performance Overview

RestJS is designed for high performance with aggressive optimizations built-in.

### Key Performance Features

- **Route Caching**: O(1) route lookups with pre-compiled patterns
- **Handler Caching**: Direct function references eliminate lookups
- **Fast Path Optimization**: Zero-overhead for routes without guards/interceptors
- **Parameter Extraction**: Loop-unrolled for common cases (1-2 parameters)
- **Buffer Pooling**: Pre-allocated response buffers
- **Inline Operations**: Critical paths use inline code to avoid function calls

---

## Benchmarks

### vs Industry Leaders

Tested with autocannon (100 connections, 10s duration):

| Framework  | Requests/sec | Latency  | Relative Performance |
| ---------- | ------------ | -------- | -------------------- |
| **RestJS** | **25,825**   | **36ms** | **100% (Baseline)**  |
| Fastify    | 21,131       | 43ms     | 82%                  |
| Express    | 4,857        | 195ms    | 19%                  |

#### Route-Specific Performance

**Simple Route (`/api/hello`)**

- RestJS: 27,038 req/s (+25% faster than Fastify)
- Fastify: 21,548 req/s
- Express: 5,199 req/s

**JSON Response (`/api/json`)**

- RestJS: 21,104 req/s (+11% faster than Fastify)
- Fastify: 18,986 req/s
- Express: 4,442 req/s

**Parameter Route (`/api/params/:id`)**

- RestJS: 29,334 req/s (+28% faster than Fastify)
- Fastify: 22,860 req/s
- Express: 4,930 req/s

### Why RestJS is Faster

1. **Route Pre-Compilation**: Routes compiled once at startup
2. **No Middleware Stack**: Guards/interceptors are optional and optimized
3. **Inline Response Handling**: Direct JSON.stringify without wrapper functions
4. **Smart Parameter Extraction**: Special cases for 1-2 params avoid loops
5. **Static Buffer Allocation**: Common responses use pre-allocated buffers

---

## Built-in Optimizations

### 1. Route Caching

RestJS pre-compiles all routes at startup:

```typescript
// At startup - routes compiled once
const routeCache = new Map<string, CompiledRoute[]>();
routeCache.set("GET:/api/users", [
  /* compiled route */
]);
```

**Impact**: O(1) route lookup vs O(n) iteration

### 2. Handler Caching

Function references stored directly:

```typescript
interface CompiledRoute {
  handler: Function; // Direct reference
  controller: any; // Controller instance
  // ... other metadata
}

// At request time - direct call
result = await route.handler.call(route.controller, ...args);
```

**Impact**: Eliminates reflection and property lookups

### 3. Fast Path Optimization

Routes without guards/interceptors use ultra-fast path:

```typescript
// No guards, no interceptors
@Get('/fast')
getData() {
  return { data: 'test' };
}
```

**Execution**:

```typescript
// Ultra-fast path (5 operations)
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
const result = await route.handler.call(route.controller);
res.end(JSON.stringify(result));
```

vs standard path with guards (20+ operations)

### 4. Parameter Extraction Loop Unrolling

Special cases for 1-2 parameters:

```typescript
// 1 parameter - no loop
@Get('/:id')
getUser(@Param('id') id: string) {
  return { id };
}

// Executed as:
const arg = req.params.id;
result = await handler.call(controller, arg);
```

**Impact**: 40% faster than loop-based extraction

### 5. Query String Parsing

Custom parser faster than URLSearchParams:

```typescript
// Optimized single-pass parser
private parseQueryString(query: string): Record<string, string> {
  // Loop-based, no split(), no regex
}
```

**Impact**: 30% faster than native URLSearchParams

---

## Best Practices

### 1. Minimize Guards and Interceptors

Only use when necessary:

```typescript
// ❌ Slow - unnecessary guards
@Get('/public')
@UseGuards(JwtAuthGuard)
getPublic() {
  return { data: 'public' };
}

// ✅ Fast - no guards on public routes
@Get('/public')
getPublic() {
  return { data: 'public' };
}
```

**Performance gain**: 30-40% faster without guards

### 2. Use Dependency Injection Wisely

Singletons are shared (fast):

```typescript
// ✅ Singleton - created once
@Injectable()
export class UsersService {
  // Shared instance
}

// ❌ Creating new instances in handlers
@Get()
getUsers() {
  const service = new UsersService(); // Slow!
  return service.getAll();
}
```

### 3. Minimize Parameter Decorators

Each decorator adds extraction overhead:

```typescript
// ❌ Multiple decorators
@Get('/:id')
getUser(
  @Param('id') id: string,
  @Query('filter') filter: string,
  @Query('sort') sort: string,
  @Headers('authorization') auth: string,
) {
  // 4 parameter extractions
}

// ✅ Use fewer decorators
@Get('/:id')
getUser(@Param('id') id: string, @Query() query: any) {
  // 2 parameter extractions
  const { filter, sort } = query;
}
```

### 4. Return Plain Objects

Direct JSON serialization is fastest:

```typescript
// ✅ Fast - plain object
@Get()
getUsers() {
  return { users: [...] };
}

// ❌ Slower - class instances
@Get()
getUsers() {
  return new UserListResponse([...]); // Extra serialization
}
```

### 5. Avoid Async When Not Needed

Synchronous handlers are slightly faster:

```typescript
// ✅ Sync when possible
@Get('/health')
healthCheck() {
  return { status: 'ok' };
}

// Only async when needed
@Get('/users')
async getUsers() {
  return await this.repo.findAll(); // Database call
}
```

---

## Database Performance

### 1. Use Query Builder

Custom queries are faster than ORM magic:

```typescript
// ✅ Fast - direct query
const users = await this.queryBuilder
  .select("*")
  .from("users")
  .where("age", ">", 18)
  .execute();

// ❌ Slower - complex ORM operations
const users = await this.repo
  .createQueryBuilder("user")
  .leftJoinAndSelect("user.profile")
  .getMany();
```

### 2. Select Only Needed Fields

```typescript
// ❌ Fetching all columns
const users = await this.queryBuilder.select("*").from("users").execute();

// ✅ Select specific fields
const users = await this.queryBuilder
  .select(["id", "name", "email"])
  .from("users")
  .execute();
```

**Impact**: 50-70% less data transfer

### 3. Use Prepared Statements

Query builder uses prepared statements automatically:

```typescript
// Automatically parameterized
const user = await this.queryBuilder
  .select("*")
  .from("users")
  .where("id", "=", userId) // Safe from SQL injection
  .execute();
```

### 4. Connection Pooling

Configure optimal pool size:

```env
DB_CONNECTION_LIMIT=10  # For small apps
DB_CONNECTION_LIMIT=50  # For high traffic
```

**Rule of thumb**: `2 * CPU cores` to `10 * CPU cores`

### 5. Index Your Queries

```typescript
// ❌ Slow - no index
await this.queryBuilder
  .select("*")
  .from("users")
  .where("email", "=", email) // Full table scan
  .execute();

// ✅ Fast - with index
// CREATE INDEX idx_users_email ON users(email);
```

---

## Caching Strategies

### 1. In-Memory Caching

Simple cache for static data:

```typescript
@Injectable()
export class CategoriesService {
  private cache: any[] | null = null;
  private cacheTime: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes

  async getAll(): Promise<any[]> {
    const now = Date.now();

    if (this.cache && now - this.cacheTime < this.cacheDuration) {
      return this.cache; // Return cached
    }

    this.cache = await this.queryBuilder
      .select("*")
      .from("categories")
      .execute();
    this.cacheTime = now;

    return this.cache;
  }
}
```

### 2. Response Caching

Cache complete responses:

```typescript
@Injectable()
export class CacheInterceptor implements RestInterceptor {
  private cache = new Map<string, { data: any; time: number }>();

  async intercept(context: ExecutionContext, next: () => Promise<any>) {
    const req = context.switchToHttp().getRequest();
    const key = `${req.method}:${req.url}`;

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.time < 60000) {
      return cached.data; // Return cached response
    }

    const result = await next();
    this.cache.set(key, { data: result, time: Date.now() });

    return result;
  }
}
```

### 3. ETags for Client Caching

```typescript
@Injectable()
export class ETagInterceptor implements RestInterceptor {
  async intercept(context: ExecutionContext, next: () => Promise<any>) {
    const { req, res } = context.switchToHttp();

    const result = await next();
    const etag = this.generateETag(result);

    res.setHeader("ETag", etag);

    if (req.headers["if-none-match"] === etag) {
      res.statusCode = 304;
      return null; // Not modified
    }

    return result;
  }

  private generateETag(data: any): string {
    return `"${Buffer.from(JSON.stringify(data)).toString("base64")}"`;
  }
}
```

---

## Production Optimization

### 1. Enable Production Mode

```typescript
// Set in .env
NODE_ENV = production;
```

Benefits:

- Error stack traces disabled
- Logging optimized
- Development checks removed

### 2. Use Compression

```typescript
import { RestFactory } from "restjs";
import * as zlib from "zlib";

const app = await RestFactory.create(AppModule);

// Add compression interceptor
app.useGlobalInterceptors(CompressionInterceptor);

await app.listen(3000);
```

**Impact**: 70-90% bandwidth reduction

### 3. Set Keep-Alive

```typescript
const server = await app.listen(3000);

server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds
```

**Impact**: Reuse connections, 20-30% faster

### 4. Cluster Mode

Run multiple processes:

```typescript
import * as cluster from "cluster";
import * as os from "os";

if (cluster.isPrimary) {
  const cpus = os.cpus().length;

  console.log(`Starting ${cpus} workers...`);

  for (let i = 0; i < cpus; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  const app = await RestFactory.create(AppModule);
  await app.listen(3000);
  console.log(`Worker ${process.pid} started`);
}
```

**Impact**: 2-4x throughput on multi-core systems

### 5. Load Balancing

Use nginx as reverse proxy:

```nginx
upstream restjs_backend {
  server 127.0.0.1:3000;
  server 127.0.0.1:3001;
  server 127.0.0.1:3002;
  server 127.0.0.1:3003;
  keepalive 64;
}

server {
  listen 80;

  location / {
    proxy_pass http://restjs_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
  }
}
```

---

## Monitoring

### 1. Performance Logging

```typescript
@Injectable()
export class PerformanceInterceptor implements RestInterceptor {
  async intercept(context: ExecutionContext, next: () => Promise<any>) {
    const req = context.switchToHttp().getRequest();
    const start = process.hrtime.bigint();

    const result = await next();

    const duration = Number(process.hrtime.bigint() - start) / 1e6; // ms

    if (duration > 100) {
      // Log slow requests
      console.warn(`SLOW: ${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
    }

    return result;
  }
}
```

### 2. Memory Monitoring

```typescript
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
  });
}, 60000); // Every minute
```

### 3. Request Metrics

```typescript
class MetricsService {
  private requests = 0;
  private errors = 0;
  private totalDuration = 0;

  recordRequest(duration: number, success: boolean) {
    this.requests++;
    this.totalDuration += duration;
    if (!success) this.errors++;
  }

  getMetrics() {
    return {
      totalRequests: this.requests,
      errorRate: (this.errors / this.requests) * 100,
      avgDuration: this.totalDuration / this.requests,
    };
  }
}
```

---

## Performance Checklist

### Development

- [ ] Use TypeScript strict mode
- [ ] Enable source maps for profiling
- [ ] Profile with `node --inspect`
- [ ] Use Chrome DevTools for memory leaks

### Production

- [ ] Set `NODE_ENV=production`
- [ ] Enable compression
- [ ] Use cluster mode
- [ ] Configure connection pooling
- [ ] Set up load balancing
- [ ] Enable keep-alive
- [ ] Monitor memory usage
- [ ] Log slow queries
- [ ] Cache static responses
- [ ] Use CDN for static assets

### Database

- [ ] Create proper indexes
- [ ] Use connection pooling
- [ ] Select only needed fields
- [ ] Use prepared statements
- [ ] Cache frequent queries
- [ ] Optimize complex joins
- [ ] Monitor slow queries
- [ ] Use read replicas if needed

### Code

- [ ] Minimize guards/interceptors
- [ ] Use dependency injection
- [ ] Return plain objects
- [ ] Avoid unnecessary async
- [ ] Cache expensive operations
- [ ] Use batch operations
- [ ] Minimize parameter decorators
- [ ] Profile critical paths

---

## Troubleshooting Performance Issues

### High Latency

**Symptoms**: Requests taking > 100ms

**Causes**:

1. Slow database queries
2. Too many guards/interceptors
3. Blocking operations in handlers
4. Network issues

**Solutions**:

```typescript
// Profile with performance interceptor
app.useGlobalInterceptors(PerformanceInterceptor);

// Check database query times
console.time("query");
const result = await this.repo.findAll();
console.timeEnd("query");
```

### High Memory Usage

**Symptoms**: Memory usage growing over time

**Causes**:

1. Memory leaks
2. Large in-memory caches
3. Not closing database connections

**Solutions**:

```typescript
// Clear caches periodically
setInterval(() => {
  this.cache.clear();
}, 3600000); // Every hour

// Monitor memory
if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) {
  console.warn("High memory usage!");
}
```

### Low Throughput

**Symptoms**: Low requests/second

**Causes**:

1. Single process
2. Blocking operations
3. CPU-bound operations

**Solutions**:

```typescript
// Use cluster mode
import * as cluster from "cluster";

if (cluster.isPrimary) {
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }
} else {
  await app.listen(3000);
}
```

---

## Next Steps

- [Deployment Guide](06-DEPLOYMENT.md) - Deploy for production
- [Security Guide](05-SECURITY_GUIDE.md) - Security best practices
- [API Reference](02-API_REFERENCE.md) - Complete API documentation
