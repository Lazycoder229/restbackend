# Core Concepts

Understanding the core concepts of FynixJS will help you build better applications.

---

## 🎯 Architecture Overview

FynixJS follows a modular, layered architecture inspired by NestJS:

```
┌─────────────────────────────────────────┐
│          HTTP Request                   │
├─────────────────────────────────────────┤
│         Guards (Auth Check)             │
├─────────────────────────────────────────┤
│    Interceptors (Before Handler)        │
├─────────────────────────────────────────┤
│     Pipes (Validation/Transform)        │
├─────────────────────────────────────────┤
│         Controller (Route)              │
├─────────────────────────────────────────┤
│      Service (Business Logic)           │
├─────────────────────────────────────────┤
│    Repository/Entity (Database)         │
├─────────────────────────────────────────┤
│    Interceptors (After Handler)         │
├─────────────────────────────────────────┤
│          HTTP Response                  │
└─────────────────────────────────────────┘
```

---

## 🏗️ Key Components

### 1. Decorators

Decorators are TypeScript's way of adding metadata to classes and methods. FynixJS uses decorators extensively.

**How Decorators Work:**

```typescript
// Decorators run at compile time
@Controller("/users") // ← This is a decorator
export class UserController {
  @Get() // ← Method decorator
  getUsers() {}
}
```

Behind the scenes:

```typescript
// The @Controller decorator does this:
function Controller(path: string) {
  return (target: any) => {
    Reflect.defineMetadata("path", path, target);
  };
}
```

**Why Use Decorators?**

- ✅ Clean, readable syntax
- ✅ Declarative programming style
- ✅ Metadata-driven architecture
- ✅ Better code organization

---

### 2. Dependency Injection (DI)

DI automatically creates and provides instances of classes you need.

**Without DI (Manual):**

```typescript
const db = new DatabaseService();
const userRepo = new UserRepository(db);
const userService = new UserService(userRepo);
const controller = new UserController(userService);
```

**With DI (Automatic):**

```typescript
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}
  // FynixJS automatically creates and injects UserService!
}
```

**How It Works:**

1. Mark classes as `@Injectable()`
2. Register them in a module's `providers` array
3. FynixJS container creates instances automatically
4. Dependencies are resolved recursively

```typescript
@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}
  // DatabaseService is auto-injected
}

@Module({
  providers: [DatabaseService, UserService],
  controllers: [UserController],
})
export class AppModule {}
```

---

### 3. Modules

Modules organize your application into logical units.

**Module Structure:**

```typescript
@Module({
  imports: [OtherModule], // Import other modules
  controllers: [UserController], // HTTP endpoints
  providers: [UserService], // Injectable services
  exports: [UserService], // Share with other modules
})
export class UserModule {}
```

**Why Use Modules?**

- ✅ Organize code by feature
- ✅ Encapsulate functionality
- ✅ Control visibility (exports)
- ✅ Lazy loading support
- ✅ Better testability

**Example - Feature Module:**

```typescript
// user.module.ts
@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService], // Other modules can use UserService
})
export class UserModule {}

// app.module.ts
@Module({
  imports: [UserModule], // Import UserModule
  controllers: [AppController],
})
export class AppModule {}
```

---

### 4. Controllers

Controllers handle HTTP requests and return responses.

```typescript
@Controller("/users")
export class UserController {
  @Get()
  findAll() {
    return [{ id: 1, name: "John" }];
  }

  @Get("/:id")
  findOne(@Param("id") id: string) {
    return { id, name: "John" };
  }

  @Post()
  create(@Body() body: any) {
    return { message: "User created", data: body };
  }
}
```

**Controller Features:**

- Route definition with decorators
- Parameter extraction (`@Param`, `@Query`, `@Body`)
- Guards and interceptors
- Dependency injection

---

### 5. Providers (Services)

Providers contain business logic and are injectable.

```typescript
@Injectable()
export class UserService {
  private users = [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
  ];

  findAll() {
    return this.users;
  }

  findById(id: number) {
    return this.users.find((user) => user.id === id);
  }

  create(userData: any) {
    const newUser = { id: Date.now(), ...userData };
    this.users.push(newUser);
    return newUser;
  }
}
```

**Provider Scopes:**

```typescript
@Injectable({ scope: Scope.SINGLETON }) // Default - one instance
export class SingletonService {}

@Injectable({ scope: Scope.TRANSIENT }) // New instance each time
export class TransientService {}
```

---

## 🔄 Request Lifecycle

Understanding the request flow:

```
1. Incoming HTTP Request
   ↓
2. Route Matching (fast path-based lookup)
   ↓
3. Guards Execution (authentication, authorization)
   ↓ (if guard returns true)
4. Interceptors (before) - request transformation
   ↓
5. Pipes - validation and transformation
   ↓
6. Controller Method Execution
   ↓
7. Interceptors (after) - response transformation
   ↓
8. HTTP Response Sent
```

**Example with All Layers:**

```typescript
@Controller("/admin")
@UseGuards(JwtAuthGuard, AdminGuard) // Step 3
@UseInterceptors(LoggingInterceptor) // Step 4 & 7
export class AdminController {
  @Get("/users")
  @UsePipes(ValidationPipe) // Step 5
  getUsers(@Query() query: any) {
    // Step 6
    return { users: [] };
  }
}
```

---

## 🗄️ Container System

The DI container manages all instances:

**Container Responsibilities:**

1. **Register** providers from modules
2. **Resolve** dependencies recursively
3. **Create** instances (singleton or transient)
4. **Cache** singleton instances
5. **Inject** dependencies into constructors

**Example Flow:**

```typescript
// 1. Registration
@Module({
  providers: [DatabaseService, UserService],
})
// 2. Resolution when UserController is created
@Controller()
class UserController {
  constructor(private userService: UserService) {
    // Container checks: Do I have UserService?
    // UserService needs DatabaseService
    // Container creates DatabaseService first
    // Then creates UserService with DatabaseService
    // Finally injects UserService here
  }
}
```

---

## 🎨 Design Patterns

FynixJS implements several design patterns:

### 1. **Dependency Injection Pattern**

- Loose coupling between components
- Easy testing and mocking

### 2. **Active Record Pattern**

- Entities contain both data and behavior
- Example: `User.findAll()`, `user.save()`

### 3. **Repository Pattern**

- Abstraction over data access
- Testable and swappable data sources

### 4. **Chain of Responsibility**

- Guards, interceptors, pipes
- Sequential processing of requests

### 5. **Factory Pattern**

- `FynixFactory.create()` creates applications
- Encapsulates creation logic

---

## 🧪 Testing Concepts

FynixJS is designed for testability:

```typescript
describe("UserService", () => {
  let service: UserService;
  let mockDb: DatabaseService;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    } as any;

    service = new UserService(mockDb);
  });

  it("should find users", async () => {
    mockDb.query.mockResolvedValue([{ id: 1 }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });
});
```

---

## 🔧 Configuration

FynixJS applications are configured through:

1. **Environment Variables** - `.env` file
2. **Module Metadata** - `@Module()` decorator
3. **Application Methods** - `app.setGlobalPrefix()`, etc.

```typescript
// Environment
process.env.PORT = "3000";
process.env.JWT_SECRET = "secret";

// Module
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'CONFIG',
      useValue: { apiKey: '123' }
    }
  ]
})

// Application
const app = await FynixFactory.create(AppModule);
app.setGlobalPrefix("/api");
app.useGlobalInterceptors(new LoggingInterceptor());
```

---

## 🚀 Performance Optimizations

FynixJS includes built-in optimizations:

1. **Route Caching** - Pre-compiled regex patterns
2. **Singleton Pattern** - Services created once
3. **Lazy Loading** - Modules loaded on demand
4. **Connection Pooling** - Database connections reused
5. **Response Buffering** - Efficient HTTP responses

---

## 📚 Next Steps

- [Controllers & Routing](./03-CONTROLLERS.md)
- [Modules](./04-MODULES.md)
- [Database & ORM](./05-DATABASE.md)
- [Security](./06-SECURITY.md)

---

**Understanding these concepts will help you build scalable, maintainable applications with FynixJS!**
