# Fynix Factory Documentation

## Overview

The FynixFactory is a static factory class that provides a simple API for bootstrapping and creating Fynix application instances.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { FynixFactory } from "./core/fynix-factory";
```

---

## API Reference

### `static create(module): Promise<FynixApplication>`

Create a Fynix application instance from a root module.

**Parameters:**

- `module` - Root module class decorated with @Module()

**Returns:**

- Promise resolving to FynixApplication instance

---

## Examples

### Basic Usage

```typescript
import { FynixFactory } from "./core/fynix-factory";
import { AppModule } from "./app.module";

async function bootstrap() {
  // Create application
  const app = await FynixFactory.create(AppModule);

  // Initialize and start
  await app.init();
  await app.listen(3000);
}

bootstrap();
```

### With Configuration

```typescript
@Module({
  imports: [],
  controllers: [UserController, PostController],
  providers: [UserService, PostService, DatabaseService],
})
export class AppModule {}

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  // Configure before init
  app.setGlobalPrefix("/api");
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.init();
  await app.listen(3000, () => {
    console.log("Application started on port 3000");
  });
}

bootstrap();
```

### Multiple Applications

```typescript
// API Application
async function startApiApp() {
  const apiApp = await FynixFactory.create(ApiModule);
  apiApp.setGlobalPrefix("/api");
  await apiApp.init();
  await apiApp.listen(3000);
}

// Admin Application
async function startAdminApp() {
  const adminApp = await FynixFactory.create(AdminModule);
  adminApp.setGlobalPrefix("/admin");
  await adminApp.init();
  await adminApp.listen(3001);
}

async function bootstrap() {
  await Promise.all([startApiApp(), startAdminApp()]);
}

bootstrap();
```

### Testing Application

```typescript
import { FynixFactory } from "./core/fynix-factory";
import { TestingModule } from "./app.test.module";

describe("Application E2E Tests", () => {
  let app: FynixApplication;

  beforeAll(async () => {
    app = await FynixFactory.create(TestingModule);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should handle requests", async () => {
    const userService = app.get<UserService>(UserService);
    const users = await userService.findAll();
    expect(users).toBeDefined();
  });
});
```

---

## Related Documentation

- [Fynix Application](./FYNIX_APPLICATION.md)
- [Module Decorator](./MODULE_DECORATOR.md)
- [Getting Started](./DOCSMED/00-GETTING_STARTED.md)

---

**Last Updated**: December 4, 2025
