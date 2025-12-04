# Test Assertions Documentation

## Overview

The TestAssertions module provides custom assertion helpers and matchers for testing Fynix applications with improved error messages and type safety.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { expect, assert } from "./builtin/test-assertions";
```

---

## API Reference

### `expect(value).toBeEntity(EntityClass)`

Assert value is instance of entity.

### `expect(value).toHaveProperty(property, value)`

Assert object has property with value.

### `expect(response).toBeHttpSuccess()`

Assert HTTP response is successful (200-299).

### `expect(response).toBeHttpError(status)`

Assert HTTP response has specific error status.

### `expect(value).toMatchSchema(schema)`

Assert value matches JSON schema.

---

## Examples

### Entity Assertions

```typescript
import { expect } from "./builtin/test-assertions";

describe("User Entity", () => {
  it("should create user entity", async () => {
    const user = await User.create({
      name: "John",
      email: "john@example.com",
    });

    expect(user).toBeEntity(User);
    expect(user).toHaveProperty("id");
    expect(user.name).toBe("John");
  });
});
```

### HTTP Response Assertions

```typescript
describe("API Endpoints", () => {
  it("should return successful response", async () => {
    const response = await request(app).get("/users").expect(200);

    expect(response).toBeHttpSuccess();
    expect(response.body).toBeArray();
  });

  it("should return 404 for missing user", async () => {
    const response = await request(app).get("/users/999").expect(404);

    expect(response).toBeHttpError(404);
    expect(response.body).toHaveProperty("message");
  });
});
```

### Schema Validation

```typescript
const userSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    email: { type: "string", format: "email" },
  },
  required: ["id", "name", "email"],
};

it("should match user schema", () => {
  const user = { id: 1, name: "John", email: "john@example.com" };
  expect(user).toMatchSchema(userSchema);
});
```

---

## Related Documentation

- [Testing Module](./TESTING_MODULE.md)
- [Database Testing](./DATABASE_TESTING.md)

---

**Last Updated**: December 4, 2025
