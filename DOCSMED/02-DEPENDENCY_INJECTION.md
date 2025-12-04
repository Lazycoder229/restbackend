# 02 - Dependency Injection

## 📋 Table of Contents

- [What is Dependency Injection?](#what-is-dependency-injection)
- [Why Use DI?](#why-use-di)
- [FynixJS DI Container](#fynixjs-di-container)
- [Injectable Services](#injectable-services)
- [Constructor Injection](#constructor-injection)
- [Provider Registration](#provider-registration)
- [Injection Scopes](#injection-scopes)
- [Circular Dependencies](#circular-dependencies)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Real-World Examples](#real-world-examples)

---

## 🎯 What is Dependency Injection?

**Dependency Injection (DI)** is a design pattern where objects receive their dependencies from external sources rather than creating them internally. It's a core principle of FynixJS that enables:

- **Loose Coupling**: Classes don't create their dependencies
- **Testability**: Easy to mock dependencies in tests
- **Maintainability**: Change implementations without modifying consumers
- **Reusability**: Share services across multiple components

### Without DI ❌

```typescript
class UserService {
  private database: Database;

  constructor() {
    // Tight coupling - creating dependency inside
    this.database = new Database("mysql://localhost:3306");
  }

  async findUser(id: number) {
    return await this.database.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// Problems:
// - Hard to test (can't mock database)
// - Database config hardcoded
// - Can't reuse UserService with different database
```

### With DI ✅

```typescript
@Injectable()
class UserService {
  // Dependency injected via constructor
  constructor(private database: DatabaseService) {}

  async findUser(id: number) {
    return await this.database.query("SELECT * FROM users WHERE id = ?", [id]);
  }
}

// Benefits:
// - Easy to test (inject mock database)
// - Flexible configuration
// - Reusable with any DatabaseService implementation
```

---

## 💡 Why Use DI?

### 1. Testability

```typescript
// Production
@Injectable()
class EmailService {
  constructor(private smtp: SmtpClient) {}

  async sendEmail(to: string, subject: string) {
    await this.smtp.send({ to, subject });
  }
}

// Testing
describe("EmailService", () => {
  it("should send email", async () => {
    // Mock dependency
    const mockSmtp = {
      send: jest.fn().mockResolvedValue(true),
    };

    // Inject mock
    const service = new EmailService(mockSmtp as any);
    await service.sendEmail("test@example.com", "Hello");

    expect(mockSmtp.send).toHaveBeenCalledWith({
      to: "test@example.com",
      subject: "Hello",
    });
  });
});
```

### 2. Loose Coupling

```typescript
// Interface defines contract
interface PaymentProvider {
  charge(amount: number): Promise<boolean>;
}

// Multiple implementations
@Injectable()
class StripePayment implements PaymentProvider {
  async charge(amount: number) {
    // Stripe logic
    return true;
  }
}

@Injectable()
class PayPalPayment implements PaymentProvider {
  async charge(amount: number) {
    // PayPal logic
    return true;
  }
}

// Service doesn't care which implementation
@Injectable()
class OrderService {
  constructor(private payment: PaymentProvider) {}

  async checkout(amount: number) {
    return await this.payment.charge(amount);
  }
}

// Easy to swap implementations
@Module({
  providers: [
    OrderService,
    { provide: "PaymentProvider", useClass: StripePayment },
    // Later: useClass: PayPalPayment
  ],
})
export class OrderModule {}
```

### 3. Single Responsibility

```typescript
// Each service has one job
@Injectable()
class UserRepository {
  async findById(id: number) {
    // Only database operations
  }
}

@Injectable()
class UserValidator {
  validate(user: any) {
    // Only validation logic
  }
}

@Injectable()
class EmailNotifier {
  async notify(email: string) {
    // Only email sending
  }
}

// Compose services
@Injectable()
class UserService {
  constructor(
    private repo: UserRepository,
    private validator: UserValidator,
    private notifier: EmailNotifier
  ) {}

  async createUser(userData: any) {
    this.validator.validate(userData);
    const user = await this.repo.create(userData);
    await this.notifier.notify(user.email);
    return user;
  }
}
```

---

## 🏭 FynixJS DI Container

FynixJS has a built-in **IoC (Inversion of Control) Container** that manages the lifecycle of your services.

### How It Works

```
┌─────────────────────────────────────────┐
│         Application Bootstrap           │
│   FynixFactory.create(AppModule)        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Module Registration             │
│   - Scan @Module metadata               │
│   - Register controllers                │
│   - Register providers                  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Provider Resolution             │
│   - Analyze constructor parameters      │
│   - Resolve dependencies recursively    │
│   - Create instances (singleton)        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Dependency Injection            │
│   - Inject resolved dependencies        │
│   - Wire up controllers & services      │
│   - Ready to handle requests            │
└─────────────────────────────────────────┘
```

---

## 💉 Injectable Services

### Basic Service

```typescript
import { Injectable } from "@fynixjs/fynix";

@Injectable()
export class UserService {
  private users: any[] = [];

  findAll() {
    return this.users;
  }

  findById(id: number) {
    return this.users.find((u) => u.id === id);
  }

  create(user: any) {
    this.users.push(user);
    return user;
  }
}
```

### Service with Dependencies

```typescript
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private security: SecurityService,
    private logger: Logger
  ) {}

  async login(email: string, password: string) {
    this.logger.log(`Login attempt for ${email}`);

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await this.security.comparePassword(
      password,
      user.password
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = this.security.generateToken({ id: user.id });
    return { token, user };
  }
}
```

---

## 🔧 Constructor Injection

### Standard Injection

```typescript
@Injectable()
export class ProductService {
  // Dependencies injected automatically
  constructor(
    private productRepo: ProductRepository,
    private categoryService: CategoryService,
    private cache: CacheService
  ) {}

  async getProduct(id: number) {
    const cached = await this.cache.get(`product:${id}`);
    if (cached) return cached;

    const product = await this.productRepo.findById(id);
    await this.cache.set(`product:${id}`, product, 3600);
    return product;
  }
}
```

### Multiple Dependencies

```typescript
@Injectable()
export class OrderService {
  constructor(
    private userService: UserService,
    private productService: ProductService,
    private paymentService: PaymentService,
    private emailService: EmailService,
    private inventoryService: InventoryService,
    private logger: Logger
  ) {}

  async createOrder(userId: number, items: any[]) {
    this.logger.log(`Creating order for user ${userId}`);

    // Use all injected services
    const user = await this.userService.findById(userId);
    const products = await this.productService.findByIds(
      items.map((i) => i.id)
    );
    await this.inventoryService.reserve(items);
    const payment = await this.paymentService.charge(user, items);
    await this.emailService.sendOrderConfirmation(user.email);

    return { orderId: payment.id };
  }
}
```

---

## 📦 Provider Registration

### Module Providers

```typescript
@Module({
  providers: [
    // Simple registration
    UserService,
    ProductService,

    // Equivalent to:
    // { provide: UserService, useClass: UserService }
  ],
  controllers: [UserController],
})
export class UserModule {}
```

### Advanced Provider Patterns

#### 1. Class Provider

```typescript
@Module({
  providers: [
    {
      provide: UserService,
      useClass: UserService,
    },
  ],
})
export class AppModule {}
```

#### 2. Value Provider

```typescript
@Module({
  providers: [
    {
      provide: "API_KEY",
      useValue: "sk_test_12345",
    },
    {
      provide: "CONFIG",
      useValue: {
        apiUrl: "https://api.example.com",
        timeout: 5000,
      },
    },
  ],
})
export class AppModule {}

// Usage
@Injectable()
export class ApiService {
  constructor(
    @Inject("API_KEY") private apiKey: string,
    @Inject("CONFIG") private config: any
  ) {}
}
```

#### 3. Factory Provider

```typescript
@Module({
  providers: [
    {
      provide: DatabaseService,
      useFactory: () => {
        const env = process.env.NODE_ENV;
        if (env === "production") {
          return new DatabaseService("prod-config");
        }
        return new DatabaseService("dev-config");
      },
    },
    {
      provide: "LOGGER",
      useFactory: (config: ConfigService) => {
        return new Logger(config.getLogLevel());
      },
      inject: [ConfigService], // Dependencies for factory
    },
  ],
})
export class AppModule {}
```

#### 4. Existing Provider (Alias)

```typescript
@Module({
  providers: [
    UserService,
    {
      provide: "IUserService",
      useExisting: UserService, // Alias
    },
  ],
})
export class AppModule {}
```

---

## 🔄 Injection Scopes

FynixJS uses **Singleton scope** by default (one instance per application).

### Singleton (Default)

```typescript
@Injectable()
export class DatabaseService {
  private pool: any;

  constructor() {
    // Created once, shared across application
    this.pool = createPool({
      host: "localhost",
      database: "myapp",
    });
  }
}

// Same instance everywhere
const service1 = container.resolve(DatabaseService);
const service2 = container.resolve(DatabaseService);
// service1 === service2 ✅
```

### When to Use Singleton

✅ **Good for:**

- Database connections
- Configuration services
- Caching services
- Logging services
- Stateless services

❌ **Not good for:**

- Request-specific data
- User sessions
- Temporary state

---

## 🔄 Circular Dependencies

### Problem

```typescript
// ❌ Circular dependency
@Injectable()
export class ServiceA {
  constructor(private serviceB: ServiceB) {}
}

@Injectable()
export class ServiceB {
  constructor(private serviceA: ServiceA) {}
}

// Error: Cannot resolve circular dependency
```

### Solutions

#### 1. Refactor (Best Solution)

```typescript
// ✅ Extract common logic
@Injectable()
export class SharedService {
  doCommonThing() {
    return "common";
  }
}

@Injectable()
export class ServiceA {
  constructor(private shared: SharedService) {}
}

@Injectable()
export class ServiceB {
  constructor(private shared: SharedService) {}
}
```

#### 2. Use Events

```typescript
// ✅ Decouple with events
import { EventEmitter } from "events";

@Injectable()
export class EventBus extends EventEmitter {}

@Injectable()
export class ServiceA {
  constructor(private eventBus: EventBus) {
    this.eventBus.on("serviceB:action", this.handleAction);
  }
}

@Injectable()
export class ServiceB {
  constructor(private eventBus: EventBus) {}

  doSomething() {
    this.eventBus.emit("serviceB:action", data);
  }
}
```

#### 3. Lazy Loading (Advanced)

```typescript
// ✅ Lazy inject when needed
@Injectable()
export class ServiceA {
  private serviceB: ServiceB;

  constructor(private container: Container) {}

  init() {
    // Resolve later
    this.serviceB = this.container.resolve(ServiceB);
  }
}
```

---

## ✅ Best Practices

### 1. Always Use Constructor Injection

```typescript
// ✅ Good
@Injectable()
export class UserService {
  constructor(private repo: UserRepository) {}
}

// ❌ Bad - property injection (not supported)
@Injectable()
export class UserService {
  @Inject()
  private repo: UserRepository;
}
```

### 2. Depend on Interfaces, Not Implementations

```typescript
// ✅ Good
interface IEmailService {
  send(to: string, subject: string): Promise<void>;
}

@Injectable()
export class NotificationService {
  constructor(private emailService: IEmailService) {}
}

// ❌ Bad - depending on concrete class
@Injectable()
export class NotificationService {
  constructor(private gmailService: GmailService) {}
}
```

### 3. Keep Services Focused

```typescript
// ✅ Good - single responsibility
@Injectable()
export class UserAuthenticationService {
  async login(email: string, password: string) {
    // Only authentication logic
  }
}

@Injectable()
export class UserProfileService {
  async getProfile(userId: number) {
    // Only profile logic
  }
}

// ❌ Bad - doing too much
@Injectable()
export class UserService {
  async login() {}
  async register() {}
  async getProfile() {}
  async updateSettings() {}
  async sendEmail() {}
  // Too many responsibilities!
}
```

### 4. Use Meaningful Names

```typescript
// ✅ Good
@Injectable()
export class UserRegistrationService {}

@Injectable()
export class PaymentProcessingService {}

// ❌ Bad
@Injectable()
export class UserManager {}

@Injectable()
export class PaymentHelper {}
```

### 5. Register Providers in Module

```typescript
// ✅ Good - explicit registration
@Module({
  providers: [UserService, UserRepository, EmailService],
  controllers: [UserController],
})
export class UserModule {}

// ❌ Bad - missing registration
@Module({
  controllers: [UserController], // Depends on UserService but not registered!
})
export class UserModule {}
```

---

## 🎯 Common Patterns

### 1. Service Layer Pattern

```typescript
// Repository handles data access
@Injectable()
export class UserRepository extends Repository<User> {
  async findByEmail(email: string) {
    return await this.findOne({ where: { email } });
  }
}

// Service handles business logic
@Injectable()
export class UserService {
  constructor(private repo: UserRepository) {}

  async createUser(email: string, password: string) {
    const exists = await this.repo.findByEmail(email);
    if (exists) {
      throw new ConflictException("User already exists");
    }
    return await this.repo.create({ email, password });
  }
}

// Controller handles HTTP
@Controller("/users")
export class UserController {
  constructor(private service: UserService) {}

  @Post()
  async create(@Body() body: any) {
    return await this.service.createUser(body.email, body.password);
  }
}
```

### 2. Facade Pattern

```typescript
// Multiple complex services
@Injectable()
export class OrderRepository {}

@Injectable()
export class InventoryService {}

@Injectable()
export class PaymentService {}

@Injectable()
export class EmailService {}

// Facade simplifies interface
@Injectable()
export class OrderFacade {
  constructor(
    private orderRepo: OrderRepository,
    private inventory: InventoryService,
    private payment: PaymentService,
    private email: EmailService
  ) {}

  async placeOrder(userId: number, items: any[]) {
    // Orchestrate multiple services
    await this.inventory.checkAvailability(items);
    const order = await this.orderRepo.create({ userId, items });
    await this.payment.charge(order);
    await this.email.sendConfirmation(order);
    return order;
  }
}

// Controller uses simple facade
@Controller("/orders")
export class OrderController {
  constructor(private orderFacade: OrderFacade) {}

  @Post()
  async create(@Body() body: any) {
    return await this.orderFacade.placeOrder(body.userId, body.items);
  }
}
```

### 3. Strategy Pattern

```typescript
// Strategy interface
interface NotificationStrategy {
  send(message: string): Promise<void>;
}

// Implementations
@Injectable()
export class EmailNotification implements NotificationStrategy {
  async send(message: string) {
    console.log("Sending email:", message);
  }
}

@Injectable()
export class SmsNotification implements NotificationStrategy {
  async send(message: string) {
    console.log("Sending SMS:", message);
  }
}

// Context
@Injectable()
export class NotificationService {
  constructor(private strategy: NotificationStrategy) {}

  async notify(message: string) {
    await this.strategy.send(message);
  }
}

// Module configuration
@Module({
  providers: [
    {
      provide: "NotificationStrategy",
      useClass: EmailNotification, // or SmsNotification
    },
    NotificationService,
  ],
})
export class NotificationModule {}
```

---

## 🎯 Real-World Examples

### Example 1: E-Commerce Order System

```typescript
// Product Repository
@Injectable()
export class ProductRepository extends Repository<Product> {
  async findAvailableProducts(ids: number[]) {
    return await this.find({
      where: { id: { $in: ids }, stock: { $gt: 0 } },
    });
  }
}

// Inventory Service
@Injectable()
export class InventoryService {
  constructor(private productRepo: ProductRepository) {}

  async checkStock(items: { productId: number; quantity: number }[]) {
    for (const item of items) {
      const product = await this.productRepo.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.productId}`
        );
      }
    }
  }

  async reserveStock(items: { productId: number; quantity: number }[]) {
    for (const item of items) {
      await this.productRepo.decrement("stock", item.quantity, {
        where: { id: item.productId },
      });
    }
  }
}

// Payment Service
@Injectable()
export class PaymentService {
  constructor(private logger: Logger) {}

  async processPayment(amount: number, method: string) {
    this.logger.log(`Processing payment: ${amount} via ${method}`);
    // Payment processing logic
    return { transactionId: "txn_123", success: true };
  }
}

// Order Service - Orchestrates everything
@Injectable()
export class OrderService {
  constructor(
    private inventoryService: InventoryService,
    private paymentService: PaymentService,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async createOrder(userId: number, items: any[], paymentMethod: string) {
    this.logger.log(`Creating order for user ${userId}`);

    // Check inventory
    await this.inventoryService.checkStock(items);

    // Calculate total
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Process payment
    const payment = await this.paymentService.processPayment(
      total,
      paymentMethod
    );

    if (payment.success) {
      // Reserve stock
      await this.inventoryService.reserveStock(items);

      // Send confirmation
      await this.emailService.sendOrderConfirmation(userId, items);

      return {
        orderId: payment.transactionId,
        total,
        items,
      };
    }

    throw new BadRequestException("Payment failed");
  }
}

// Module
@Module({
  providers: [
    ProductRepository,
    InventoryService,
    PaymentService,
    EmailService,
    OrderService,
    Logger,
  ],
  controllers: [OrderController],
})
export class OrderModule {}
```

### Example 2: Multi-Tenant Application

```typescript
// Tenant Service
@Injectable()
export class TenantService {
  private currentTenant: string;

  setTenant(tenantId: string) {
    this.currentTenant = tenantId;
  }

  getTenant() {
    return this.currentTenant;
  }
}

// Database Service with tenant support
@Injectable()
export class TenantDatabaseService {
  constructor(private tenantService: TenantService) {}

  async query(sql: string) {
    const tenant = this.tenantService.getTenant();
    // Add tenant filter to all queries
    return await db.query(`${sql} AND tenant_id = ?`, [tenant]);
  }
}

// User Repository
@Injectable()
export class UserRepository {
  constructor(private db: TenantDatabaseService) {}

  async findAll() {
    // Automatically filtered by tenant
    return await this.db.query("SELECT * FROM users");
  }
}

// Module
@Module({
  providers: [TenantService, TenantDatabaseService, UserRepository],
})
export class AppModule {}
```

---

## 📚 Next Steps

- **[03-MODULES_ARCHITECTURE.md](./03-MODULES_ARCHITECTURE.md)** - Organize code with modules
- **[04-CONTROLLERS_ROUTING.md](./04-CONTROLLERS_ROUTING.md)** - Handle HTTP requests
- **[13-BEST_PRACTICES.md](./13-BEST_PRACTICES.md)** - Advanced DI patterns

---

## 💡 Key Takeaways

✅ DI promotes loose coupling and testability  
✅ Use `@Injectable()` to make classes injectable  
✅ Constructor injection is the standard pattern  
✅ Register providers in module metadata  
✅ FynixJS uses singleton scope by default  
✅ Avoid circular dependencies by refactoring  
✅ Keep services focused and single-purpose  
✅ Depend on interfaces, not implementations

---

**Master Dependency Injection** to build maintainable and testable applications!
