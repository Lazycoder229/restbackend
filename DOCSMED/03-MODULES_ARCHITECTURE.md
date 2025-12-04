# 03 - Modules Architecture

## 📋 Table of Contents

- [What are Modules?](#what-are-modules)
- [Module Basics](#module-basics)
- [Module Metadata](#module-metadata)
- [Feature Modules](#feature-modules)
- [Shared Modules](#shared-modules)
- [Module Imports & Exports](#module-imports--exports)
- [Global Modules](#global-modules)
- [Dynamic Modules](#dynamic-modules)
- [Module Organization Patterns](#module-organization-patterns)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)

---

## 🎯 What are Modules?

**Modules** are the fundamental building blocks of FynixJS applications. They organize your code into cohesive, reusable units by grouping related controllers, services, and other components together.

### Key Benefits

- **Organization**: Group related features together
- **Encapsulation**: Hide implementation details
- **Reusability**: Share modules across projects
- **Lazy Loading**: Load modules on demand (future feature)
- **Testing**: Test modules in isolation
- **Scalability**: Build large applications systematically

---

## 🏗️ Module Basics

### Simple Module

```typescript
import { Module } from "@fynixjs/fynix";

@Module({
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### Module with Components

```typescript
import { Module, Controller, Injectable, Get } from "@fynixjs/fynix";

// Service
@Injectable()
export class UserService {
  findAll() {
    return [{ id: 1, name: "John" }];
  }
}

// Controller
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUsers() {
    return this.userService.findAll();
  }
}

// Module groups them together
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

### Bootstrap the Application

```typescript
// main.ts
import { FynixFactory } from "@fynixjs/fynix";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();
  await app.listen(3000);
  console.log("🚀 Server running on http://localhost:3000");
}

bootstrap();
```

---

## 📦 Module Metadata

### Complete Module Definition

```typescript
@Module({
  imports: [], // Modules to import
  controllers: [], // HTTP controllers
  providers: [], // Services, repositories, etc.
  exports: [], // Components to share with other modules
})
export class MyModule {}
```

### Metadata Properties

| Property      | Type       | Description                                  |
| ------------- | ---------- | -------------------------------------------- |
| `imports`     | `Module[]` | Other modules to import                      |
| `controllers` | `Class[]`  | Controllers to register                      |
| `providers`   | `Class[]`  | Services, repositories to register           |
| `exports`     | `Class[]`  | Providers to make available to other modules |

---

## 🎨 Feature Modules

Feature modules organize code around a specific feature or domain.

### User Feature Module

```typescript
// user.entity.ts
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  name: string;
}

// user.repository.ts
@Injectable()
export class UserRepository extends Repository<User> {
  async findByEmail(email: string) {
    return await this.findOne({ where: { email } });
  }
}

// user.service.ts
@Injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async findAll() {
    return await this.userRepo.findAll();
  }

  async findById(id: number) {
    return await this.userRepo.findById(id);
  }

  async create(userData: Partial<User>) {
    return await this.userRepo.create(userData);
  }
}

// user.controller.ts
@Controller("/api/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @Get("/:id")
  async findOne(@Param("id") id: string) {
    return await this.userService.findById(Number(id));
  }

  @Post()
  async create(@Body() body: any) {
    return await this.userService.create(body);
  }
}

// user.module.ts
@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService], // Share with other modules
})
export class UserModule {}
```

### Product Feature Module

```typescript
// product.module.ts
@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductService],
})
export class ProductModule {}
```

---

## 🌐 Shared Modules

Shared modules contain common functionality used across multiple modules.

### Database Module

```typescript
// database.module.ts
import { Module, DatabaseService } from "@fynixjs/fynix";

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService], // Available to all importing modules
})
export class DatabaseModule {}
```

### Common Module

```typescript
// logger.service.ts
@Injectable()
export class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }

  error(message: string) {
    console.error(`[ERROR] ${message}`);
  }
}

// common.module.ts
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class CommonModule {}
```

### Using Shared Modules

```typescript
@Module({
  imports: [CommonModule], // Import shared module
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

// Now UserService can inject LoggerService
@Injectable()
export class UserService {
  constructor(private logger: LoggerService) {}

  findAll() {
    this.logger.log("Finding all users");
    return [];
  }
}
```

---

## 🔄 Module Imports & Exports

### Importing Modules

```typescript
@Module({
  imports: [
    DatabaseModule, // Get DatabaseService
    AuthModule, // Get AuthService
    CommonModule, // Get LoggerService
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

### Exporting Providers

```typescript
// Auth module exports its services
@Module({
  providers: [AuthService, JwtService, TokenService],
  exports: [
    AuthService, // ✅ Available to importing modules
    JwtService, // ✅ Available to importing modules
    // TokenService not exported - internal only
  ],
})
export class AuthModule {}

// User module can use exported services
@Module({
  imports: [AuthModule],
  providers: [UserService],
})
export class UserModule {}

@Injectable()
export class UserService {
  constructor(
    private authService: AuthService, // ✅ Works
    private jwtService: JwtService // ✅ Works
  ) // private tokenService: TokenService  // ❌ Error: not exported
  {}
}
```

### Re-exporting Modules

```typescript
// Core module re-exports common modules
@Module({
  imports: [DatabaseModule, CommonModule, AuthModule],
  exports: [
    DatabaseModule, // Re-export
    CommonModule, // Re-export
    AuthModule, // Re-export
  ],
})
export class CoreModule {}

// Other modules only need to import CoreModule
@Module({
  imports: [CoreModule], // Gets all three modules
  controllers: [UserController],
})
export class UserModule {}
```

---

## 🌍 Global Modules

Global modules are available everywhere without explicit imports (use sparingly).

### Creating a Global Module

```typescript
// Not directly supported in current version
// Use exports and imports instead

// Pattern: Create a CoreModule that's imported by AppModule
@Module({
  imports: [DatabaseModule, LoggerModule],
  exports: [DatabaseModule, LoggerModule],
})
export class CoreModule {}

@Module({
  imports: [
    CoreModule, // Import once in root
    UserModule,
    ProductModule,
  ],
})
export class AppModule {}
```

---

## 🔧 Dynamic Modules

Dynamic modules allow runtime configuration.

### Configuration Module Pattern

```typescript
// config.module.ts
export interface ConfigOptions {
  apiKey: string;
  apiUrl: string;
}

@Module({})
export class ConfigModule {
  static forRoot(options: ConfigOptions) {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: "CONFIG_OPTIONS",
          useValue: options,
        },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}

// config.service.ts
@Injectable()
export class ConfigService {
  constructor(@Inject("CONFIG_OPTIONS") private options: ConfigOptions) {}

  get(key: keyof ConfigOptions) {
    return this.options[key];
  }
}

// Usage in app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      apiKey: process.env.API_KEY,
      apiUrl: "https://api.example.com",
    }),
  ],
})
export class AppModule {}
```

### Database Module with Options

```typescript
export interface DatabaseOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions) {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: "DB_OPTIONS",
          useValue: options,
        },
        {
          provide: DatabaseService,
          useFactory: (opts: DatabaseOptions) => {
            return new DatabaseService(opts);
          },
          inject: ["DB_OPTIONS"],
        },
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
      database: "myapp",
      user: "root",
      password: "password",
    }),
  ],
})
export class AppModule {}
```

---

## 🗂️ Module Organization Patterns

### 1. Feature-Based Structure

```
src/
├── main.ts
├── app.module.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
│
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts
│   ├── products.service.ts
│   ├── products.repository.ts
│   └── entities/
│       └── product.entity.ts
│
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── entities/
│       └── order.entity.ts
│
└── shared/
    ├── database/
    │   └── database.module.ts
    ├── common/
    │   └── common.module.ts
    └── auth/
        └── auth.module.ts
```

### 2. Layer-Based Structure

```
src/
├── main.ts
├── app.module.ts
│
├── controllers/
│   ├── user.controller.ts
│   ├── product.controller.ts
│   └── order.controller.ts
│
├── services/
│   ├── user.service.ts
│   ├── product.service.ts
│   └── order.service.ts
│
├── repositories/
│   ├── user.repository.ts
│   ├── product.repository.ts
│   └── order.repository.ts
│
└── entities/
    ├── user.entity.ts
    ├── product.entity.ts
    └── order.entity.ts
```

### 3. Domain-Driven Structure

```
src/
├── main.ts
├── app.module.ts
│
├── domain/
│   ├── user/
│   │   ├── user.module.ts
│   │   ├── user.entity.ts
│   │   ├── user.repository.ts
│   │   └── user.service.ts
│   │
│   └── product/
│       ├── product.module.ts
│       ├── product.entity.ts
│       ├── product.repository.ts
│       └── product.service.ts
│
├── application/
│   ├── user/
│   │   ├── user.controller.ts
│   │   └── dto/
│   │
│   └── product/
│       ├── product.controller.ts
│       └── dto/
│
└── infrastructure/
    ├── database/
    ├── cache/
    └── email/
```

---

## ✅ Best Practices

### 1. Keep Modules Focused

```typescript
// ✅ Good - focused module
@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}

// ❌ Bad - too many responsibilities
@Module({
  controllers: [UserController, ProductController, OrderController],
  providers: [UserService, ProductService, OrderService /* ... */],
})
export class EverythingModule {}
```

### 2. Use Feature Modules

```typescript
// ✅ Good - feature modules
@Module({
  imports: [UserModule, ProductModule, OrderModule, AuthModule],
})
export class AppModule {}

// ❌ Bad - everything in AppModule
@Module({
  controllers: [UserController, ProductController, OrderController],
  providers: [UserService, ProductService, OrderService /* ... */],
})
export class AppModule {}
```

### 3. Export Selectively

```typescript
// ✅ Good - only export public API
@Module({
  providers: [
    UserService,
    UserRepository, // Internal
    UserValidator, // Internal
  ],
  exports: [
    UserService, // Public API
  ],
})
export class UserModule {}

// ❌ Bad - exporting everything
@Module({
  providers: [UserService, UserRepository, UserValidator],
  exports: [UserService, UserRepository, UserValidator],
})
export class UserModule {}
```

### 4. Create Shared Modules

```typescript
// ✅ Good - shared functionality
@Module({
  providers: [LoggerService, CacheService],
  exports: [LoggerService, CacheService],
})
export class CommonModule {}

@Module({
  imports: [CommonModule],
  providers: [UserService],
})
export class UserModule {}

// ❌ Bad - duplicating providers
@Module({
  providers: [UserService, LoggerService, CacheService],
})
export class UserModule {}

@Module({
  providers: [ProductService, LoggerService, CacheService],
})
export class ProductModule {}
```

### 5. One Module Per Feature

```typescript
// ✅ Good
// users/users.module.ts
@Module({
  /* user-related */
})
export class UserModule {}

// products/products.module.ts
@Module({
  /* product-related */
})
export class ProductModule {}

// ❌ Bad - mixing concerns
@Module({
  controllers: [UserController, ProductController],
  providers: [UserService, ProductService],
})
export class ApiModule {}
```

---

## 🎯 Real-World Examples

### Example 1: E-Commerce Application

```typescript
// Core Modules
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

@Module({
  providers: [LoggerService, ConfigService],
  exports: [LoggerService, ConfigService],
})
export class CommonModule {}

// Feature Modules
@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductService],
})
export class ProductModule {}

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    UserModule, // Need UserService
    ProductModule, // Need ProductService
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository, PaymentService, ShippingService],
  exports: [OrderService],
})
export class OrderModule {}

@Module({
  imports: [DatabaseModule, CommonModule, UserModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService],
  exports: [AuthService],
})
export class AuthModule {}

// Root Module
@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    AuthModule,
    UserModule,
    ProductModule,
    OrderModule,
  ],
})
export class AppModule {}
```

### Example 2: Multi-Tenant SaaS

```typescript
// Tenant Module
@Module({
  providers: [TenantService, TenantRepository],
  exports: [TenantService],
})
export class TenantModule {}

// Tenant-Aware Database Module
@Module({
  imports: [TenantModule],
  providers: [
    {
      provide: DatabaseService,
      useFactory: (tenantService: TenantService) => {
        return new TenantAwareDatabaseService(tenantService);
      },
      inject: [TenantService],
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}

// Feature Modules (tenant-isolated)
@Module({
  imports: [DatabaseModule, TenantModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

@Module({
  imports: [DatabaseModule, TenantModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}

// Root Module
@Module({
  imports: [DatabaseModule, TenantModule, UserModule, ProjectModule],
})
export class AppModule {}
```

### Example 3: Microservices Gateway

```typescript
// Gateway Modules
@Module({
  providers: [UserServiceClient],
  exports: [UserServiceClient],
})
export class UserServiceModule {}

@Module({
  providers: [ProductServiceClient],
  exports: [ProductServiceClient],
})
export class ProductServiceModule {}

@Module({
  providers: [OrderServiceClient],
  exports: [OrderServiceClient],
})
export class OrderServiceModule {}

// Gateway Controllers
@Module({
  imports: [UserServiceModule],
  controllers: [UserGatewayController],
})
export class UserGatewayModule {}

@Module({
  imports: [ProductServiceModule],
  controllers: [ProductGatewayController],
})
export class ProductGatewayModule {}

// Root Gateway Module
@Module({
  imports: [UserGatewayModule, ProductGatewayModule],
})
export class GatewayModule {}
```

---

## 📚 Next Steps

- **[04-CONTROLLERS_ROUTING.md](./04-CONTROLLERS_ROUTING.md)** - Handle HTTP requests
- **[05-DATABASE_ORM.md](./05-DATABASE_ORM.md)** - Database integration
- **[13-BEST_PRACTICES.md](./13-BEST_PRACTICES.md)** - Module organization patterns

---

## 💡 Key Takeaways

✅ Modules organize code into cohesive units  
✅ Use feature modules for domain logic  
✅ Create shared modules for common functionality  
✅ Export only what other modules need  
✅ Import modules to access their exported providers  
✅ Keep modules focused on a single responsibility  
✅ Use dynamic modules for runtime configuration  
✅ Structure projects by features, not layers

---

**Master Modules** to build scalable, maintainable applications!
