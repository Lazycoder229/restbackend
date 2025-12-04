# Container (DI Container) Documentation

## Overview

The Container class is the core Dependency Injection (DI) container that manages provider instances, resolves dependencies, and handles lifecycle scopes (singleton/transient) in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Scopes](#scopes)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { Container } from "./core/container";
```

---

## API Reference

### `addProvider(provider): void`

Register a provider in the container.

### `resolve<T>(provider): T`

Get or create an instance of a provider with dependency injection.

### `has(provider): boolean`

Check if a provider is registered in the container.

### `clear(): void`

Clear all instances and providers (useful for testing).

### `getProviders(): Provider[]`

Get all registered providers.

---

## Scopes

### Singleton (Default)

Single instance shared across the application.

```typescript
@Injectable()
export class UserService {
  // Singleton by default
}
```

### Transient

New instance created for each injection.

```typescript
@Injectable({ scope: Scope.TRANSIENT })
export class RequestLogger {
  // New instance per injection
}
```

---

## Examples

### Basic Dependency Injection

```typescript
import { Container } from "./core/container";
import { Injectable } from "./decorators/injectable.decorator";

@Injectable()
class DatabaseService {
  connect() {
    console.log("Connected to database");
  }
}

@Injectable()
class UserService {
  constructor(private db: DatabaseService) {}

  getUsers() {
    this.db.connect();
    return ["User1", "User2"];
  }
}

// Create container and register providers
const container = new Container();
container.addProvider(DatabaseService);
container.addProvider(UserService);

// Resolve with automatic dependency injection
const userService = container.resolve<UserService>(UserService);
console.log(userService.getUsers());
```

### Transient Scope

```typescript
@Injectable({ scope: Scope.TRANSIENT })
class RequestLogger {
  private requestId = Math.random();

  log(message: string) {
    console.log(`[${this.requestId}] ${message}`);
  }
}

@Injectable()
class ApiService {
  constructor(private logger: RequestLogger) {}

  handleRequest() {
    this.logger.log("Handling request");
  }
}

const container = new Container();
container.addProvider(RequestLogger);
container.addProvider(ApiService);

// Each ApiService instance gets a new RequestLogger
const api1 = container.resolve<ApiService>(ApiService);
const api2 = container.resolve<ApiService>(ApiService);

api1.handleRequest(); // Different requestId
api2.handleRequest(); // Different requestId
```

### Testing with Container

```typescript
describe("UserService", () => {
  let container: Container;
  let userService: UserService;

  beforeEach(() => {
    container = new Container();
    container.addProvider(DatabaseService);
    container.addProvider(UserService);

    userService = container.resolve(UserService);
  });

  afterEach(() => {
    container.clear();
  });

  it("should get users", () => {
    const users = userService.getUsers();
    expect(users).toHaveLength(2);
  });
});
```

---

## Related Documentation

- [Injectable Decorator](./INJECTABLE_DECORATOR.md)
- [Module Decorator](./MODULE_DECORATOR.md)
- [Module Container](./MODULE_CONTAINER.md)

---

**Last Updated**: December 4, 2025
