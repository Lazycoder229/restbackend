# Database Testing Documentation

## Overview

The DatabaseTesting module provides utilities for testing database operations with transaction rollback, fixtures, and isolated test databases in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  DatabaseTestingModule,
  useTransactionalTests,
  loadFixtures,
} from "./builtin/database-testing";
```

---

## API Reference

### `useTransactionalTests()`

Wrap each test in transaction that rolls back.

### `loadFixtures(fixtures): Promise<void>`

Load test fixtures into database.

### `clearDatabase(): Promise<void>`

Clear all tables in test database.

### `createTestDatabase(): Promise<DatabaseService>`

Create isolated test database.

---

## Examples

### Transactional Tests

```typescript
import { useTransactionalTests } from "./builtin/database-testing";

describe("User CRUD", () => {
  useTransactionalTests(); // Auto-rollback after each test

  it("should create user", async () => {
    const user = await User.create({
      name: "John",
      email: "john@example.com",
    });

    expect(user.id).toBeDefined();

    // Automatically rolled back after test
  });

  it("should update user", async () => {
    const user = await User.create({ name: "John", email: "john@example.com" });
    await user.update({ name: "Jane" });

    expect(user.name).toBe("Jane");

    // Automatically rolled back after test
  });
});
```

### Using Fixtures

```typescript
import { loadFixtures } from "./builtin/database-testing";

const fixtures = {
  users: [
    { name: "John", email: "john@example.com" },
    { name: "Jane", email: "jane@example.com" },
  ],
  posts: [
    { title: "Post 1", authorId: 1 },
    { title: "Post 2", authorId: 1 },
  ],
};

describe("User Posts", () => {
  beforeEach(async () => {
    await loadFixtures(fixtures);
  });

  it("should get user posts", async () => {
    const user = await User.findById(1);
    const posts = await user.posts;

    expect(posts).toHaveLength(2);
  });
});
```

### Isolated Test Database

```typescript
import { createTestDatabase } from "./builtin/database-testing";

describe("Integration Tests", () => {
  let testDb: DatabaseService;

  beforeAll(async () => {
    testDb = await createTestDatabase();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it("should perform operations", async () => {
    // Operations on isolated test database
  });
});
```

---

## Related Documentation

- [Testing Module](./TESTING_MODULE.md)
- [Database Service](./DATABASE_SERVICE.md)
- [Seeders Service](./SEEDERS_SERVICE.md)

---

**Last Updated**: December 4, 2025
