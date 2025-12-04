# 01 - Framework Overview

## 📋 Table of Contents

- [Introduction](#introduction)
- [Philosophy & Design](#philosophy--design)
- [Architecture Overview](#architecture-overview)
- [Core Principles](#core-principles)
- [Framework Comparison](#framework-comparison)
- [When to Use FynixJS](#when-to-use-fynixjs)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)

---

## 🎯 Introduction

**FynixJS** is a lightweight, TypeScript-first web framework that brings enterprise-grade features with zero configuration. Built with the philosophy of "batteries included", FynixJS provides everything you need to build modern APIs without the complexity of piecing together multiple libraries.

### Key Highlights

- **🚀 Zero Configuration**: Start building immediately without setup
- **💉 Dependency Injection**: Built-in IoC container for clean architecture
- **🔐 Security First**: JWT, bcrypt, CSRF, XSS protection out of the box
- **💾 Database & ORM**: MySQL support with Active Record pattern
- **🔥 Hot Reload**: Auto-restart during development
- **📦 Modular**: NestJS-inspired module system
- **🎨 Decorator-Based**: Clean, declarative API design

---

## 🎨 Philosophy & Design

### 1. Convention Over Configuration

FynixJS follows sensible defaults so you can focus on business logic:

```typescript
// No complex configuration needed
@Controller("/users")
export class UsersController {
  @Get()
  findAll() {
    return { users: [] };
  }
}
```

### 2. Progressive Enhancement

Start simple, add complexity only when needed:

```typescript
// Simple
@Get("/users")
getUsers() {
  return [{ id: 1 }];
}

// Add guards when needed
@Get("/admin")
@UseGuards(JwtAuthGuard)
getAdmin() {
  return { data: "secret" };
}

// Add interceptors for cross-cutting concerns
@Get("/data")
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor, CacheInterceptor)
getData() {
  return { data: "cached" };
}
```

### 3. Type Safety

TypeScript first, ensuring compile-time safety:

```typescript
interface User {
  id: number;
  email: string;
  role: "admin" | "user";
}

@Injectable()
export class UserService {
  async findById(id: number): Promise<User | null> {
    return await UserRepository.findOne({ where: { id } });
  }
}
```

### 4. Developer Experience

Fast feedback loops with hot reload and clear error messages:

```typescript
// Hot reload watches your files
// Change code → Auto restart → Instant feedback
```

---

## 🏗️ Architecture Overview

### Request-Response Flow

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Request                         │
│                  (GET /api/users)                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              1. Route Matching                          │
│   Fast path-based lookup finds matching controller     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              2. Guards Execution                        │
│   Authentication, Authorization, Custom Logic           │
│   ✅ JwtAuthGuard → RoleGuard → CustomGuard            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         3. Interceptors (Before Handler)                │
│   Logging, Transformation, Caching                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              4. Pipes Execution                         │
│   Validation, Transformation, Sanitization              │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         5. Controller Method Execution                  │
│   Your business logic runs here                         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         6. Service Layer (Optional)                     │
│   Business logic, database operations                   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         7. Repository/Entity Layer                      │
│   Database queries, ORM operations                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         8. Interceptors (After Handler)                 │
│   Response transformation, logging                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              9. Exception Filter                        │
│   Error handling and formatting                         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    HTTP Response                        │
│                    (JSON Data)                          │
└─────────────────────────────────────────────────────────┘
```

### Layered Architecture

```
┌────────────────────────────────────────┐
│         Presentation Layer             │
│   Controllers, Routes, Guards          │
├────────────────────────────────────────┤
│         Business Logic Layer           │
│   Services, DTOs, Validation           │
├────────────────────────────────────────┤
│         Data Access Layer              │
│   Repositories, Entities, Query        │
│   Builder, Transactions                │
├────────────────────────────────────────┤
│         Infrastructure Layer           │
│   Database, Cache, External APIs       │
└────────────────────────────────────────┘
```

---

## 🎯 Core Principles

### 1. Separation of Concerns

Each component has a single responsibility:

```typescript
// Controller: Handle HTTP
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("/:id")
  async findOne(@Param("id") id: string) {
    return await this.userService.findById(Number(id));
  }
}

// Service: Business Logic
@Injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async findById(id: number) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException("User not found");
    return user;
  }
}

// Repository: Data Access
@Injectable()
export class UserRepository extends Repository<User> {
  async findById(id: number) {
    return await this.findOne({ where: { id } });
  }
}
```

### 2. Dependency Injection

Loose coupling through constructor injection:

```typescript
@Injectable()
export class OrderService {
  constructor(
    private userService: UserService,
    private paymentService: PaymentService,
    private emailService: EmailService
  ) {}

  async createOrder(userId: number, items: any[]) {
    const user = await this.userService.findById(userId);
    const payment = await this.paymentService.process(items);
    await this.emailService.sendConfirmation(user.email);
    return { orderId: payment.id };
  }
}
```

### 3. Modularity

Organize code into cohesive modules:

```typescript
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService], // Share with other modules
})
export class UserModule {}
```

### 4. Declarative Programming

Use decorators to describe intent:

```typescript
@Controller("/api/products")
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor)
export class ProductController {
  @Get()
  @Cache(60) // Cache for 60 seconds
  findAll() {
    return { products: [] };
  }

  @Post()
  @UseGuards(AdminGuard)
  @UsePipes(ValidationPipe)
  create(@Body() dto: CreateProductDto) {
    return { message: "Created" };
  }
}
```

---

## 📊 Framework Comparison

### FynixJS vs Express

| Feature              | FynixJS                 | Express             |
| -------------------- | ----------------------- | ------------------- |
| TypeScript Support   | ✅ Built-in             | ⚠️ Manual setup     |
| Dependency Injection | ✅ Built-in             | ❌ None             |
| ORM                  | ✅ Built-in             | ❌ Manual           |
| Security             | ✅ JWT, bcrypt included | ❌ Manual           |
| Validation           | ✅ Decorator-based      | ❌ Manual           |
| Hot Reload           | ✅ Built-in             | ⚠️ Requires nodemon |
| Module System        | ✅ Yes                  | ❌ No               |
| Guards/Interceptors  | ✅ Yes                  | ⚠️ Middleware only  |
| Learning Curve       | Medium                  | Low                 |
| Best For             | Enterprise APIs         | Simple apps         |

### FynixJS vs NestJS

| Feature             | FynixJS                      | NestJS               |
| ------------------- | ---------------------------- | -------------------- |
| Bundle Size         | ✅ Lightweight               | ⚠️ Heavy             |
| Setup Complexity    | ✅ Zero config               | ⚠️ Complex           |
| Dependencies        | ✅ All built-in              | ⚠️ Many packages     |
| Database            | ✅ MySQL included            | ❌ Separate packages |
| Learning Curve      | Medium                       | Steep                |
| Documentation       | ✅ Focused                   | ✅ Comprehensive     |
| Enterprise Features | ✅ Yes                       | ✅ Yes               |
| Community           | Growing                      | Large                |
| Best For            | Fast prototypes, small teams | Large enterprises    |

### FynixJS vs Fastify

| Feature      | FynixJS            | Fastify       |
| ------------ | ------------------ | ------------- |
| Performance  | ✅ High            | ✅ Highest    |
| TypeScript   | ✅ First-class     | ⚠️ Good       |
| ORM          | ✅ Built-in        | ❌ Manual     |
| Security     | ✅ Built-in        | ⚠️ Plugins    |
| DI Container | ✅ Yes             | ❌ No         |
| Ecosystem    | Built-in           | Plugin-based  |
| Best For     | Complete framework | Microservices |

---

## ✅ When to Use FynixJS

### Perfect For:

1. **REST APIs with Database**

   - CRUD applications
   - Business applications
   - Backend for mobile/web apps

2. **Projects Requiring Security**

   - User authentication
   - Role-based access
   - API protection

3. **TypeScript Projects**

   - Type-safe development
   - Modern ES features
   - Better IDE support

4. **Teams Familiar with NestJS**

   - Similar patterns
   - Easier learning curve
   - Lightweight alternative

5. **Rapid Prototyping**
   - Zero configuration
   - Fast setup
   - Built-in features

### Not Ideal For:

1. **Microservices at Scale**

   - Consider Fastify or NestJS
   - Need for service mesh

2. **GraphQL-First APIs**

   - Better alternatives available
   - Limited GraphQL support

3. **Non-MySQL Databases**

   - Currently MySQL only
   - Use Prisma/TypeORM if needed

4. **Real-time Heavy Apps**
   - WebSocket support is basic
   - Consider Socket.io directly

---

## 📁 Project Structure

### Recommended Structure

```
my-app/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── auth/                      # Auth feature module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   │
│   ├── users/                     # Users feature module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── products/                  # Products feature module
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── products.repository.ts
│   │   └── entities/
│   │       └── product.entity.ts
│   │
│   ├── common/                    # Shared utilities
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── interfaces/
│   │       └── response.interface.ts
│   │
│   └── config/                    # Configuration
│       ├── database.config.ts
│       └── app.config.ts
│
├── test/                          # Tests
│   ├── unit/
│   └── integration/
│
├── public/                        # Static files
│   ├── index.html
│   └── assets/
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Installation

```bash
npm install @fynixjs/fynix
```

### Basic Setup

```typescript
// src/main.ts
import { FynixFactory, Module, Controller, Get } from "@fynixjs/fynix";

@Controller("/")
export class AppController {
  @Get()
  home() {
    return { message: "Welcome to FynixJS!" };
  }
}

@Module({
  controllers: [AppController],
})
export class AppModule {}

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();
  await app.listen(3000);
  console.log("🚀 Server running on http://localhost:3000");
}

bootstrap();
```

### Run Application

```bash
# Development with hot reload
npx fynix dev

# Production
node dist/main.js
```

### Test API

```bash
curl http://localhost:3000
# {"message":"Welcome to FynixJS!"}
```

---

## 📚 Next Steps

- **[02-DEPENDENCY_INJECTION.md](./02-DEPENDENCY_INJECTION.md)** - Learn DI patterns
- **[03-MODULES_ARCHITECTURE.md](./03-MODULES_ARCHITECTURE.md)** - Organize your code
- **[04-CONTROLLERS_ROUTING.md](./04-CONTROLLERS_ROUTING.md)** - Handle HTTP requests
- **[05-DATABASE_ORM.md](./05-DATABASE_ORM.md)** - Work with databases
- **[06-SECURITY_AUTH.md](./06-SECURITY_AUTH.md)** - Secure your API

---

## 💡 Key Takeaways

✅ FynixJS is a batteries-included framework  
✅ Zero configuration for rapid development  
✅ TypeScript-first with excellent type safety  
✅ NestJS-inspired but lighter and simpler  
✅ Perfect for REST APIs with MySQL databases  
✅ Built-in security, ORM, and hot reload  
✅ Modular architecture for scalability

---

**Ready to build?** Continue to the next guide to learn about Dependency Injection!
