# 17 - Migration Guide

## 🔄 Switching to FynixJS

Complete guide for migrating from Express.js, NestJS, and Fastify to FynixJS.

---

## 📊 Framework Comparison

| Feature              | Express.js           | NestJS             | Fastify      | **FynixJS**        |
| -------------------- | -------------------- | ------------------ | ------------ | ------------------ |
| TypeScript Support   | ⚠️ Manual            | ✅ Built-in        | ✅ Built-in  | ✅ **Built-in**    |
| Dependency Injection | ❌ No                | ✅ Yes             | ⚠️ Plugin    | ✅ **Yes**         |
| Decorators           | ❌ No                | ✅ Yes             | ❌ No        | ✅ **Yes**         |
| ORM Integration      | ⚠️ Manual            | ⚠️ TypeORM         | ⚠️ Manual    | ✅ **Built-in**    |
| Authentication       | ⚠️ Passport.js       | ⚠️ Passport.js     | ⚠️ Manual    | ✅ **Built-in**    |
| Validation           | ⚠️ express-validator | ✅ class-validator | ⚠️ ajv       | ✅ **Built-in**    |
| Hot Reload           | ⚠️ nodemon           | ⚠️ Manual          | ⚠️ Manual    | ✅ **Built-in**    |
| Configuration        | ⚠️ Manual            | ⚠️ Manual          | ✅ Good      | ✅ **Zero-config** |
| Learning Curve       | 🟢 Easy              | 🔴 Steep           | 🟡 Medium    | 🟢 **Easy**        |
| Performance          | 🟡 Good              | 🟡 Good            | 🟢 Excellent | 🟢 **Excellent**   |
| Bundle Size          | 🟢 Small             | 🔴 Large           | 🟢 Small     | 🟡 **Medium**      |

---

## 🚀 From Express.js

### Basic Route Comparison

#### Express.js

```javascript
const express = require("express");
const app = express();

app.get("/users", (req, res) => {
  res.json([{ id: 1, name: "John" }]);
});

app.get("/users/:id", (req, res) => {
  const id = req.params.id;
  res.json({ id, name: "John" });
});

app.post("/users", express.json(), (req, res) => {
  const user = req.body;
  res.status(201).json(user);
});

app.listen(3000);
```

#### FynixJS

```typescript
import {
  FynixFactory,
  Module,
  Controller,
  Get,
  Post,
  Param,
  Body,
} from "@fynixjs/fynix";

@Controller("/users")
export class UserController {
  @Get()
  getUsers() {
    return [{ id: 1, name: "John" }];
  }

  @Get("/:id")
  getUser(@Param("id") id: string) {
    return { id, name: "John" };
  }

  @Post()
  createUser(@Body() user: any) {
    return user;
  }
}

@Module({
  controllers: [UserController],
})
export class AppModule {}

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();
  await app.listen(3000);
}

bootstrap();
```

### Middleware → Interceptors

#### Express.js

```javascript
// Middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

#### FynixJS

```typescript
@Injectable()
export class LoggingInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    console.log(`[${req.method}] ${req.url}`);
    return await next.handle();
  }
}

// Use globally
app.useGlobalInterceptors(new LoggingInterceptor());
```

### Authentication

#### Express.js

```javascript
const jwt = require("jsonwebtoken");

// Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, "secret");
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

app.get("/protected", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
```

#### FynixJS

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(" ")[1];

    if (!token) return false;

    try {
      const decoded = jwt.verify(token, "secret");
      request.user = decoded;
      return true;
    } catch {
      return false;
    }
  }
}

@Controller()
export class ApiController {
  @Get("/protected")
  @UseGuards(JwtAuthGuard)
  getProtected(@Req() req: any) {
    return { user: req.user };
  }
}
```

---

## 🏗️ From NestJS

FynixJS is inspired by NestJS, so migration is straightforward!

### Key Differences

| Aspect             | NestJS                | FynixJS                |
| ------------------ | --------------------- | ---------------------- |
| ORM                | TypeORM (separate)    | Built-in Active Record |
| Configuration      | ConfigModule required | Zero-config            |
| CLI                | Full CLI tooling      | Simple CLI             |
| Modules            | More complex          | Simplified             |
| Learning Resources | Extensive             | Growing                |

### Module Structure (Almost Identical!)

#### NestJS

```typescript
import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

#### FynixJS

```typescript
import { Module } from "@fynixjs/fynix";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

**✅ No changes needed!** Copy-paste your module structure.

### Controllers (Nearly Identical)

#### NestJS

```typescript
import { Controller, Get, Post, Body, Param } from "@nestjs/common";

@Controller("users")
export class UserController {
  @Get()
  findAll() {
    return [];
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return { id };
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return dto;
  }
}
```

#### FynixJS

```typescript
import { Controller, Get, Post, Body, Param } from "@fynixjs/fynix";

@Controller("/users") // Note: FynixJS uses "/" prefix
export class UserController {
  @Get()
  findAll() {
    return [];
  }

  @Get("/:id") // Note: FynixJS uses "/:id" format
  findOne(@Param("id") id: string) {
    return { id };
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return dto;
  }
}
```

**Changes:**

- Add `/` prefix to `@Controller("/users")`
- Use `"/:id"` instead of `":id"` in routes

### Services (Identical!)

#### NestJS & FynixJS (Same!)

```typescript
import { Injectable } from "@fynixjs/fynix"; // or @nestjs/common

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll() {
    return await this.userRepository.find();
  }
}
```

**✅ No changes needed!**

### Database: TypeORM → FynixJS ORM

#### NestJS (TypeORM)

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;
}

// Usage
const users = await this.userRepository.find();
```

#### FynixJS (Built-in ORM)

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
}

// Usage (Active Record)
const users = await User.find();
```

**Changes:**

- Extend `BaseEntity`
- Use Active Record pattern (simpler!)
- Specify table name in `@Entity("users")`

### Migration Checklist

- [ ] Replace `@nestjs/common` with `@fynixjs/fynix` in imports
- [ ] Add `/` prefix to controller routes
- [ ] Update route parameters to `/:id` format
- [ ] Replace TypeORM with FynixJS entities (extend BaseEntity)
- [ ] Update database connection code
- [ ] Test all endpoints

---

## ⚡ From Fastify

### Basic Route Comparison

#### Fastify

```javascript
const fastify = require("fastify")();

fastify.get("/users", async (request, reply) => {
  return [{ id: 1, name: "John" }];
});

fastify.get("/users/:id", async (request, reply) => {
  const { id } = request.params;
  return { id, name: "John" };
});

fastify.post("/users", async (request, reply) => {
  const user = request.body;
  return user;
});

fastify.listen({ port: 3000 });
```

#### FynixJS

```typescript
import {
  FynixFactory,
  Module,
  Controller,
  Get,
  Post,
  Param,
  Body,
} from "@fynixjs/fynix";

@Controller("/users")
export class UserController {
  @Get()
  getUsers() {
    return [{ id: 1, name: "John" }];
  }

  @Get("/:id")
  getUser(@Param("id") id: string) {
    return { id, name: "John" };
  }

  @Post()
  createUser(@Body() user: any) {
    return user;
  }
}

@Module({
  controllers: [UserController],
})
export class AppModule {}

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();
  await app.listen(3000);
}

bootstrap();
```

### Hooks → Interceptors

#### Fastify

```javascript
fastify.addHook("onRequest", async (request, reply) => {
  console.log(`[${request.method}] ${request.url}`);
});

fastify.addHook("preHandler", async (request, reply) => {
  // Auth check
  if (!request.headers.authorization) {
    reply.code(401).send({ error: "Unauthorized" });
  }
});
```

#### FynixJS

```typescript
@Injectable()
export class LoggingInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    console.log(`[${req.method}] ${req.url}`);
    return await next.handle();
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization;
  }
}

// Use
@UseInterceptors(LoggingInterceptor)
@UseGuards(AuthGuard)
@Get("/protected")
getProtected() {}
```

### Validation

#### Fastify

```javascript
const schema = {
  body: {
    type: "object",
    required: ["name", "email"],
    properties: {
      name: { type: "string", minLength: 2 },
      email: { type: "string", format: "email" },
    },
  },
};

fastify.post("/users", { schema }, async (request, reply) => {
  return request.body;
});
```

#### FynixJS

```typescript
import { IsString, IsEmail, IsNotEmpty, MinLength } from "@fynixjs/fynix";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

@Post()
@UsePipes(ValidationPipe)
createUser(@Body() dto: CreateUserDto) {
  return dto;
}
```

---

## 🎯 Migration Strategy

### Step-by-Step Migration

#### 1. **Start Small**

- Migrate one module/route at a time
- Test thoroughly before moving on
- Keep old and new code separate initially

#### 2. **Project Structure**

```
my-app/
├── src/
│   ├── main.ts              # Bootstrap file
│   ├── app.module.ts        # Root module
│   ├── users/               # Feature module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── entities/
│   │       └── user.entity.ts
```

#### 3. **Install Dependencies**

```bash
npm install @fynixjs/fynix
npm install -D typescript ts-node @types/node
```

#### 4. **Configure TypeScript**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "strict": true
  }
}
```

#### 5. **Update Imports**

**Find and Replace:**

```typescript
// Express
import express from "express";
// Replace with
import { FynixFactory, Controller, Get } from "@fynixjs/fynix";

// NestJS
import { Controller } from "@nestjs/common";
// Replace with
import { Controller } from "@fynixjs/fynix";

// Fastify
const fastify = require("fastify");
// Replace with
import { FynixFactory } from "@fynixjs/fynix";
```

#### 6. **Convert Routes**

Use this pattern for each route:

```typescript
// Old (any framework)
app.get("/users", handler);

// New (FynixJS)
@Controller("/users")
export class UserController {
  @Get()
  handler() {}
}
```

#### 7. **Test Everything**

- Unit tests
- Integration tests
- Manual testing
- Performance testing

---

## 💡 Pro Tips

### 1. **Gradual Migration**

Run both servers side-by-side:

```typescript
// Old server on port 3000
// New FynixJS server on port 4000
// Use nginx to route gradually
```

### 2. **Code Reuse**

Most business logic can be reused:

```typescript
// ✅ Keep your existing services
// ✅ Keep your database models (with minor changes)
// ✅ Keep your DTOs
// ❌ Change: route handlers → controllers
// ❌ Change: middleware → interceptors/guards
```

### 3. **Performance**

FynixJS is fast! But benchmark your app:

```bash
# Before
ab -n 1000 -c 10 http://localhost:3000/api

# After
ab -n 1000 -c 10 http://localhost:4000/api
```

---

## 📈 Benefits of Switching

### Why Migrate to FynixJS?

✅ **Better Developer Experience**

- TypeScript-first design
- Decorator-based routing
- Built-in dependency injection

✅ **Less Configuration**

- Zero-config setup
- Built-in ORM
- Built-in authentication

✅ **Easier Maintenance**

- Cleaner code structure
- Better testability
- Standardized patterns

✅ **Modern Features**

- Hot reload
- GraphQL support
- WebSocket support
- Built-in caching

---

## 🔗 Resources

- [Getting Started](./00-GETTING_STARTED.md) - Setup guide
- [Quick Reference](./15-QUICK_REFERENCE.md) - API cheat sheet
- [Best Practices](./13-BEST_PRACTICES.md) - Patterns and tips
- [Troubleshooting](./16-TROUBLESHOOTING.md) - Common issues

---

## ❓ FAQ

**Q: Will my app be faster with FynixJS?**  
A: Performance is similar to Fastify/Express. Focus on better DX and maintainability.

**Q: Can I migrate gradually?**  
A: Yes! Migrate one module at a time while keeping the old system running.

**Q: How long does migration take?**  
A: Small apps: 1-2 days. Medium apps: 1-2 weeks. Large apps: 1-2 months.

**Q: Do I need to rewrite tests?**  
A: Most test logic can be reused. Update imports and test setup code.

**Q: Is it production-ready?**  
A: Yes! FynixJS is stable and ready for production use.

---

**Ready to migrate? Start with one module and gradually expand! 🚀**
