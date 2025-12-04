# Pipes Decorator Documentation

## Overview

The Pipes Decorator in the Fynix framework enables data transformation and validation before it reaches route handlers. Pipes are executed after guards and interceptors, making them ideal for validating and transforming incoming request data.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Creating Pipes](#creating-pipes)
- [Usage Examples](#usage-examples)
- [Execution Order](#execution-order)
- [Best Practices](#best-practices)
- [Common Use Cases](#common-use-cases)
- [Advanced Patterns](#advanced-patterns)
- [Troubleshooting](#troubleshooting)

---

## Installation & Setup

```typescript
import "reflect-metadata";
import { UsePipes } from "./decorators/pipes.decorator";
```

---

## Basic Usage

Apply pipes at the method or class level:

```typescript
@Controller("/api/users")
@UsePipes(ValidationPipe)
export class UserController {
  @Post("/")
  createUser(@Body() userData: any) {
    return { created: true, user: userData };
  }

  @Put("/:id")
  @UsePipes(TransformPipe) // Additional pipe for this route
  updateUser(@Param("id") id: string, @Body() userData: any) {
    return { updated: true, id, user: userData };
  }
}
```

---

## API Reference

### @UsePipes

**Signature:**

```typescript
@UsePipes(...pipes: any[]): MethodDecorator & ClassDecorator
```

**Parameters:**

- `...pipes` - One or more pipe classes to apply

**Returns:** Combined method and class decorator

**Metadata Key:** `PIPES_METADATA`

**Scope:**

- **Class-level**: Applies to all routes in the controller
- **Method-level**: Applies only to the specific route

**Example:**

```typescript
@UsePipes(ValidationPipe, TransformPipe, SanitizationPipe)
```

---

## Creating Pipes

Pipes implement a `transform` method that processes input data:

```typescript
import { Injectable } from "./decorators/injectable.decorator";

@Injectable()
export class ValidationPipe {
  transform(value: any, metadata: any): any {
    // Validate the value
    if (!this.isValid(value)) {
      throw new Error("Validation failed");
    }
    return value;
  }

  private isValid(value: any): boolean {
    // Validation logic
    return value !== null && value !== undefined;
  }
}
```

---

## Usage Examples

### Validation Pipe

```typescript
@Injectable()
export class ValidationPipe {
  transform(value: any, metadata: any): any {
    const { type, data } = metadata;

    // Skip validation for certain types
    if (type === "req" || type === "res") {
      return value;
    }

    // Validate body
    if (type === "body") {
      if (!value || typeof value !== "object") {
        throw new Error("Invalid request body");
      }

      // Check required fields
      const requiredFields = ["email", "password"];
      for (const field of requiredFields) {
        if (!value[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
    }

    return value;
  }
}

// Usage
@Controller("/api/auth")
export class AuthController {
  @Post("/register")
  @UsePipes(ValidationPipe)
  register(@Body() userData: any) {
    return { registered: true, user: userData };
  }
}
```

### Transform Pipe

```typescript
@Injectable()
export class TransformPipe {
  transform(value: any, metadata: any): any {
    const { type } = metadata;

    if (type === "param" || type === "query") {
      // Convert string numbers to actual numbers
      if (typeof value === "string" && !isNaN(Number(value))) {
        return Number(value);
      }

      // Convert string booleans
      if (value === "true") return true;
      if (value === "false") return false;
    }

    if (type === "body") {
      // Trim string values
      return this.trimStrings(value);
    }

    return value;
  }

  private trimStrings(obj: any): any {
    if (typeof obj === "string") {
      return obj.trim();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.trimStrings(item));
    }

    if (obj && typeof obj === "object") {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.trimStrings(obj[key]);
      }
      return result;
    }

    return obj;
  }
}

// Usage
@Controller("/api/users")
export class UserController {
  @Get("/:id")
  @UsePipes(TransformPipe)
  getUser(@Param("id") id: number) {
    // Will be number, not string
    return { user: { id } };
  }

  @Post("/")
  @UsePipes(TransformPipe)
  createUser(@Body() userData: any) {
    // Strings will be trimmed
    return { created: true, user: userData };
  }
}
```

### Sanitization Pipe

```typescript
@Injectable()
export class SanitizationPipe {
  transform(value: any, metadata: any): any {
    const { type } = metadata;

    if (type === "body" || type === "query") {
      return this.sanitize(value);
    }

    return value;
  }

  private sanitize(obj: any): any {
    if (typeof obj === "string") {
      // Remove HTML tags
      return obj.replace(/<[^>]*>/g, "");
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    if (obj && typeof obj === "object") {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.sanitize(obj[key]);
      }
      return result;
    }

    return obj;
  }
}

// Usage
@Controller("/api/posts")
@UsePipes(SanitizationPipe)
export class PostController {
  @Post("/")
  createPost(@Body() postData: any) {
    // HTML will be removed from strings
    return { created: true, post: postData };
  }
}
```

### Parse Int Pipe

```typescript
@Injectable()
export class ParseIntPipe {
  transform(value: any, metadata: any): number {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new Error(`${metadata.data} must be a valid number`);
    }

    return val;
  }
}

// Usage
@Controller("/api/users")
export class UserController {
  @Get("/:id")
  getUser(@Param("id") @UsePipes(ParseIntPipe) id: number) {
    return { user: { id } };
  }

  @Get("/")
  listUsers(
    @Query("page") @UsePipes(ParseIntPipe) page: number = 1,
    @Query("limit") @UsePipes(ParseIntPipe) limit: number = 10
  ) {
    return { page, limit, users: [] };
  }
}
```

### Schema Validation Pipe

```typescript
interface ValidationSchema {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object" | "array";
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
}

@Injectable()
export class SchemaValidationPipe {
  constructor(private schema: ValidationSchema) {}

  transform(value: any, metadata: any): any {
    if (metadata.type !== "body") {
      return value;
    }

    const errors: string[] = [];

    for (const [field, rules] of Object.entries(this.schema)) {
      const fieldValue = value[field];

      // Check required
      if (rules.required && (fieldValue === undefined || fieldValue === null)) {
        errors.push(`${field} is required`);
        continue;
      }

      if (fieldValue !== undefined && fieldValue !== null) {
        // Check type
        if (typeof fieldValue !== rules.type) {
          errors.push(`${field} must be a ${rules.type}`);
        }

        // Check string length
        if (rules.type === "string") {
          if (rules.minLength && fieldValue.length < rules.minLength) {
            errors.push(
              `${field} must be at least ${rules.minLength} characters`
            );
          }
          if (rules.maxLength && fieldValue.length > rules.maxLength) {
            errors.push(
              `${field} must be at most ${rules.maxLength} characters`
            );
          }
          if (rules.pattern && !rules.pattern.test(fieldValue)) {
            errors.push(`${field} has invalid format`);
          }
        }

        // Check number range
        if (rules.type === "number") {
          if (rules.min !== undefined && fieldValue < rules.min) {
            errors.push(`${field} must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && fieldValue > rules.max) {
            errors.push(`${field} must be at most ${rules.max}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    return value;
  }
}

// Usage
const userSchema: ValidationSchema = {
  email: {
    type: "string",
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: "string",
    required: true,
    minLength: 8,
  },
  age: {
    type: "number",
    min: 18,
    max: 120,
  },
};

@Controller("/api/users")
export class UserController {
  @Post("/")
  @UsePipes(new SchemaValidationPipe(userSchema))
  createUser(@Body() userData: any) {
    return { created: true, user: userData };
  }
}
```

### Default Value Pipe

```typescript
@Injectable()
export class DefaultValuePipe {
  constructor(private defaultValue: any) {}

  transform(value: any, metadata: any): any {
    if (value === undefined || value === null || value === "") {
      return this.defaultValue;
    }
    return value;
  }
}

// Usage
@Controller("/api/search")
export class SearchController {
  @Get("/products")
  search(
    @Query("q") query: string,
    @Query("page") @UsePipes(new DefaultValuePipe(1)) page: number,
    @Query("limit") @UsePipes(new DefaultValuePipe(10)) limit: number
  ) {
    return { query, page, limit, results: [] };
  }
}
```

### Uppercase Transform Pipe

```typescript
@Injectable()
export class UppercasePipe {
  transform(value: any, metadata: any): any {
    if (typeof value === "string") {
      return value.toUpperCase();
    }
    return value;
  }
}

// Usage
@Controller("/api/codes")
export class CodeController {
  @Get("/:code")
  getByCode(@Param("code") @UsePipes(UppercasePipe) code: string) {
    // code will be uppercase
    return { code, data: {} };
  }
}
```

---

## Execution Order

### Class-Level and Method-Level Pipes

```typescript
@Controller("/api/users")
@UsePipes(Pipe1, Pipe2) // Execute first
export class UserController {
  @Post("/")
  @UsePipes(Pipe3, Pipe4) // Execute second
  createUser(@Body() userData: any) {
    return { created: true };
  }
}
```

**Execution Order:** Pipe1 → Pipe2 → Pipe3 → Pipe4 → Handler

### Pipes with Guards and Interceptors

**Full Request Flow:**

1. Guards
2. Interceptors (before)
3. **Pipes**
4. Route Handler
5. Interceptors (after)

---

## Best Practices

### 1. Keep Pipes Focused

```typescript
// Good - single responsibility
@Injectable()
export class ValidationPipe {
  transform(value: any, metadata: any) {
    // Only validates
  }
}

@Injectable()
export class TransformPipe {
  transform(value: any, metadata: any) {
    // Only transforms
  }
}

// Avoid - multiple responsibilities
@Injectable()
export class MegaPipe {
  transform(value: any, metadata: any) {
    // Validates, transforms, sanitizes, logs...
  }
}
```

### 2. Throw Meaningful Errors

```typescript
// Good
@Injectable()
export class ValidationPipe {
  transform(value: any, metadata: any) {
    if (!value.email) {
      throw new Error("Email is required");
    }
    if (!this.isValidEmail(value.email)) {
      throw new Error("Email format is invalid");
    }
    return value;
  }
}

// Avoid - vague errors
@Injectable()
export class ValidationPipe {
  transform(value: any, metadata: any) {
    if (!this.isValid(value)) {
      throw new Error("Invalid data");
    }
    return value;
  }
}
```

### 3. Return Transformed Value

```typescript
// Good
@Injectable()
export class TransformPipe {
  transform(value: any, metadata: any) {
    return this.transformValue(value); // Return transformed
  }
}

// Avoid - forgetting to return
@Injectable()
export class TransformPipe {
  transform(value: any, metadata: any) {
    this.transformValue(value); // Forgot to return!
  }
}
```

### 4. Use Type Guards

```typescript
@Injectable()
export class SafePipe {
  transform(value: any, metadata: any) {
    if (typeof value === "string") {
      return value.trim();
    }

    if (typeof value === "number") {
      return Math.abs(value);
    }

    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    return value;
  }
}
```

### 5. Apply at Appropriate Level

```typescript
// Good - validation for all routes
@Controller("/api/users")
@UsePipes(ValidationPipe)
export class UserController {
  // All routes validated
}

// Good - specific pipe for specific route
@Controller("/api/posts")
export class PostController {
  @Post("/")
  @UsePipes(SlugGenerationPipe) // Only this route
  createPost() {}
}
```

### 6. Test Pipes Thoroughly

```typescript
describe("ValidationPipe", () => {
  it("should validate required fields", () => {
    const pipe = new ValidationPipe();
    const metadata = { type: "body", data: undefined };

    expect(() => {
      pipe.transform({}, metadata);
    }).toThrow("Validation failed");
  });

  it("should pass valid data", () => {
    const pipe = new ValidationPipe();
    const metadata = { type: "body", data: undefined };
    const validData = { email: "test@test.com", password: "12345678" };

    const result = pipe.transform(validData, metadata);
    expect(result).toEqual(validData);
  });
});
```

---

## Common Use Cases

### Request Body Validation

```typescript
@Controller("/api/auth")
@UsePipes(ValidationPipe, SanitizationPipe)
export class AuthController {
  @Post("/register")
  register(@Body() userData: any) {
    return { registered: true };
  }

  @Post("/login")
  login(@Body() credentials: any) {
    return { token: "jwt_token" };
  }
}
```

### Data Transformation

```typescript
@Controller("/api/users")
@UsePipes(TransformPipe)
export class UserController {
  @Get("/")
  listUsers(
    @Query("page") page: number, // Transformed to number
    @Query("limit") limit: number // Transformed to number
  ) {
    return { page, limit, users: [] };
  }
}
```

### Input Sanitization

```typescript
@Controller("/api/posts")
@UsePipes(SanitizationPipe)
export class PostController {
  @Post("/")
  createPost(@Body() postData: any) {
    // HTML tags removed from input
    return { created: true, post: postData };
  }
}
```

---

## Advanced Patterns

### Parameterized Pipes

```typescript
export function Validate(schema: any) {
  return UsePipes(class {
    transform(value: any, metadata: any) {
      // Validate against schema
      return value;
    }
  });
}

// Usage
@Post('/users')
@Validate(userSchema)
createUser(@Body() userData: any) { }
```

### Async Pipes

```typescript
@Injectable()
export class AsyncValidationPipe {
  constructor(private userService: UserService) {}

  async transform(value: any, metadata: any): Promise<any> {
    if (metadata.type === "body" && value.email) {
      const exists = await this.userService.emailExists(value.email);
      if (exists) {
        throw new Error("Email already exists");
      }
    }
    return value;
  }
}
```

### Conditional Pipes

```typescript
@Injectable()
export class ConditionalPipe {
  transform(value: any, metadata: any) {
    // Only transform POST requests
    if (metadata.type === "body") {
      return this.transformBody(value);
    }
    return value;
  }
}
```

---

## Troubleshooting

### Pipe Not Executing

**Problem:** Pipe doesn't seem to run

**Solution:** Ensure pipe is decorated with @Injectable() and applied correctly

### Validation Not Working

**Problem:** Invalid data passes through

**Solution:** Check pipe logic and ensure errors are thrown

### Type Conversion Issues

**Problem:** Values not converting correctly

**Solution:** Implement proper type checking and conversion logic

---

## Related Documentation

- [Parameter Decorators](./PARAMS_DECORATOR.md)
- [Guards](./GUARDS_DECORATOR.md)
- [Interceptors](./INTERCEPTORS_DECORATOR.md)
- [Validation](./DOCSMED/08-VALIDATION_PIPES.md)

---

**Last Updated**: December 4, 2025
