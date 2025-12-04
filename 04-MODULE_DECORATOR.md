# Module Decorator Documentation

## Overview

The Module Decorator is the foundation of application architecture in the Fynix framework. It organizes your application into cohesive, modular blocks by grouping related controllers, providers (services), imports, and exports.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Module Configuration](#module-configuration)
- [Usage Examples](#usage-examples)
- [Module Architecture](#module-architecture)
- [Best Practices](#best-practices)
- [Advanced Patterns](#advanced-patterns)
- [Troubleshooting](#troubleshooting)

---

## Installation & Setup

```typescript
import "reflect-metadata";
import { Module } from "./decorators/module.decorator";
```

---

## Basic Usage

Define a module with its dependencies:

```typescript
@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [],
  exports: [],
})
export class UserModule {}
```

---

## API Reference

### @Module

**Signature:**

```typescript
@Module(metadata: ModuleMetadata): ClassDecorator
```

**Parameters:**

- `metadata` (required): Module configuration object
  - `controllers?: any[]` - Controllers belonging to this module
  - `providers?: any[]` - Services/providers available in this module
  - `imports?: any[]` - Other modules to import
  - `exports?: any[]` - Providers to make available to other modules

**Returns:** `ClassDecorator`

**Metadata Key:** `MODULE_METADATA`

**Example:**

```typescript
@Module({
  controllers: [UserController, ProfileController],
  providers: [UserService, AuthService],
  imports: [DatabaseModule],
  exports: [UserService],
})
export class UserModule {}
```

---

## Module Configuration

### ModuleMetadata Interface

```typescript
interface ModuleMetadata {
  controllers?: any[]; // Controllers (route handlers)
  providers?: any[]; // Services, repositories, helpers
  imports?: any[]; // Other modules to import
  exports?: any[]; // Providers to export to other modules
}
```

### Controllers

Controllers handle HTTP requests:

```typescript
@Module({
  controllers: [UserController, AuthController, ProfileController],
})
export class UserModule {}
```

### Providers

Services and other injectables:

```typescript
@Module({
  providers: [UserService, AuthService, EmailService, ConfigService],
})
export class UserModule {}
```

### Imports

Other modules to include:

```typescript
@Module({
  imports: [DatabaseModule, ConfigModule, LoggerModule],
})
export class UserModule {}
```

### Exports

Providers to share with other modules:

```typescript
@Module({
  providers: [UserService, AuthService],
  exports: [UserService], // Make UserService available to importing modules
})
export class UserModule {}
```

---

## Usage Examples

### Simple Module

```typescript
@Injectable()
export class UserService {
  findAll() {
    return [];
  }
}

@Controller("/api/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("/")
  listUsers() {
    return this.userService.findAll();
  }
}

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

### Module with Imports

```typescript
// Database Module
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

// User Module
@Module({
  imports: [DatabaseModule], // Import DatabaseModule
  controllers: [UserController],
  providers: [UserService], // Can inject DatabaseService
})
export class UserModule {}
```

### Module with Exports

```typescript
// Shared Module
@Module({
  providers: [LoggerService, ConfigService, CacheService],
  exports: [
    LoggerService, // Export for use in other modules
    ConfigService,
    CacheService,
  ],
})
export class SharedModule {}

// Feature Module
@Module({
  imports: [SharedModule], // Can now use exported services
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
```

### Complete Application Module

```typescript
// Feature modules
@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

@Module({
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}

@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports: [UserModule, ProductModule], // Import other modules
})
export class OrderModule {}

// Root module
@Module({
  imports: [UserModule, ProductModule, OrderModule],
})
export class AppModule {}
```

---

## Module Architecture

### Feature Modules

Organize by feature/domain:

```typescript
// User feature
@Module({
  controllers: [UserController, ProfileController],
  providers: [UserService, ProfileService],
  exports: [UserService],
})
export class UserModule {}

// Product feature
@Module({
  controllers: [ProductController, CategoryController],
  providers: [ProductService, CategoryService],
  exports: [ProductService],
})
export class ProductModule {}
```

### Shared Modules

Common utilities and services:

```typescript
@Module({
  providers: [LoggerService, ConfigService, CacheService, EmailService],
  exports: [LoggerService, ConfigService, CacheService, EmailService],
})
export class SharedModule {}
```

### Core Module

Application-wide singletons:

```typescript
@Module({
  providers: [DatabaseService, AuthService, ConfigService],
  exports: [DatabaseService, AuthService, ConfigService],
})
export class CoreModule {}
```

### Root Module

Application entry point:

```typescript
@Module({
  imports: [CoreModule, SharedModule, UserModule, ProductModule, OrderModule],
})
export class AppModule {}
```

---

## Best Practices

### 1. Organize by Feature

```typescript
// Good - feature-based modules
@Module({...})
export class UserModule {}

@Module({...})
export class ProductModule {}

@Module({...})
export class OrderModule {}

// Avoid - monolithic module
@Module({
  controllers: [
    UserController,
    ProductController,
    OrderController,
    // Too many controllers
  ]
})
export class AppModule {}
```

### 2. Export Only What's Needed

```typescript
// Good - selective exports
@Module({
  providers: [UserService, UserRepository, UserValidator, InternalHelper],
  exports: [UserService], // Only export public API
})
export class UserModule {}

// Avoid - exporting everything
@Module({
  providers: [UserService, UserRepository, InternalHelper],
  exports: [UserService, UserRepository, InternalHelper], // Too much exposed
})
export class UserModule {}
```

### 3. Use Shared Modules for Common Services

```typescript
// Good - shared module
@Module({
  providers: [LoggerService, ConfigService],
  exports: [LoggerService, ConfigService],
})
export class SharedModule {}

// Use across features
@Module({
  imports: [SharedModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

@Module({
  imports: [SharedModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
```

### 4. Keep Module Files Focused

```typescript
// Good - module only
// user.module.ts
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

// Avoid - mixing concerns
// user.module.ts
@Injectable()
class UserService {}

@Controller("/api/users")
class UserController {}

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

### 5. Document Module Purpose

```typescript
/**
 * User Module
 *
 * Handles user management, authentication, and profile operations
 *
 * Exports:
 * - UserService: For accessing user data from other modules
 *
 * Dependencies:
 * - DatabaseModule: For database access
 * - AuthModule: For authentication logic
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UserController, ProfileController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
```

### 6. Avoid Circular Dependencies

```typescript
// Avoid
@Module({
  imports: [ProductModule], // Imports ProductModule
})
export class UserModule {}

@Module({
  imports: [UserModule], // Imports UserModule - Circular!
})
export class ProductModule {}

// Fix - create a shared module or refactor
@Module({
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {}

@Module({
  imports: [SharedModule],
})
export class UserModule {}

@Module({
  imports: [SharedModule],
})
export class ProductModule {}
```

---

## Advanced Patterns

### Dynamic Module Configuration

```typescript
@Module({})
export class DatabaseModule {
  static forRoot(config: any) {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: "DATABASE_CONFIG",
          useValue: config,
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}

// Usage
@Module({
  imports: [
    DatabaseModule.forRoot({
      host: "localhost",
      port: 3306,
    }),
  ],
})
export class AppModule {}
```

### Global Modules

```typescript
@Global() // If supported
@Module({
  providers: [ConfigService, LoggerService],
  exports: [ConfigService, LoggerService],
})
export class GlobalModule {}
```

### Lazy Loading Modules

```typescript
@Module({
  imports: [
    // Conditionally import based on environment
    ...(process.env.NODE_ENV === "development" ? [DebugModule] : []),
  ],
})
export class AppModule {}
```

### Module Registry

```typescript
class ModuleRegistry {
  private static modules = new Map<string, any>();

  static register(name: string, module: any) {
    this.modules.set(name, module);
  }

  static get(name: string) {
    return this.modules.get(name);
  }
}

// Register modules
ModuleRegistry.register("UserModule", UserModule);
ModuleRegistry.register("ProductModule", ProductModule);
```

---

## Complete Example

```typescript
// ===== Core Module =====
@Injectable()
export class DatabaseService {
  query(sql: string, params?: any[]) {
    console.log("Executing query:", sql);
    return Promise.resolve([]);
  }
}

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class CoreModule {}

// ===== Shared Module =====
@Injectable()
export class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class SharedModule {}

// ===== User Module =====
@Injectable()
export class UserService {
  constructor(
    private database: DatabaseService,
    private logger: LoggerService
  ) {}

  async findAll() {
    this.logger.log("Finding all users");
    return this.database.query("SELECT * FROM users");
  }
}

@Controller("/api/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("/")
  listUsers() {
    return this.userService.findAll();
  }
}

@Module({
  imports: [CoreModule, SharedModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

// ===== Product Module =====
@Injectable()
export class ProductService {
  constructor(
    private database: DatabaseService,
    private logger: LoggerService
  ) {}

  async findAll() {
    this.logger.log("Finding all products");
    return this.database.query("SELECT * FROM products");
  }
}

@Controller("/api/products")
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get("/")
  listProducts() {
    return this.productService.findAll();
  }
}

@Module({
  imports: [CoreModule, SharedModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}

// ===== Order Module =====
@Injectable()
export class OrderService {
  constructor(
    private userService: UserService,
    private productService: ProductService,
    private logger: LoggerService
  ) {}

  async createOrder(userId: string, productIds: string[]) {
    this.logger.log(`Creating order for user ${userId}`);
    const user = await this.userService.findById(userId);
    const products = await Promise.all(
      productIds.map((id) => this.productService.findById(id))
    );
    return { user, products };
  }
}

@Controller("/api/orders")
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post("/")
  createOrder(@Body() data: any) {
    return this.orderService.createOrder(data.userId, data.productIds);
  }
}

@Module({
  imports: [SharedModule, UserModule, ProductModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}

// ===== App Module (Root) =====
@Module({
  imports: [CoreModule, SharedModule, UserModule, ProductModule, OrderModule],
})
export class AppModule {}
```

---

## Troubleshooting

### Provider Not Found

**Problem:** Service not available for injection

**Solution:** Ensure provider is in module's providers array:

```typescript
@Module({
  providers: [UserService]  // Must be here
})
```

### Circular Dependency

**Problem:** Modules import each other

**Solution:** Create a shared module or refactor dependencies

### Export Not Working

**Problem:** Imported module's provider not available

**Solution:** Ensure provider is exported:

```typescript
@Module({
  providers: [UserService],
  exports: [UserService], // Must export
})
export class UserModule {}
```

### Controller Not Registered

**Problem:** Routes return 404

**Solution:** Add controller to module:

```typescript
@Module({
  controllers: [UserController]  // Must be here
})
```

---

## Related Documentation

- [Injectable Decorator](./INJECTABLE_DECORATOR.md)
- [Controller Decorator](./CONTROLLER_DECORATOR.md)
- [Dependency Injection](./DOCSMED/02-DEPENDENCY_INJECTION.md)
- [Modules Architecture](./DOCSMED/03-MODULES_ARCHITECTURE.md)

---

**Last Updated**: December 4, 2025
