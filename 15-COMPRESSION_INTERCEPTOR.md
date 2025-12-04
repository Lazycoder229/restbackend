# Compression Interceptor Documentation

## Overview

The CompressionInterceptor provides HTTP response compression (gzip/deflate) to reduce bandwidth usage and improve response times in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { CompressionInterceptor } from "./builtin/compression.interceptor";
```

---

## Configuration

```typescript
const compression = new CompressionInterceptor({
  threshold: 1024, // Minimum bytes to compress (1KB)
  level: 6, // Compression level (0-9)
  contentTypes: [
    "text/html",
    "text/plain",
    "text/css",
    "text/javascript",
    "application/javascript",
    "application/json",
  ],
});

app.useGlobalInterceptors(compression);
```

---

## Examples

### Global Compression

```typescript
const app = await FynixFactory.create(AppModule);

app.useGlobalInterceptors(
  new CompressionInterceptor({
    threshold: 2048,
    level: 7,
  })
);

await app.listen(3000);
```

---

## Related Documentation

- [Interceptors](./INTERCEPTORS_DECORATOR.md)
- [Performance Service](./PERFORMANCE_SERVICE.md)

---

**Last Updated**: December 4, 2025
