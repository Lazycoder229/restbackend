# Testing Module Documentation

## Overview

The TestingModule provides utilities for creating test instances of Fynix modules with dependency injection, mocking, and isolated test environments.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { TestingModule, createTestingModule } from "./builtin/testing.module";
```

---

## API Reference

### `createTestingModule(metadata): TestingModule`

Create isolated testing module.

### `module.get<T>(token): T`

Get provider instance from test module.

### `module.close(): Promise<void>`

Close test module and cleanup resources.

---

## Examples

### Unit Testing Controllers

```typescript
import { createTestingModule } from "./builtin/testing.module";

describe("UserController", () => {
  let module: TestingModule;
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    module = await createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn(),
          },
        },
      ],
    });

    controller = module.get(UserController);
    service = module.get(UserService);
  });

  afterEach(async () => {
    await module.close();
  });

  it("should return users", async () => {
    const users = await controller.getUsers();
    expect(users).toEqual([]);
    expect(service.findAll).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
describe("UserService Integration", () => {
  let module: TestingModule;
  let service: UserService;

  beforeEach(async () => {
    module = await createTestingModule({
      providers: [UserService, DatabaseService, ConfigService],
    });

    service = module.get(UserService);
  });

  afterEach(async () => {
    await module.close();
  });

  it("should create user", async () => {
    const user = await service.create({
      name: "John",
      email: "john@example.com",
    });

    expect(user.id).toBeDefined();
    expect(user.name).toBe("John");
  });
});
```

---

## Related Documentation

- [Test Assertions](./TEST_ASSERTIONS.md)
- [Database Testing](./DATABASE_TESTING.md)

---

**Last Updated**: December 4, 2025
