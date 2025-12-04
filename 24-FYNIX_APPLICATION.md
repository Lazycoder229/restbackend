# Fynix Application Documentation

## Overview

The FynixApplication class is the main application instance that manages HTTP server lifecycle, route compilation, middleware, interceptors, and request handling in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { FynixApplication } from "./core/fynix-application";
```

---

## API Reference

### `init(): Promise<void>`

Initialize the application, scan modules, and compile routes.

### `listen(port, callback?): Promise<void>`

Start HTTP server on specified port.

### `get<T>(token): T`

Get a provider instance from the DI container.

### `useGlobalInterceptors(...interceptors): void`

Register global interceptors.

### `setGlobalPrefix(prefix): void`

Set global route prefix (e.g., '/api').

### `enableHotReload(options): void`

Enable hot module reloading for development.

### `close(): Promise<void>`

Gracefully shutdown the application.

---

## Configuration

### Global Prefix

```typescript
app.setGlobalPrefix("/api");

// All routes now prefixed with /api
// /users -> /api/users
```

### Global Interceptors

```typescript
app.useGlobalInterceptors(
  new LoggingInterceptor(),
  new CorsInterceptor(),
  new CompressionInterceptor()
);
```

### Hot Reload

```typescript
app.enableHotReload({
  enabled: true,
  watchPaths: ["src"],
  ignore: ["node_modules", "*.spec.ts"],
  debounceMs: 300,
});
```

---

## Examples

### Basic Application Setup

```typescript
import { FynixFactory } from "./core/fynix-factory";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  // Initialize application
  await app.init();

  // Start listening
  await app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
}

bootstrap();
```

### Production Setup

```typescript
async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  // Set global prefix
  app.setGlobalPrefix("/api/v1");

  // Add global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new SecurityHeadersInterceptor(),
    new CompressionInterceptor(),
    new RateLimitInterceptor()
  );

  // Initialize
  await app.init();

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();
```

### Development with Hot Reload

```typescript
async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  // Enable hot reload for development
  if (process.env.NODE_ENV === "development") {
    app.enableHotReload({
      enabled: true,
      watchPaths: ["src"],
      ignore: ["node_modules", "dist", "*.spec.ts"],
      debounceMs: 500,
    });
  }

  await app.init();
  await app.listen(3000);
}

bootstrap();
```

### Get Provider from Container

```typescript
const app = await FynixFactory.create(AppModule);
await app.init();

// Get services from DI container
const userService = app.get<UserService>(UserService);
const config = app.get<ConfigService>(ConfigService);

console.log(config.get("DATABASE_URL"));
```

### Graceful Shutdown

```typescript
async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();
  await app.listen(3000);

  // Handle shutdown signals
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, closing gracefully...");
    await app.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT received, closing gracefully...");
    await app.close();
    process.exit(0);
  });
}

bootstrap();
```

---

## Related Documentation

- [Fynix Factory](./FYNIX_FACTORY.md)
- [Module Container](./MODULE_CONTAINER.md)
- [Hot Reload](./HOT_RELOAD.md)
- [Interceptors](./INTERCEPTORS_DECORATOR.md)

---

**Last Updated**: December 4, 2025
