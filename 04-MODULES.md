# Modules

Modules are the organizational building blocks of FynixJS applications. They help you structure your code by feature or domain.

---

## 📋 Table of Contents

- [Module Basics](#module-basics)
- [Module Metadata](#module-metadata)
- [Feature Modules](#feature-modules)
- [Shared Modules](#shared-modules)
- [Module Imports & Exports](#module-imports--exports)
- [Best Practices](#best-practices)

---

## 🎯 Module Basics

### What is a Module?

A module is a class annotated with the `@Module()` decorator. It groups related components (controllers, services) together.

```typescript
import { Module } from "@fynixjs/fynix";

@Module({
  controllers: [],
  providers: [],
  imports: [],
  exports: [],
})
export class AppModule {}
```

### Creating Your First Module

```typescript
import { Module } from "@fynixjs/fynix";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

---

## 🔧 Module Metadata

The `@Module()` decorator accepts an object with these properties:

### Controllers

HTTP route handlers that respond to requests:

```typescript
@Module({
  controllers: [UserController, ProfileController, AuthController]
})
```

### Providers

Injectable services and other providers:

```typescript
@Module({
  providers: [
    UserService,
    EmailService,
    DatabaseService
  ]
})
```

### Imports

Other modules whose exports you want to use:

```typescript
@Module({
  imports: [DatabaseModule, AuthModule]
})
```

### Exports

Providers from this module that should be available to other modules:

```typescript
@Module({
  providers: [UserService],
  exports: [UserService] // Other modules can now use UserService
})
```

---

## 🏗️ Feature Modules

Feature modules organize code by business feature.

### Example: User Module

```typescript
// user.controller.ts
import { Controller, Get, Post, Body } from "@fynixjs/fynix";
import { UserService } from "./user.service";

@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.userService.create(body);
  }
}

// user.service.ts
import { Injectable } from "@fynixjs/fynix";

@Injectable()
export class UserService {
  private users = [];

  findAll() {
    return this.users;
  }

  create(userData: any) {
    const user = { id: Date.now(), ...userData };
    this.users.push(user);
    return user;
  }
}

// user.module.ts
import { Module } from "@fynixjs/fynix";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Share UserService with other modules
})
export class UserModule {}
```

---

## 🔗 Shared Modules

Shared modules export providers that are used across multiple features.

### Example: Database Module

```typescript
// database.module.ts
import { Module } from "@fynixjs/fynix";
import { DatabaseService } from "@fynixjs/fynix";

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService], // Make it available to other modules
})
export class DatabaseModule {}
```

### Using Shared Modules

```typescript
// user.module.ts
import { Module } from "@fynixjs/fynix";
import { DatabaseModule } from "../database/database.module";
import { UserService } from "./user.service";

@Module({
  imports: [DatabaseModule], // Import to use DatabaseService
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

// user.service.ts
import { Injectable, DatabaseService } from "@fynixjs/fynix";

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {} // Injected from DatabaseModule

  async findAll() {
    return await this.db.query("SELECT * FROM users");
  }
}
```

---

## 📦 Module Imports & Exports

### Importing Modules

Import modules to use their exported providers:

```typescript
@Module({
  imports: [DatabaseModule, AuthModule, EmailModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

### Exporting Providers

Export providers to make them available to other modules:

```typescript
@Module({
  providers: [UserService, UserRepository],
  exports: [UserService], // Only UserService is available to importers
})
export class UserModule {}
```

### Re-exporting Modules

You can re-export entire modules:

```typescript
@Module({
  imports: [DatabaseModule],
  exports: [DatabaseModule], // Re-export DatabaseModule
})
export class CoreModule {}

// Now other modules can import CoreModule to get DatabaseModule
@Module({
  imports: [CoreModule], // Gets DatabaseModule indirectly
})
export class UserModule {}
```

---

## 🏛️ Root Module

Every application has a root module:

```typescript
// app.module.ts
import { Module } from "@fynixjs/fynix";
import { UserModule } from "./user/user.module";
import { ProductModule } from "./product/product.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [UserModule, ProductModule, AuthModule],
})
export class AppModule {}

// main.ts
import { FynixFactory } from "@fynixjs/fynix";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule); // Root module
  await app.init();
  await app.listen(3000);
}

bootstrap();
```

---

## 📂 Module Organization Patterns

### By Feature

Organize by business feature:

```
src/
├── user/
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.entity.ts
│   └── user.module.ts
├── product/
│   ├── product.controller.ts
│   ├── product.service.ts
│   ├── product.entity.ts
│   └── product.module.ts
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
└── app.module.ts
```

### By Layer

Organize by architectural layer:

```
src/
├── controllers/
│   ├── user.controller.ts
│   └── product.controller.ts
├── services/
│   ├── user.service.ts
│   └── product.service.ts
├── entities/
│   ├── user.entity.ts
│   └── product.entity.ts
├── modules/
│   ├── user.module.ts
│   └── product.module.ts
└── app.module.ts
```

### Hybrid Approach (Recommended)

Combine both approaches:

```
src/
├── core/
│   ├── database/
│   │   └── database.module.ts
│   ├── config/
│   │   └── config.module.ts
│   └── core.module.ts
├── shared/
│   ├── services/
│   ├── guards/
│   └── shared.module.ts
├── features/
│   ├── user/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.module.ts
│   ├── product/
│   │   ├── product.controller.ts
│   │   ├── product.service.ts
│   │   └── product.module.ts
└── app.module.ts
```

---

## ✅ Best Practices

### 1. Single Responsibility

Each module should focus on one feature or domain:

```typescript
// ✅ Good - focused on users
@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}

// ❌ Bad - too many unrelated things
@Module({
  controllers: [UserController, ProductController, OrderController],
  providers: [UserService, ProductService, OrderService],
})
export class EverythingModule {}
```

### 2. Export Only What's Needed

```typescript
// ✅ Good - minimal exports
@Module({
  providers: [UserService, UserRepository, UserValidator],
  exports: [UserService], // Only expose public API
})
export class UserModule {}
```

### 3. Use Shared Modules for Common Functionality

```typescript
// shared.module.ts
@Module({
  providers: [Logger, EmailService, CacheService],
  exports: [Logger, EmailService, CacheService],
})
export class SharedModule {}

// Import in feature modules
@Module({
  imports: [SharedModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

### 4. Create a Core Module

```typescript
// core.module.ts
@Module({
  imports: [DatabaseModule, ConfigModule],
  exports: [DatabaseModule, ConfigModule],
})
export class CoreModule {}

// Import in AppModule
@Module({
  imports: [CoreModule, UserModule, ProductModule],
})
export class AppModule {}
```

### 5. Keep Modules Loosely Coupled

```typescript
// ✅ Good - modules are independent
@Module({
  imports: [DatabaseModule],
  providers: [UserService],
})
export class UserModule {}

@Module({
  imports: [DatabaseModule],
  providers: [ProductService],
})
export class ProductModule {}

// ❌ Bad - UserModule depends on ProductModule
@Module({
  imports: [ProductModule], // Tight coupling
  providers: [UserService],
})
export class UserModule {}
```

---

## 🎯 Real-World Example

Complete application structure:

```typescript
// core/database/database.module.ts
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

// core/auth/auth.module.ts
@Module({
  imports: [DatabaseModule],
  providers: [AuthService, JwtService],
  exports: [AuthService],
})
export class AuthModule {}

// features/user/user.module.ts
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}

// features/product/product.module.ts
@Module({
  imports: [DatabaseModule, UserModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductService],
})
export class ProductModule {}

// app.module.ts
@Module({
  imports: [DatabaseModule, AuthModule, UserModule, ProductModule],
  controllers: [AppController],
})
export class AppModule {}
```

---

## 📚 Next Steps

- [Database & ORM](./05-DATABASE.md)
- [Security](./06-SECURITY.md)
- [Examples](./10-EXAMPLES.md)

---

**Use modules to keep your FynixJS application organized and maintainable!**
