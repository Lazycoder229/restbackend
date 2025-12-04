# Module Container Documentation

## Overview

The ModuleContainer manages module scanning, provider registration, dependency resolution across modules, and database initialization in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { ModuleContainer } from "./core/module-container";
```

---

## API Reference

### `scanModule(module): Promise<Container>`

Scan and register a module with all its imports, providers, and controllers.

### `getModuleContainer(module): Container | undefined`

Get the DI container for a specific module.

### `getControllers(): any[]`

Get all controllers from all registered modules.

### `resolve<T>(provider, fromModule?): T`

Resolve a provider from the appropriate module container.

### `initializeDatabase(): void`

Initialize database connection for BaseEntity (optional).

---

## Examples

### Basic Module Scanning

```typescript
import { ModuleContainer } from "./core/module-container";

@Module({
  controllers: [UserController],
  providers: [UserService, DatabaseService],
})
class AppModule {}

const moduleContainer = new ModuleContainer();
await moduleContainer.scanModule(AppModule);

// Get all controllers
const controllers = moduleContainer.getControllers();
console.log("Controllers:", controllers);
```

### Resolving Providers

```typescript
@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
})
class AppModule {}

const moduleContainer = new ModuleContainer();
await moduleContainer.scanModule(AppModule);

// Resolve provider from any module
const userService = moduleContainer.resolve<UserService>(UserService);
const databaseService =
  moduleContainer.resolve<DatabaseService>(DatabaseService);
```

### Module with Imports

```typescript
@Module({
  providers: [DatabaseService, ConfigService],
})
class DatabaseModule {}

@Module({
  providers: [AuthService, JwtService],
})
class AuthModule {}

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UserController, AuthController],
  providers: [UserService],
})
class AppModule {}

const moduleContainer = new ModuleContainer();
await moduleContainer.scanModule(AppModule);

// All providers from all modules are available
const userService = moduleContainer.resolve<UserService>(UserService);
const authService = moduleContainer.resolve<AuthService>(AuthService);
const dbService = moduleContainer.resolve<DatabaseService>(DatabaseService);
```

### Database Initialization

```typescript
@Module({
  providers: [DatabaseService],
  controllers: [],
})
class DatabaseModule {}

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
})
class AppModule {}

const moduleContainer = new ModuleContainer();
await moduleContainer.scanModule(AppModule);

// Initialize database for BaseEntity
moduleContainer.initializeDatabase();

// Now entities can use BaseEntity methods
const user = await User.findById(1);
```

### Complete Application Setup

```typescript
@Module({
  providers: [ConfigService],
})
class ConfigModule {}

@Module({
  imports: [ConfigModule],
  providers: [DatabaseService],
})
class DatabaseModule {}

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [CacheService, LoggerService],
})
class CoreModule {}

@Module({
  imports: [CoreModule],
  controllers: [UserController, PostController],
  providers: [UserService, PostService],
})
class AppModule {}

async function bootstrap() {
  const moduleContainer = new ModuleContainer();

  // Scan all modules recursively
  await moduleContainer.scanModule(AppModule);

  // Initialize database
  moduleContainer.initializeDatabase();

  // Get all controllers for routing
  const controllers = moduleContainer.getControllers();
  console.log("Registered controllers:", controllers.length);

  // Resolve any service
  const userService = moduleContainer.resolve<UserService>(UserService);
  const config = moduleContainer.resolve<ConfigService>(ConfigService);
}

bootstrap();
```

### Module-Specific Resolution

```typescript
const moduleContainer = new ModuleContainer();
await moduleContainer.scanModule(AppModule);

// Get specific module's container
const appContainer = moduleContainer.getModuleContainer(AppModule);

if (appContainer) {
  const userService = appContainer.resolve<UserService>(UserService);
}

// Or resolve from specific module
const userService = moduleContainer.resolve<UserService>(
  UserService,
  AppModule
);
```

---

## Related Documentation

- [Module Decorator](./MODULE_DECORATOR.md)
- [Container](./CONTAINER.md)
- [Injectable Decorator](./INJECTABLE_DECORATOR.md)
- [Database Service](./DATABASE_SERVICE.md)

---

**Last Updated**: December 4, 2025
