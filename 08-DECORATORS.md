# Decorators Reference

Complete reference for all FynixJS decorators. FynixJS uses a NestJS-inspired decorator system for clean, declarative code.

---

## 📋 Table of Contents

- [Class Decorators](#class-decorators)
- [Method Decorators](#method-decorators)
- [Parameter Decorators](#parameter-decorators)
- [Property Decorators](#property-decorators)
- [Quick Reference](#quick-reference)

---

## 🏷️ Class Decorators

### @Module()

Defines a module with its dependencies and providers.

```typescript
@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

**Options:**

- `imports` - Other modules to import
- `controllers` - HTTP controllers
- `providers` - Injectable services
- `exports` - Providers to share with other modules

---

### @Controller()

Marks a class as a controller and sets the base route path.

```typescript
@Controller("/users")
export class UserController {}

@Controller("/api/v1/products")
export class ProductController {}
```

**Parameters:**

- `path` (string) - Base path for all routes in this controller

---

### @Injectable()

Marks a class as a provider that can be injected.

```typescript
@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}
}
```

**Options:**

```typescript
@Injectable({ scope: Scope.SINGLETON }) // Default
export class SingletonService {}

@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {}
```

---

### @Entity()

Marks a class as a database entity (Active Record pattern).

```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
```

**Parameters:**

- `tableName` (string) - Database table name
- `options` (object) - Additional options like `primaryKey`

```typescript
@Entity("users", { primaryKey: "userId" })
export class User extends BaseEntity {}
```

---

## 🔧 Method Decorators

### HTTP Method Decorators

Mark methods as route handlers for specific HTTP methods.

#### @Get()

```typescript
@Get()
findAll() {}

@Get("/active")
findActive() {}

@Get("/:id")
findOne(@Param("id") id: string) {}
```

#### @Post()

```typescript
@Post()
create(@Body() body: any) {}

@Post("/bulk")
createMany(@Body() items: any[]) {}
```

#### @Put()

```typescript
@Put("/:id")
update(@Param("id") id: string, @Body() body: any) {}
```

#### @Patch()

```typescript
@Patch("/:id")
partialUpdate(@Param("id") id: string, @Body() body: any) {}
```

#### @Delete()

```typescript
@Delete("/:id")
remove(@Param("id") id: string) {}
```

#### @Options()

```typescript
@Options()
getOptions() {}
```

#### @Head()

```typescript
@Head()
checkExists() {}
```

**All HTTP decorators accept an optional path parameter:**

```typescript
@Get("/custom-path/:id")
customRoute(@Param("id") id: string) {}
```

---

### @UseGuards()

Apply guards to routes or controllers.

```typescript
// Single guard
@Get()
@UseGuards(AuthGuard)
findAll() {}

// Multiple guards
@Get()
@UseGuards(AuthGuard, RoleGuard, PermissionGuard)
sensitiveData() {}

// On controller (applies to all routes)
@Controller("/admin")
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {}
```

---

### @UseInterceptors()

Apply interceptors to routes or controllers.

```typescript
// Single interceptor
@Get()
@UseInterceptors(LoggingInterceptor)
findAll() {}

// Multiple interceptors
@Get()
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
getData() {}

// On controller
@Controller("/api")
@UseInterceptors(LoggingInterceptor)
export class ApiController {}
```

---

### @UsePipes()

Apply pipes for validation and transformation.

```typescript
@Post()
@UsePipes(ValidationPipe)
create(@Body() body: any) {}

@Get()
@UsePipes(TransformPipe, ValidationPipe)
findAll(@Query() query: any) {}
```

---

## 📥 Parameter Decorators

### @Param()

Extract route parameters.

```typescript
// Single parameter
@Get("/:id")
findOne(@Param("id") id: string) {}

// Multiple parameters
@Get("/:userId/posts/:postId")
findPost(
  @Param("userId") userId: string,
  @Param("postId") postId: string
) {}

// All parameters as object
@Get("/:id")
findOne(@Param() params: any) {
  console.log(params.id);
}
```

---

### @Query()

Extract query parameters.

```typescript
// Single query parameter
@Get()
findAll(@Query("page") page: string) {}

// Multiple query parameters
@Get()
findAll(
  @Query("page") page: string,
  @Query("limit") limit: string
) {}

// All query parameters as object
@Get()
findAll(@Query() query: any) {
  console.log(query.page, query.limit);
}
```

---

### @Body()

Extract request body.

```typescript
// Entire body
@Post()
create(@Body() body: any) {}

// Destructure specific fields
@Post()
create(@Body() { name, email }: { name: string; email: string }) {}
```

---

### @Headers()

Extract request headers.

```typescript
// Single header
@Get()
findAll(@Headers("authorization") auth: string) {}

// All headers
@Get()
findAll(@Headers() headers: any) {}
```

---

### @Req()

Get the raw request object.

```typescript
@Get()
findAll(@Req() request: any) {
  console.log(request.method);
  console.log(request.url);
  console.log(request.headers);
}
```

---

### @Res()

Get the raw response object.

```typescript
@Get()
customResponse(@Res() response: any) {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ message: "Custom response" }));
}
```

---

## 🏗️ Property Decorators

### @Column()

Mark a property as a database column.

```typescript
@Entity("users")
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  age: number;
}
```

**With options:**

```typescript
@Column({ type: "string" })
name: string;

@Column({ type: "number" })
age: number;
```

---

### @PrimaryGeneratedColumn()

Mark a property as the auto-increment primary key.

```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
```

---

## 📖 Quick Reference

### Class Decorators

| Decorator       | Purpose                | Example                           |
| --------------- | ---------------------- | --------------------------------- |
| `@Module()`     | Define a module        | `@Module({ controllers: [...] })` |
| `@Controller()` | Define a controller    | `@Controller("/users")`           |
| `@Injectable()` | Make class injectable  | `@Injectable()`                   |
| `@Entity()`     | Define database entity | `@Entity("users")`                |

### Method Decorators (HTTP)

| Decorator    | HTTP Method | Example           |
| ------------ | ----------- | ----------------- |
| `@Get()`     | GET         | `@Get("/:id")`    |
| `@Post()`    | POST        | `@Post()`         |
| `@Put()`     | PUT         | `@Put("/:id")`    |
| `@Patch()`   | PATCH       | `@Patch("/:id")`  |
| `@Delete()`  | DELETE      | `@Delete("/:id")` |
| `@Options()` | OPTIONS     | `@Options()`      |
| `@Head()`    | HEAD        | `@Head()`         |

### Method Decorators (Middleware)

| Decorator            | Purpose            | Example                                |
| -------------------- | ------------------ | -------------------------------------- |
| `@UseGuards()`       | Apply guards       | `@UseGuards(AuthGuard)`                |
| `@UseInterceptors()` | Apply interceptors | `@UseInterceptors(LoggingInterceptor)` |
| `@UsePipes()`        | Apply pipes        | `@UsePipes(ValidationPipe)`            |

### Parameter Decorators

| Decorator    | Extracts         | Example                     |
| ------------ | ---------------- | --------------------------- |
| `@Param()`   | Route parameters | `@Param("id")`              |
| `@Query()`   | Query parameters | `@Query("page")`            |
| `@Body()`    | Request body     | `@Body()`                   |
| `@Headers()` | HTTP headers     | `@Headers("authorization")` |
| `@Req()`     | Raw request      | `@Req()`                    |
| `@Res()`     | Raw response     | `@Res()`                    |

### Property Decorators

| Decorator                   | Purpose           | Example                     |
| --------------------------- | ----------------- | --------------------------- |
| `@Column()`                 | Database column   | `@Column()`                 |
| `@PrimaryGeneratedColumn()` | Auto-increment PK | `@PrimaryGeneratedColumn()` |

---

## 🎯 Common Patterns

### Complete Controller Example

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  JwtAuthGuard,
  LoggingInterceptor,
} from "@fynixjs/fynix";

@Controller("/api/users")
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll(@Query("page") page: string, @Query("limit") limit: string) {
    return this.userService.findAll(page, limit);
  }

  @Get("/:id")
  findOne(@Param("id") id: string) {
    return this.userService.findById(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.userService.create(body);
  }

  @Put("/:id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.userService.update(id, body);
  }

  @Delete("/:id")
  remove(@Param("id") id: string) {
    return this.userService.remove(id);
  }
}
```

### Complete Entity Example

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
} from "@fynixjs/fynix";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  age: number;

  @Column()
  isActive: boolean;

  // Custom static method
  static async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ email });
  }

  // Custom instance method
  isAdult(): boolean {
    return this.age >= 18;
  }
}
```

### Complete Module Example

```typescript
import { Module } from "@fynixjs/fynix";
import { DatabaseModule } from "../database/database.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
```

---

## 💡 Tips & Tricks

### 1. Combine Decorators

```typescript
@Controller("/api/admin")
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class AdminController {
  @Get("/users")
  @UseInterceptors(CacheInterceptor) // Additional interceptor for this route
  getAllUsers() {}
}
```

### 2. Create Custom Decorators

```typescript
// Custom decorator combining multiple decorators
export function Auth() {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    UseGuards(JwtAuthGuard)(target, propertyKey, descriptor);
    UseInterceptors(LoggingInterceptor)(target, propertyKey, descriptor);
  };
}

// Usage
@Get()
@Auth()
protectedRoute() {}
```

### 3. TypeScript Type Safety

```typescript
interface CreateUserDto {
  name: string;
  email: string;
  age: number;
}

@Post()
create(@Body() body: CreateUserDto) {
  // TypeScript knows the shape of body
  return this.userService.create(body);
}
```

---

## 📚 Next Steps

- [API Reference](./09-API_REFERENCE.md)
- [Examples](./10-EXAMPLES.md)
- [Core Concepts](./02-CORE_CONCEPTS.md)

---

**Master FynixJS decorators for clean, maintainable code!**
