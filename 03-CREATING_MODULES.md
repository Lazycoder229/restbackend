# 📦 Creating Modules

**Master the art of building modular, scalable applications with RestJS.**

> Modules are the building blocks of well-architected applications. This guide teaches you how to organize code for maximum maintainability and reusability.

---

## 📑 Table of Contents

<details open>
<summary><strong>Module Topics</strong></summary>

### Fundamentals

- [What are Modules?](#what-are-modules) - Core concepts
- [Basic Module Structure](#basic-module-structure) - Your first module
- [Module Properties](#module-properties) - Deep dive into @Module()

### Organization

- [File Structure](#file-structure) - Best practices
- [Module Organization](#module-organization) - Folder layout
- [Naming Conventions](#naming-conventions) - Standards

### Advanced

- [Creating Feature Modules](#creating-a-complete-feature-module) - Complete example
- [Module Dependencies](#module-dependencies) - Imports & exports
- [Shared Modules](#shared-modules) - Reusable modules
- [Circular Dependencies](#circular-dependencies) - How to avoid

### Production

- [Best Practices](#best-practices) - Production checklist
- [Performance Tips](#performance-tips) - Optimization

</details>

---

## 🎯 What are Modules?

<details open>
<summary><strong>Understanding Modules</strong></summary>

**Modules** are TypeScript classes decorated with `@Module()` that encapsulate related functionality into cohesive units.

### The Problem Modules Solve

**❌ Without modules:**

```typescript
// main.ts - Everything in one file (messy!)
class UsersController {}
class UsersService {}
class ProductsController {}
class ProductsService {}
class OrdersController {}
class OrdersService {}
// ... 1000+ lines later
```

**✅ With modules:**

```typescript
// Organized, maintainable, testable
@Module({ controllers: [UsersController], providers: [UsersService] })
class UsersModule {}

@Module({ controllers: [ProductsController], providers: [ProductsService] })
class ProductsModule {}

@Module({ imports: [UsersModule, ProductsModule] })
class AppModule {}
```

### Module Anatomy

A module groups four types of components:

| Component       | Purpose                            | Example                                 |
| --------------- | ---------------------------------- | --------------------------------------- |
| **Controllers** | Handle HTTP requests               | `UsersController`                       |
| **Providers**   | Business logic (services, repos)   | `UsersService`, `EmailService`          |
| **Imports**     | Other modules to use               | `DatabaseModule`, `AuthModule`          |
| **Exports**     | Share providers with other modules | Export `UsersService` for other modules |

### Real-World Analogy

Think of modules like **departments in a company:**

```
Company (AppModule)
├── HR Department (UsersModule)
│   ├── HR Manager (UsersController)
│   └── Employee Database (UsersService)
│
├── Sales Department (ProductsModule)
│   ├── Sales Manager (ProductsController)
│   └── Inventory System (ProductsService)
│
└── IT Department (SharedModule)
    ├── Email Service (exported to all)
    └── Database Service (exported to all)
```

Each department (module) has clear responsibilities and can share services with others.

</details>

<details>
<summary><strong>🔍 When to create a new module?</strong></summary>

**Create a module when you have:**

✅ **Related functionality**

```typescript
// Good: User authentication & management together
@Module({
  /* auth + user management */
})
class UsersModule {}
```

✅ **Feature boundaries**

```typescript
// Good: Each major feature gets a module
class OrdersModule {}
class PaymentsModule {}
class ShippingModule {}
```

✅ **Reusable services**

```typescript
// Good: Shared utilities
@Module({ exports: [EmailService, LoggerService] })
class SharedModule {}
```

❌ **Don't over-modularize:**

```typescript
// Bad: Too granular
class UserCreateModule {}
class UserUpdateModule {}
class UserDeleteModule {}
// These should be ONE UsersModule!
```

**Rule of thumb:** If it feels like a "feature" in your app, it's probably a module.

</details>

---

## Basic Module Structure

```typescript
import { Module } from "restjs";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

**Module Properties:**

- `controllers` - Array of controller classes
- `providers` - Array of injectable services, repositories, etc.
- `imports` - Array of other modules to import
- `exports` - Array of providers to expose to other modules

---

## Module Organization

### File Structure

Organize each module in its own folder:

```
src/
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── user.entity.ts
│   └── users.module.ts
├── posts/
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   ├── posts.repository.ts
│   ├── post.entity.ts
│   └── posts.module.ts
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── shared/
│   ├── database.module.ts
│   └── config.module.ts
└── main.ts
```

---

## Creating a Complete Feature Module

Let's create a complete **Users Module** with all components.

### Step 1: Create Entity Interface

```typescript
// users/user.entity.ts
export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  created_at?: Date;
  updated_at?: Date;
}
```

### Step 2: Create Repository

```typescript
// users/users.repository.ts
import { Injectable, Repository } from "restjs";
import { User } from "./user.entity";

@Injectable()
export class UsersRepository extends Repository<User> {
  protected tableName = "users";

  async findByEmail(email: string): Promise<User | null> {
    return await this.findOneBy("email", email);
  }

  async findActiveUsers(): Promise<User[]> {
    return await this.findBy("status", "active");
  }

  async updateStatus(id: number, status: string): Promise<User | null> {
    return await this.update(id, { status });
  }
}
```

### Step 3: Create Service

```typescript
// users/users.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  SecurityService,
} from "restjs";
import { UsersRepository } from "./users.repository";
import { User } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(
    private repo: UsersRepository,
    private security: SecurityService
  ) {}

  async getAllUsers(page: number = 1) {
    return await this.repo.paginate(page, 20);
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    // Don't expose password
    delete user.password;
    return user;
  }

  async createUser(
    name: string,
    email: string,
    password: string
  ): Promise<User> {
    // Validate email
    if (!this.security.isValidEmail(email)) {
      throw new BadRequestException("Invalid email format");
    }

    // Check if email exists
    const existing = await this.repo.findByEmail(email);
    if (existing) {
      throw new BadRequestException("Email already registered");
    }

    // Validate password strength
    if (!this.security.isStrongPassword(password)) {
      throw new BadRequestException(
        "Password must be at least 8 characters with uppercase, lowercase, and number"
      );
    }

    // Hash password
    const hashedPassword = await this.security.hashPassword(password);

    // Create user
    const user = await this.repo.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      status: "active",
    });

    // Don't return password
    delete user.password;
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    // Don't allow password updates through this method
    delete data.password;

    const updated = await this.repo.update(id, data);
    if (!updated) {
      throw new NotFoundException("User not found");
    }

    delete updated.password;
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) {
      throw new NotFoundException("User not found");
    }
  }

  async changePassword(
    id: number,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify old password
    const isValid = await this.security.comparePassword(
      oldPassword,
      user.password
    );
    if (!isValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    // Validate new password
    if (!this.security.isStrongPassword(newPassword)) {
      throw new BadRequestException("New password is too weak");
    }

    // Hash and update
    const hashedPassword = await this.security.hashPassword(newPassword);
    await this.repo.update(id, { password: hashedPassword });
  }
}
```

### Step 4: Create Controller

```typescript
// users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  JwtAuthGuard,
  Param,
  Query,
  Body,
  Req,
  BadRequestException,
} from "restjs";
import { UsersService } from "./users.service";

@Controller("/users")
@UseGuards(JwtAuthGuard) // Protect all routes
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getAllUsers(@Query("page") page?: string) {
    const pageNum = page ? parseInt(page) : 1;
    return await this.usersService.getAllUsers(pageNum);
  }

  @Get("/:id")
  async getUserById(@Param("id") id: string) {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new BadRequestException("Invalid user ID");
    }
    return await this.usersService.getUserById(userId);
  }

  @Post()
  async createUser(
    @Body() body: { name: string; email: string; password: string }
  ) {
    return await this.usersService.createUser(
      body.name,
      body.email,
      body.password
    );
  }

  @Put("/:id")
  async updateUser(
    @Param("id") id: string,
    @Body() body: { name?: string; email?: string; role?: string }
  ) {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new BadRequestException("Invalid user ID");
    }
    return await this.usersService.updateUser(userId, body);
  }

  @Delete("/:id")
  async deleteUser(@Param("id") id: string) {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new BadRequestException("Invalid user ID");
    }
    await this.usersService.deleteUser(userId);
    return { message: "User deleted successfully" };
  }

  @Put("/:id/password")
  async changePassword(
    @Param("id") id: string,
    @Body() body: { oldPassword: string; newPassword: string },
    @Req() req: any
  ) {
    const userId = parseInt(id);

    // Users can only change their own password (unless admin)
    if (req.user.userId !== userId && req.user.role !== "admin") {
      throw new BadRequestException("You can only change your own password");
    }

    await this.usersService.changePassword(
      userId,
      body.oldPassword,
      body.newPassword
    );

    return { message: "Password changed successfully" };
  }
}
```

### Step 5: Create Module

```typescript
// users/users.module.ts
import { Module } from "restjs";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // Export service for other modules
})
export class UsersModule {}
```

---

## Module Dependencies

### Importing Other Modules

```typescript
// posts/posts.module.ts
import { Module } from "restjs";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { PostsRepository } from "./posts.repository";
import { UsersModule } from "../users/users.module"; // Import users module

@Module({
  imports: [UsersModule], // Import to use UsersService
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
})
export class PostsModule {}
```

### Using Imported Services

```typescript
// posts/posts.service.ts
import { Injectable, UsersService } from "restjs";

@Injectable()
export class PostsService {
  constructor(
    private postsRepo: PostsRepository,
    private usersService: UsersService // Now available via UsersModule
  ) {}

  async createPost(userId: number, title: string, content: string) {
    // Verify user exists
    await this.usersService.getUserById(userId);

    // Create post
    return await this.postsRepo.create({ userId, title, content });
  }
}
```

---

## Shared Modules

Create shared modules for common functionality.

### Database Module

```typescript
// shared/database.module.ts
import { Module, DatabaseService } from "restjs";

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

### Security Module

```typescript
// shared/security.module.ts
import { Module, SecurityService } from "restjs";

@Module({
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
```

### Shared Module (Combined)

```typescript
// shared/shared.module.ts
import { Module, DatabaseService, SecurityService } from "restjs";

@Module({
  providers: [DatabaseService, SecurityService],
  exports: [DatabaseService, SecurityService],
})
export class SharedModule {}
```

### Using Shared Module

```typescript
// users/users.module.ts
import { Module } from "restjs";
import { SharedModule } from "../shared/shared.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";

@Module({
  imports: [SharedModule], // Import shared services
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## Root Application Module

### Create Root Module

```typescript
// app.module.ts
import { Module } from "restjs";
import { SharedModule } from "./shared/shared.module";
import { UsersModule } from "./users/users.module";
import { PostsModule } from "./posts/posts.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    SharedModule, // Shared services
    AuthModule, // Authentication
    UsersModule, // Users feature
    PostsModule, // Posts feature
  ],
})
export class AppModule {}
```

### Bootstrap Application

```typescript
// main.ts
import "reflect-metadata";
import { RestFactory, DatabaseService, SecurityService } from "restjs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await RestFactory.create(AppModule);

  // Set global prefix
  app.setGlobalPrefix("/api");

  // Initialize app
  await app.init();

  // Configure database
  const db = app.get<DatabaseService>(DatabaseService);
  db.initialize({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  });

  // Configure security
  const security = app.get<SecurityService>(SecurityService);
  security.configure({
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiration: "24h",
  });

  // Start server
  await app.listen(3000);
  console.log("🚀 Server running on http://localhost:3000");
}

bootstrap().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
```

---

## Best Practices

### 1. One Feature Per Module

✅ **Good:**

```
users/
posts/
auth/
comments/
```

❌ **Bad:**

```
everything-in-one-module/
```

### 2. Export Only What's Needed

```typescript
@Module({
  providers: [UsersService, InternalHelper],
  exports: [UsersService], // Only export public API
})
export class UsersModule {}
```

### 3. Use Shared Modules

```typescript
// Instead of repeating DatabaseService everywhere
@Module({
  imports: [SharedModule], // DatabaseService already included
  // ...
})
```

### 4. Keep Modules Cohesive

Each module should have a single responsibility:

- `UsersModule` - User management
- `AuthModule` - Authentication
- `PostsModule` - Blog posts
- `CommentsModule` - Comments

### 5. Organize by Feature, Not Type

✅ **Good (Feature-based):**

```
users/
  users.controller.ts
  users.service.ts
  users.repository.ts
posts/
  posts.controller.ts
  posts.service.ts
```

❌ **Bad (Type-based):**

```
controllers/
  users.controller.ts
  posts.controller.ts
services/
  users.service.ts
  posts.service.ts
```

### 6. Use Barrel Exports

```typescript
// users/index.ts
export * from "./users.module";
export * from "./users.service";
export * from "./user.entity";
```

Then import easily:

```typescript
import { UsersModule, UsersService } from "./users";
```

---

## Complete Project Structure Example

```
restbackend/
├── src/
│   ├── shared/
│   │   ├── shared.module.ts
│   │   └── index.ts
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── guards/
│   │   │   └── admin.guard.ts
│   │   └── index.ts
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── user.entity.ts
│   │   ├── users.module.ts
│   │   └── index.ts
│   ├── posts/
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   ├── posts.repository.ts
│   │   ├── post.entity.ts
│   │   ├── posts.module.ts
│   │   └── index.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Next Steps

- **[API Reference](./API_REFERENCE.md)** - Complete decorator reference
- **[ORM Guide](./ORM_GUIDE.md)** - Database operations
- **[Security Guide](./SECURITY_GUIDE.md)** - Secure your modules
- **[Deployment Guide](./DEPLOYMENT.md)** - Deploy your modular app

Build maintainable applications with modular architecture! 🏗️
