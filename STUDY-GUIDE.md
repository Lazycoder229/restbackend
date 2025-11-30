# 📚 RestJS Framework - Study Guide

Quick reference to understand how everything works in your framework.

---

## 🎯 Core Concepts

### 1. Decorators (The Magic Syntax)

Decorators are functions that modify classes/methods. They use `@` syntax:

```typescript
@Controller("/users") // ← Class decorator
class UsersController {
  @Get() // ← Method decorator
  getUsers() {}
}
```

**How they work:**

- Run at **compile time** (when TypeScript processes your code)
- Store metadata using `Reflect.metadata()` from `reflect-metadata` package
- Framework reads this metadata at runtime to know routes, dependencies, etc.

**Example - Controller decorator:**

```typescript
// src/decorators/controller.decorator.ts
export function Controller(path: string = ""): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata("path", path, target); // Store the path
    Reflect.defineMetadata("isController", true, target);
  };
}
```

---

### 2. Dependency Injection (DI Container)

**Problem it solves:** Manually creating instances is tedious

```typescript
// Without DI - manual work 😞
const db = new DatabaseService();
const userRepo = new UserRepository(db);
const userService = new UserService(userRepo);
const controller = new UserController(userService);
```

**With DI - automatic! 😊**

```typescript
@Controller()
class UserController {
  constructor(private userService: UserService) {} // ← Auto-injected!
}
```

**How it works:**

1. `@Injectable()` marks a class as injectable
2. Container stores class constructors in a `Map`
3. When you need an instance, container:
   - Reads constructor parameters using `Reflect.getMetadata("design:paramtypes")`
   - Creates dependencies first (recursive)
   - Creates your class with dependencies injected

**Code:** `src/core/container.ts`

---

### 3. Module System

Modules organize your app into logical sections:

```typescript
@Module({
  controllers: [UserController], // HTTP endpoints
  providers: [UserService], // Injectable services
  imports: [DatabaseModule], // Other modules
  exports: [UserService], // Share with other modules
})
export class UserModule {}
```

**How it works:**

- `ModuleContainer` processes all modules on startup
- Registers all providers in the DI container
- Scans controllers to build route map

**Code:** `src/core/module-container.ts`

---

## 🛣️ Request Flow

```
1. HTTP Request arrives
   ↓
2. RestApplication.handleRequest()
   ↓
3. Find matching route from cache (fast!)
   ↓
4. Run Guards (authentication checks)
   ↓
5. Run Interceptors (before)
   ↓
6. Execute controller method
   ↓
7. Run Interceptors (after)
   ↓
8. Send response
```

**Code:** `src/core/rest-application.ts` (line 250+)

---

## 🔥 Hot Reload Feature

**How it works:**

1. **Start watching:**

```typescript
app.enableHotReload(); // Enables file watching
```

2. **fs.watch detects changes:**

```typescript
fs.watch("src", { recursive: true }, (eventType, filename) => {
  // File changed!
  scheduleReload(filename);
});
```

3. **Debounce multiple changes:**

```typescript
setTimeout(() => {
  clearRequireCache(); // Remove cached modules
  process.exit(0); // Restart process
}, 500);
```

4. **Process manager (like nodemon) restarts your app automatically**

**Code:** `src/core/hot-reload.ts`

---

## 📊 Performance Optimizations

### 1. Route Caching

Instead of checking routes on every request:

```typescript
// ❌ Slow - loop through all routes each request
routes.forEach((route) => {
  if (route.method === "GET" && route.path.match(url)) {
  }
});

// ✅ Fast - pre-compile regex patterns, store in Map
this.routeCache.set("GET", compiledRoutes);
```

### 2. Parameter Extraction

```typescript
// Pre-calculate parameter positions
const compiled = {
  pattern: /^\/users\/([^/]+)$/, // Compiled regex
  paramNames: ["id"], // Know what to extract
  paramIndices: [0], // Array position
};

// Fast extraction during request
const match = url.match(compiled.pattern);
const params = { id: match[1] }; // Direct access!
```

**Code:** `src/core/rest-application.ts` (line 180+)

---

## 🗄️ Database & ORM

### Query Builder Pattern

```typescript
const users = await db
  .select("*")
  .from("users")
  .where("age", ">", 18)
  .limit(10)
  .execute();
```

**How it works:**

- Each method returns `this` (method chaining)
- `execute()` builds SQL string and runs query

**Code:** `src/builtin/query-builder.ts`

### Repository Pattern

```typescript
class User extends Repository<User> {
  tableName = "users";
}

// Usage
await User.findById(1);
await User.create({ name: "John" });
```

**Code:** `src/builtin/repository.ts`

---

## 🔐 Security Features

### 1. JWT Authentication

```typescript
// Generate token
const token = securityService.generateToken({ userId: 1 });

// Verify token
@UseGuards(JwtAuthGuard)
@Get("/profile")
getProfile() {}
```

**How guards work:**

1. Guard runs before controller method
2. Returns `true` = allow, `false` = block (403 Forbidden)
3. Can attach data to request: `req.user = decoded`

**Code:** `src/builtin/jwt-auth.guard.ts`

### 2. Password Hashing

```typescript
// Hash password (bcrypt)
const hashed = await securityService.hashPassword("secret123");

// Compare
const valid = await securityService.comparePassword("secret123", hashed);
```

**Code:** `src/builtin/security.service.ts`

---

## 🎓 Study Path

### Week 1: Basics

1. Read `01-GETTING_STARTED.md` - Build first app
2. Study `src/decorators/` - Understand decorators
3. Experiment with controllers and routes

### Week 2: Architecture

1. Read `03-CREATING_MODULES.md` - Module system
2. Study `src/core/container.ts` - DI container
3. Study `src/core/module-container.ts` - Module resolution

### Week 3: Advanced

1. Study `src/core/rest-application.ts` - Request handling
2. Read `10-MIDDLEWARE_INTERCEPTORS.md` - Guards/interceptors
3. Study `src/core/hot-reload.ts` - File watching

### Week 4: Database & Security

1. Read `04-ORM_GUIDE.md` - Database patterns
2. Read `05-SECURITY_GUIDE.md` - JWT, bcrypt
3. Study `src/builtin/` - Built-in features

---

## 🔬 Hands-On Experiments

### Experiment 1: Create Custom Decorator

```typescript
// src/decorators/custom.decorator.ts
export function RateLimit(maxRequests: number): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata("rateLimit", maxRequests, target, propertyKey);
  };
}

// Usage
@Get()
@RateLimit(100)  // 100 requests per minute
getData() {}
```

### Experiment 2: Create Custom Guard

```typescript
export class AdminGuard implements RestGuard {
  canActivate(req: any): boolean {
    return req.user?.role === "admin";
  }
}
```

### Experiment 3: Create Custom Interceptor

```typescript
export class TimingInterceptor implements RestInterceptor {
  async intercept(req: any, res: any, next: () => Promise<any>) {
    const start = Date.now();
    const result = await next();
    console.log(`Request took ${Date.now() - start}ms`);
    return result;
  }
}
```

---

## 📖 Key Files to Study

| File                           | What to Learn        | Difficulty  |
| ------------------------------ | -------------------- | ----------- |
| `src/index.ts`                 | Public API exports   | ⭐ Easy     |
| `src/decorators/*.ts`          | How decorators work  | ⭐⭐ Medium |
| `src/core/container.ts`        | Dependency injection | ⭐⭐⭐ Hard |
| `src/core/rest-application.ts` | Request handling     | ⭐⭐⭐ Hard |
| `src/core/hot-reload.ts`       | File watching        | ⭐⭐ Medium |
| `src/builtin/*.ts`             | Real-world features  | ⭐⭐ Medium |

---

## 🤔 Common Questions

### Q: Why use decorators?

**A:** Clean syntax! Compare:

```typescript
// With decorators (RestJS)
@Get("/users")
getUsers() {}

// Without decorators
router.get("/users", controller.getUsers.bind(controller));
```

### Q: What is `Reflect.metadata`?

**A:** Stores metadata on classes/methods. Like adding invisible tags:

```typescript
Reflect.defineMetadata("path", "/users", MyClass);
const path = Reflect.getMetadata("path", MyClass); // "/users"
```

### Q: Why use TypeScript?

**A:** Type safety + decorators + better DX:

```typescript
// TypeScript knows the types!
constructor(private userService: UserService) {} // ✅ Auto-complete works
```

### Q: How does hot reload work without nodemon?

**A:** It uses `fs.watch` to detect changes, then `process.exit(0)`. Your terminal process manager (like npm scripts or pm2) restarts the process automatically.

---

## 🚀 Next Steps

1. **Clone and experiment:**

   ```bash
   npx @restsjsapp/create my-test-app
   cd my-test-app
   npm install
   npm start
   ```

2. **Add breakpoints** in VS Code to see execution flow

3. **Read the code** - Start from `src/index.ts` and follow imports

4. **Build something** - Best way to learn is by doing!

---

## 💡 Pro Tips

- Use `console.log` liberally while learning
- Study one concept at a time (don't try to understand everything at once)
- The framework is just ~2000 lines of code - very readable!
- Compare with NestJS source code to see similarities
- Read TypeScript decorators documentation

---

**Good luck with your studies! 🎓**

The best way to understand this framework is to **use it** and **read the source code**.
Start small, build up gradually.
