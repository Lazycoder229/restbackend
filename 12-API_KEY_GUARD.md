# API Key Guard Documentation

## Overview

The ApiKeyGuard provides API key authentication for protecting routes with token-based access control in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Key Store](#api-key-store)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  ApiKeyGuard,
  ApiKeyService,
  InMemoryApiKeyStore,
} from "./builtin/api-key.guard";
```

---

## Basic Usage

### Create API Key Guard

```typescript
const store = new InMemoryApiKeyStore();
const guard = new ApiKeyGuard({
  header: "x-api-key",
  store,
});

@Controller("/api")
@UseGuards(guard)
export class ApiController {
  @Get("/data")
  async getData() {
    return { message: "Protected with API key" };
  }
}
```

---

## API Key Store

### In-Memory Store

```typescript
const store = new InMemoryApiKeyStore();

// Save API key
await store.save({
  key: "abc123",
  name: "My App",
  userId: "user-1",
  scopes: ["read", "write"],
  createdAt: new Date(),
});
```

---

## API Reference

### ApiKeyService

#### `generate(length?: number): string`

Generate API key.

```typescript
const apiKey = ApiKeyService.generate(32);
```

#### `create(options): ApiKey`

Create API key with metadata.

```typescript
const apiKey = ApiKeyService.create({
  name: "Mobile App",
  userId: "user-123",
  scopes: ["read"],
  expiresIn: 365, // days
});
```

---

## Examples

### API Key Authentication

```typescript
@Controller("/api/v1")
export class ApiController {
  constructor(private apiKeyGuard: ApiKeyGuard) {}

  @Get("/products")
  @UseGuards(apiKeyGuard)
  async getProducts() {
    return await this.productService.findAll();
  }

  @Post("/products")
  @UseGuards(apiKeyGuard)
  async createProduct(@Body() data: CreateProductDto) {
    return await this.productService.create(data);
  }
}
```

### Scoped API Keys

```typescript
const guard = new ScopedApiKeyGuard(["write"], { store });

@Controller("/api")
export class ApiController {
  @Post("/data")
  @UseGuards(guard)
  async createData(@Body() data: any) {
    return await this.service.create(data);
  }
}
```

---

## Related Documentation

- [JWT Auth Guard](./JWT_AUTH_GUARD.md)
- [Guards Decorator](./GUARDS_DECORATOR.md)
- [Security Service](./SECURITY_SERVICE.md)

---

**Last Updated**: December 4, 2025
