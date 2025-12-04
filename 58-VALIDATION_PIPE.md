# Validation Pipe Documentation

## Overview

The ValidationPipe provides comprehensive input validation with built-in validators, custom validation rules, and automatic type transformation for Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Built-in Validators](#built-in-validators)
- [Validation Decorators](#validation-decorators)
- [API Reference](#api-reference)
- [Custom Validators](#custom-validators)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  ValidationPipe,
  IsString,
  IsEmail,
  MinLength,
} from "./builtin/validation.pipe";
```

---

## Built-in Validators

| Validator    | Description                 |
| ------------ | --------------------------- |
| `IsString`   | Value must be a string      |
| `IsNumber`   | Value must be a number      |
| `IsInt`      | Value must be an integer    |
| `IsBoolean`  | Value must be a boolean     |
| `IsEmail`    | Value must be a valid email |
| `IsURL`      | Value must be a valid URL   |
| `IsNotEmpty` | Value should not be empty   |
| `MinLength`  | String minimum length       |
| `MaxLength`  | String maximum length       |
| `Min`        | Number minimum value        |
| `Max`        | Number maximum value        |
| `IsArray`    | Value must be an array      |
| `IsObject`   | Value must be an object     |

---

## Validation Decorators

### String Validators

```typescript
class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsURL()
  website?: string;
}
```

### Number Validators

```typescript
class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  price: number;

  @IsInt()
  @Min(0)
  stock: number;
}
```

### Other Validators

```typescript
class UpdateSettingsDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  tags: string[];

  @IsObject()
  metadata: Record<string, any>;
}
```

---

## API Reference

### ValidationService

#### Static Methods

##### `isString(value: any): boolean`

```typescript
ValidationService.isString("hello"); // true
ValidationService.isString(123); // false
```

##### `isNumber(value: any): boolean`

```typescript
ValidationService.isNumber(123); // true
ValidationService.isNumber("123"); // false
```

##### `isEmail(value: string): boolean`

```typescript
ValidationService.isEmail("user@example.com"); // true
ValidationService.isEmail("invalid"); // false
```

##### `minLength(value: string, min: number): boolean`

```typescript
ValidationService.minLength("hello", 3); // true
ValidationService.minLength("hi", 3); // false
```

##### `maxLength(value: string, max: number): boolean`

```typescript
ValidationService.maxLength("hello", 10); // true
ValidationService.maxLength("hello world", 5); // false
```

---

## Custom Validators

### Creating Custom Validator

```typescript
export function IsStrongPassword(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      (value: string) => {
        return (
          value.length >= 8 &&
          /[A-Z]/.test(value) &&
          /[a-z]/.test(value) &&
          /[0-9]/.test(value)
        );
      },
      message || `${propertyKey} must be a strong password`,
      "IsStrongPassword"
    );
  };
}

// Usage
class RegisterDto {
  @IsStrongPassword()
  password: string;
}
```

### Custom Validation Logic

```typescript
export function IsUnique(repository: string, field: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      async (value: any) => {
        const repo = Container.get(repository);
        const existing = await repo.findOneBy(field, value);
        return !existing;
      },
      `${propertyKey} already exists`,
      "IsUnique"
    );
  };
}

// Usage
class CreateUserDto {
  @IsEmail()
  @IsUnique("UserRepository", "email")
  email: string;
}
```

---

## Best Practices

### 1. Validate at Entry Points

```typescript
@Controller("/users")
export class UserController {
  @Post()
  @UsePipes(new ValidationPipe())
  async createUser(@Body() data: CreateUserDto) {
    return await this.userService.create(data);
  }
}
```

### 2. Use DTOs for Validation

```typescript
// Good - separate DTO classes
class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}

class UpdateUserDto {
  @IsString()
  name?: string;

  @IsEmail()
  email?: string;
}
```

### 3. Combine Multiple Validators

```typescript
class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(50)
  content: string;
}
```

### 4. Provide Clear Error Messages

```typescript
class RegisterDto {
  @IsEmail("Please provide a valid email address")
  email: string;

  @MinLength(8, "Password must be at least 8 characters long")
  password: string;
}
```

---

## Examples

### Complete DTO Validation

```typescript
class CreateOrderDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsArray()
  @IsNotEmpty()
  items: OrderItemDto[];

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  shippingAddress: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;
}

class OrderItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}
```

### Controller with Validation

```typescript
@Controller("/api/products")
export class ProductController {
  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() data: CreateProductDto) {
    return await this.productService.create(data);
  }

  @Put("/:id")
  @UsePipes(new ValidationPipe())
  async update(@Param("id") id: number, @Body() data: UpdateProductDto) {
    return await this.productService.update(id, data);
  }
}

class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsArray()
  categories: string[];
}
```

---

## Related Documentation

- [Pipes Decorator](./PIPES_DECORATOR.md)
- [Transform Pipes](./TRANSFORM_PIPES.md)
- [Sanitization Pipes](./SANITIZATION_PIPES.md)
- [Controllers](./CONTROLLER_DECORATOR.md)

---

**Last Updated**: December 4, 2025
