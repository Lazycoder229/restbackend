# Hot Reload Documentation

## Overview

The HotReloadManager provides automatic application reloading during development when source files change, eliminating the need to manually restart the server.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { HotReloadManager, HotReloadOptions } from "./core/hot-reload";
```

---

## Configuration

```typescript
interface HotReloadOptions {
  enabled?: boolean; // Enable/disable hot reload
  watchPaths?: string[]; // Paths to watch (default: ['src'])
  ignore?: string[]; // Patterns to ignore
  debounceMs?: number; // Debounce delay (default: 300ms)
  onReload?: () => void; // Custom reload callback
}
```

---

## API Reference

### `start(): void`

Start watching for file changes.

### `stop(): void`

Stop watching and cleanup watchers.

---

## Examples

### Enable in Application

```typescript
import { FynixFactory } from "./core/fynix-factory";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  // Enable hot reload in development
  if (process.env.NODE_ENV === "development") {
    app.enableHotReload({
      enabled: true,
      watchPaths: ["src"],
      ignore: ["node_modules", "dist", "*.spec.ts", "*.test.ts"],
      debounceMs: 300,
    });
  }

  await app.init();
  await app.listen(3000);
}

bootstrap();
```

### Custom Configuration

```typescript
app.enableHotReload({
  enabled: true,
  watchPaths: ["src", "config"],
  ignore: [
    "node_modules",
    "dist",
    ".git",
    "*.log",
    "*.spec.ts",
    "*.test.ts",
    "coverage",
  ],
  debounceMs: 500,
  onReload: () => {
    console.log("🔄 Custom reload logic executed");
  },
});
```

### Conditional Hot Reload

```typescript
const isDevelopment = process.env.NODE_ENV === "development";
const isWatch = process.argv.includes("--watch");

if (isDevelopment || isWatch) {
  app.enableHotReload({
    enabled: true,
    watchPaths: ["src"],
    debounceMs: 300,
  });
}
```

### Manual Hot Reload Manager

```typescript
import { HotReloadManager } from "./core/hot-reload";

const hotReload = new HotReloadManager(
  {
    enabled: true,
    watchPaths: ["src"],
    ignore: ["node_modules", "*.spec.ts"],
    debounceMs: 300,
    onReload: () => {
      console.log("Reloading application...");
    },
  },
  async () => {
    // Restart callback
    await app.close();
    await bootstrap();
  }
);

hotReload.start();

// Stop when needed
process.on("SIGINT", () => {
  hotReload.stop();
  process.exit(0);
});
```

### Development Script

```typescript
// dev.ts
import { FynixFactory } from "./core/fynix-factory";
import { AppModule } from "./app.module";

async function startDevelopment() {
  console.log("🚀 Starting development server...");

  const app = await FynixFactory.create(AppModule);

  // Development features
  app.enableHotReload({
    enabled: true,
    watchPaths: ["src"],
    ignore: ["node_modules", "dist", "*.spec.ts"],
    debounceMs: 500,
    onReload: () => {
      console.log("♻️  Changes detected - reloading...");
    },
  });

  await app.init();
  await app.listen(3000, () => {
    console.log("✅ Development server running on http://localhost:3000");
    console.log("🔥 Hot reload enabled - watching for changes...");
  });
}

startDevelopment().catch(console.error);
```

### package.json Scripts

```json
{
  "scripts": {
    "start": "node dist/main.js",
    "start:dev": "ts-node-dev --respawn --transpile-only src/main.ts",
    "dev": "NODE_ENV=development ts-node src/dev.ts",
    "build": "tsc",
    "watch": "tsc --watch"
  }
}
```

---

## Related Documentation

- [Fynix Application](./FYNIX_APPLICATION.md)
- [CLI](./CLI.md)
- [Getting Started](./DOCSMED/00-GETTING_STARTED.md)

---

**Last Updated**: December 4, 2025
