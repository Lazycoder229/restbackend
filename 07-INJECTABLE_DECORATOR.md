# Injectable Decorator Documentation

## Overview

The Injectable Decorator marks a class as a provider that can be injected into other classes via dependency injection. This is a core feature of the Fynix framework that enables loose coupling, testability, and modular architecture.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Provider Scopes](#provider-scopes)
- [Usage Examples](#usage-examples)
- [Dependency Injection Patterns](#dependency-injection-patterns)
- [Best Practices](#best-practices)
- [Advanced Patterns](#advanced-patterns)
- [Troubleshooting](#troubleshooting)

---

## Installation & Setup

```typescript
import "reflect-metadata";
import { Injectable } from "./decorators/injectable.decorator";
```

---

## Basic Usage

Mark a class as injectable to use it with dependency injection:

```typescript
@Injectable()
export class UserService {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}

// Inject into controller
@Controller("/api/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("/")
  listUsers() {
    return this.userService.findAll();
  }
}
```

---

## API Reference

### @Injectable

**Signature:**

```typescript
@Injectable(options?: ProviderMetadata): ClassDecorator
```

**Parameters:**

- `options` (optional): Provider configuration
  - `scope?: Scope` - Lifecycle scope (default: `Scope.DEFAULT`)

**Returns:** `ClassDecorator`

**Metadata Key:** `INJECTABLE_METADATA`

**Example:**

```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestService {
  // This service is created per request
}
```

---

## Provider Scopes

### Scope.DEFAULT (Singleton)

Default scope. One instance shared across the entire application.

```typescript
@Injectable() // or @Injectable({ scope: Scope.DEFAULT })
export class DatabaseService {
  private connection: any;

  constructor() {
    this.connection = this.createConnection();
  }

  private createConnection() {
    console.log("Creating database connection");
    return {};
  }
}
```

**Characteristics:**

- Single instance created at application startup
- Shared across all requests and controllers
- Best for stateless services
- Most efficient (no overhead)

### Scope.REQUEST

New instance created per HTTP request.

```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private requestId: string;

  constructor() {
    this.requestId = Math.random().toString(36);
  }

  getRequestId() {
    return this.requestId;
  }
}
```

**Characteristics:**

- New instance for each request
- Not shared between requests
- Useful for request-specific state
- Higher memory overhead

### Scope.TRANSIENT

New instance created each time it's injected.

```typescript
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private timestamp: number;

  constructor() {
    this.timestamp = Date.now();
  }

  log(message: string) {
    console.log(`[${this.timestamp}] ${message}`);
  }
}
```

**Characteristics:**

- New instance every injection
- No sharing at all
- Highest memory overhead
- Use sparingly

---

## Usage Examples

### Service Layer

```typescript
@Injectable()
export class UserService {
  private users: any[] = [];

  async findAll() {
    return this.users;
  }

  async findById(id: string) {
    return this.users.find((user) => user.id === id);
  }

  async create(userData: any) {
    const user = { id: Date.now().toString(), ...userData };
    this.users.push(user);
    return user;
  }

  async update(id: string, userData: any) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...userData };
      return this.users[index];
    }
    return null;
  }

  async delete(id: string) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }
}
```

### Repository Pattern

```typescript
@Injectable()
export class UserRepository {
  constructor(private database: DatabaseService) {}

  async find(query: any) {
    return this.database.query("SELECT * FROM users WHERE ?", query);
  }

  async findOne(id: string) {
    return this.database.query("SELECT * FROM users WHERE id = ?", [id]);
  }

  async create(data: any) {
    return this.database.query("INSERT INTO users SET ?", data);
  }

  async update(id: string, data: any) {
    return this.database.query("UPDATE users SET ? WHERE id = ?", [data, id]);
  }

  async delete(id: string) {
    return this.database.query("DELETE FROM users WHERE id = ?", [id]);
  }
}
```

### Service Dependencies

```typescript
@Injectable()
export class EmailService {
  async send(to: string, subject: string, body: string) {
    console.log(`Sending email to ${to}: ${subject}`);
    return { sent: true };
  }
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private emailService: EmailService
  ) {}

  async register(userData: any) {
    const user = await this.userService.create(userData);
    await this.emailService.send(
      user.email,
      "Welcome!",
      "Thank you for registering"
    );
    return user;
  }

  async login(email: string, password: string) {
    const users = await this.userService.findAll();
    const user = users.find((u) => u.email === email);

    if (user && this.verifyPassword(password, user.passwordHash)) {
      return { token: this.generateToken(user) };
    }

    throw new Error("Invalid credentials");
  }

  private verifyPassword(password: string, hash: string): boolean {
    return true; // Implement actual verification
  }

  private generateToken(user: any): string {
    return "jwt_token"; // Implement actual token generation
  }
}
```

### Configuration Service

```typescript
@Injectable()
export class ConfigService {
  private config: any = {
    database: {
      host: "localhost",
      port: 3306,
      username: "root",
      password: "",
      database: "myapp",
    },
    jwt: {
      secret: "secret_key",
      expiresIn: "1d",
    },
    email: {
      host: "smtp.example.com",
      port: 587,
      username: "user",
      password: "pass",
    },
  };

  get(key: string): any {
    return key.split(".").reduce((obj, k) => obj?.[k], this.config);
  }

  set(key: string, value: any): void {
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    const target = keys.reduce(
      (obj, k) => (obj[k] = obj[k] || {}),
      this.config
    );
    target[lastKey] = value;
  }
}

// Usage
@Injectable()
export class DatabaseService {
  constructor(private config: ConfigService) {
    const dbConfig = this.config.get("database");
    console.log("Connecting to:", dbConfig.host);
  }
}
```

### Logging Service

```typescript
@Injectable()
export class LoggerService {
  log(message: string, context?: string) {
    console.log(`[LOG] ${context ? `[${context}] ` : ""}${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[ERROR] ${context ? `[${context}] ` : ""}${message}`);
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: string, context?: string) {
    console.warn(`[WARN] ${context ? `[${context}] ` : ""}${message}`);
  }

  debug(message: string, context?: string) {
    console.debug(`[DEBUG] ${context ? `[${context}] ` : ""}${message}`);
  }
}

// Usage in services
@Injectable()
export class UserService {
  constructor(private logger: LoggerService) {}

  async create(userData: any) {
    this.logger.log("Creating new user", "UserService");
    const user = { id: "123", ...userData };
    this.logger.log(`User created: ${user.id}`, "UserService");
    return user;
  }
}
```

### Cache Service

```typescript
@Injectable()
export class CacheService {
  private cache = new Map<string, { value: any; expires: number }>();

  set(key: string, value: any, ttl: number = 3600000) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }

  get(key: string): any {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Usage with caching
@Injectable()
export class ProductService {
  constructor(private database: DatabaseService, private cache: CacheService) {}

  async findById(id: string) {
    const cacheKey = `product:${id}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const product = await this.database.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    this.cache.set(cacheKey, product, 60000); // 1 minute
    return product;
  }
}
```

---

## Dependency Injection Patterns

### Constructor Injection (Recommended)

```typescript
@Injectable()
export class OrderService {
  constructor(
    private userService: UserService,
    private productService: ProductService,
    private emailService: EmailService
  ) {}

  async createOrder(userId: string, productIds: string[]) {
    const user = await this.userService.findById(userId);
    const products = await Promise.all(
      productIds.map((id) => this.productService.findById(id))
    );

    const order = {
      id: Date.now().toString(),
      userId,
      products,
      total: products.reduce((sum, p) => sum + p.price, 0),
    };

    await this.emailService.send(
      user.email,
      "Order Confirmation",
      `Your order ${order.id} has been placed`
    );

    return order;
  }
}
```

### Optional Dependencies

```typescript
@Injectable()
export class NotificationService {
  constructor(
    private emailService?: EmailService,
    private smsService?: SmsService
  ) {}

  async notify(user: any, message: string) {
    const promises = [];

    if (this.emailService && user.email) {
      promises.push(
        this.emailService.send(user.email, "Notification", message)
      );
    }

    if (this.smsService && user.phone) {
      promises.push(this.smsService.send(user.phone, message));
    }

    await Promise.all(promises);
  }
}
```

### Service Composition

```typescript
@Injectable()
export class UserService {
  async findById(id: string) {
    return { id, name: "John" };
  }
}

@Injectable()
export class OrderService {
  async findByUserId(userId: string) {
    return [{ id: "1", userId }];
  }
}

@Injectable()
export class UserProfileService {
  constructor(
    private userService: UserService,
    private orderService: OrderService
  ) {}

  async getCompleteProfile(userId: string) {
    const user = await this.userService.findById(userId);
    const orders = await this.orderService.findByUserId(userId);

    return {
      ...user,
      orderCount: orders.length,
      recentOrders: orders.slice(0, 5),
    };
  }
}
```

---

## Best Practices

### 1. Keep Services Focused

```typescript
// Good - single responsibility
@Injectable()
export class UserService {
  async findAll() {}
  async findById(id: string) {}
  async create(data: any) {}
}

@Injectable()
export class AuthService {
  async login(email: string, password: string) {}
  async logout(token: string) {}
}

// Avoid - too many responsibilities
@Injectable()
export class UserService {
  async findAll() {}
  async login() {}
  async sendEmail() {}
  async validateInput() {}
  async logActivity() {}
}
```

### 2. Use Constructor Injection

```typescript
// Good
@Injectable()
export class OrderService {
  constructor(
    private userService: UserService,
    private productService: ProductService
  ) {}
}

// Avoid - property injection (not supported in standard pattern)
@Injectable()
export class OrderService {
  @Inject() userService: UserService;
  @Inject() productService: ProductService;
}
```

### 3. Declare Dependencies Explicitly

```typescript
// Good - clear dependencies
@Injectable()
export class ReportService {
  constructor(
    private userService: UserService,
    private orderService: OrderService,
    private emailService: EmailService
  ) {}
}

// Avoid - hidden dependencies
@Injectable()
export class ReportService {
  async generate() {
    const users = await new UserService().findAll(); // Bad!
  }
}
```

### 4. Use Appropriate Scopes

```typescript
// Good - singleton for stateless services
@Injectable()
export class MathService {
  add(a: number, b: number) {
    return a + b;
  }
}

// Good - request scope for request-specific data
@Injectable({ scope: Scope.REQUEST })
export class RequestLoggerService {
  private requestId: string;

  constructor() {
    this.requestId = Math.random().toString(36);
  }
}

// Avoid - transient unless necessary
@Injectable({ scope: Scope.TRANSIENT })
export class HeavyService {
  // Creates new instance every time - expensive!
}
```

### 5. Test with Dependency Injection

```typescript
describe("OrderService", () => {
  it("should create order", async () => {
    const mockUserService = {
      findById: jest
        .fn()
        .mockResolvedValue({ id: "1", email: "test@test.com" }),
    };

    const mockProductService = {
      findById: jest.fn().mockResolvedValue({ id: "1", price: 100 }),
    };

    const orderService = new OrderService(
      mockUserService as any,
      mockProductService as any,
      {} as any
    );

    const order = await orderService.createOrder("1", ["1"]);
    expect(order).toBeDefined();
  });
});
```

### 6. Avoid Circular Dependencies

```typescript
// Avoid
@Injectable()
export class UserService {
  constructor(private orderService: OrderService) {}
}

@Injectable()
export class OrderService {
  constructor(private userService: UserService) {} // Circular!
}

// Fix - use a third service or refactor
@Injectable()
export class UserOrderService {
  constructor(
    private userService: UserService,
    private orderService: OrderService
  ) {}
}
```

---

## Advanced Patterns

### Factory Pattern

```typescript
@Injectable()
export class ServiceFactory {
  constructor(
    private userService: UserService,
    private productService: ProductService
  ) {}

  createService(type: string) {
    switch (type) {
      case "user":
        return this.userService;
      case "product":
        return this.productService;
      default:
        throw new Error("Unknown service type");
    }
  }
}
```

### Strategy Pattern

```typescript
interface PaymentStrategy {
  pay(amount: number): Promise<any>;
}

@Injectable()
export class CreditCardPayment implements PaymentStrategy {
  async pay(amount: number) {
    return { method: "credit_card", amount };
  }
}

@Injectable()
export class PayPalPayment implements PaymentStrategy {
  async pay(amount: number) {
    return { method: "paypal", amount };
  }
}

@Injectable()
export class PaymentService {
  constructor(
    private creditCard: CreditCardPayment,
    private paypal: PayPalPayment
  ) {}

  async processPayment(method: string, amount: number) {
    const strategy = method === "credit_card" ? this.creditCard : this.paypal;
    return strategy.pay(amount);
  }
}
```

### Decorator Pattern

```typescript
@Injectable()
export class BaseUserService {
  async findById(id: string) {
    return { id, name: "John" };
  }
}

@Injectable()
export class CachedUserService {
  constructor(
    private baseService: BaseUserService,
    private cache: CacheService
  ) {}

  async findById(id: string) {
    const cached = this.cache.get(`user:${id}`);
    if (cached) return cached;

    const user = await this.baseService.findById(id);
    this.cache.set(`user:${id}`, user);
    return user;
  }
}
```

---

## Troubleshooting

### Circular Dependency Error

**Problem:** Services depend on each other

**Solution:** Refactor or use forwardRef (if supported)

### Injection Not Working

**Problem:** Service is undefined in constructor

**Solution:** Ensure service is decorated with @Injectable() and registered in module

### Wrong Scope Behavior

**Problem:** Singleton behaving like request-scoped

**Solution:** Check scope configuration:

```typescript
@Injectable({ scope: Scope.DEFAULT })  // Explicit singleton
```

---

## Related Documentation

- [Module Decorator](./MODULE_DECORATOR.md)
- [Controller Decorator](./CONTROLLER_DECORATOR.md)
- [Guards](./GUARDS_DECORATOR.md)
- [Interceptors](./INTERCEPTORS_DECORATOR.md)

---

**Last Updated**: December 4, 2025
