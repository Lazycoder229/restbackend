# Performance Service Documentation

## Overview

The PerformanceService provides performance monitoring, metrics collection, profiling, and performance analysis for Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Metrics](#metrics)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { PerformanceService } from "./builtin/performance.service";
```

---

## API Reference

### `startTimer(name): string`

Start performance timer and return timer ID.

### `endTimer(timerId): number`

End timer and return elapsed time in milliseconds.

### `measure(name, fn): Promise<T>`

Measure async function execution time.

### `getMetrics(): PerformanceMetrics`

Get collected performance metrics.

### `clearMetrics(): void`

Clear all collected metrics.

---

## Metrics

```typescript
interface PerformanceMetrics {
  requests: {
    total: number;
    averageResponseTime: number;
    slowestRoute: string;
  };
  database: {
    totalQueries: number;
    averageQueryTime: number;
    slowestQuery: string;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
  };
}
```

---

## Examples

### Measure Function Performance

```typescript
@Injectable()
export class UserService {
  constructor(private perf: PerformanceService) {}

  async getUsers() {
    return await this.perf.measure("getUsers", async () => {
      const users = await User.findAll();
      return users;
    });
  }
}
```

### Monitor Endpoint Performance

```typescript
@Controller("/api")
export class ApiController {
  constructor(private perf: PerformanceService) {}

  @Get("/data")
  async getData() {
    const timerId = this.perf.startTimer("getData");

    try {
      const data = await this.fetchData();
      return data;
    } finally {
      const elapsed = this.perf.endTimer(timerId);
      console.log(`Request took ${elapsed}ms`);
    }
  }

  @Get("/metrics")
  getMetrics() {
    return this.perf.getMetrics();
  }
}
```

---

## Related Documentation

- [Logger](./LOGGER.md)
- [Interceptors](./INTERCEPTORS_DECORATOR.md)
- [Cache Service](./CACHE_SERVICE.md)

---

**Last Updated**: December 4, 2025
