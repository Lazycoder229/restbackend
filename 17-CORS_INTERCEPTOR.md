# CORS Interceptor Documentation

## Overview

The CorsInterceptor provides Cross-Origin Resource Sharing (CORS) support for your Fynix API, enabling secure cross-domain requests from web browsers.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [Configuration](#configuration)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { CorsInterceptor } from "./builtin/cors.interceptor";
```

---

## Basic Usage

```typescript
const cors = new CorsInterceptor();

// Configure
cors.configure({
  origins: ["https://example.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  headers: ["Content-Type", "Authorization"],
});

// Apply globally
app.useGlobalInterceptors(cors);
```

---

## Configuration

### Options

```typescript
cors.configure({
  origins: ["*"], // Allowed origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  headers: ["Content-Type", "Authorization"],
});
```

---

## Examples

### Allow All Origins

```typescript
cors.configure({
  origins: ["*"],
});
```

### Allow Specific Domains

```typescript
cors.configure({
  origins: ["https://example.com", "https://app.example.com"],
  methods: ["GET", "POST"],
  headers: ["Content-Type", "Authorization", "X-API-Key"],
});
```

---

## Related Documentation

- [Security Headers](./SECURITY_HEADERS_INTERCEPTOR.md)
- [Interceptors](./INTERCEPTORS_DECORATOR.md)

---

**Last Updated**: December 4, 2025
