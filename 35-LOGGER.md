# Logger Service Documentation

## Overview

The Logger service provides structured logging functionality with multiple log levels, colorized console output, file logging, and contextual logging capabilities for Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [Log Levels](#log-levels)
- [API Reference](#api-reference)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { Logger } from "./builtin/logger";
```

---

## Basic Usage

```typescript
import { Logger } from "./builtin/logger";

const logger = new Logger("MyService");

logger.info("Application started");
logger.warn("This is a warning");
logger.error("An error occurred", new Error("Something went wrong"));
logger.debug("Debug information");
```

---

## Log Levels

The Logger supports the following log levels (in order of severity):

| Level     | Method           | Description                    | Color  |
| --------- | ---------------- | ------------------------------ | ------ |
| **DEBUG** | `logger.debug()` | Detailed debugging information | Gray   |
| **INFO**  | `logger.info()`  | General informational messages | Green  |
| **WARN**  | `logger.warn()`  | Warning messages               | Yellow |
| **ERROR** | `logger.error()` | Error messages                 | Red    |

---

## API Reference

### Constructor

#### `new Logger(context?: string)`

Create a new logger instance with optional context.

```typescript
const logger = new Logger("UserService");
```

### Logging Methods

#### `debug(message: string, meta?: any): void`

Log debug-level messages.

```typescript
logger.debug("User query executed", { userId: 123, duration: "45ms" });
```

#### `info(message: string, meta?: any): void`

Log informational messages.

```typescript
logger.info("User logged in", { userId: 123 });
```

#### `warn(message: string, meta?: any): void`

Log warning messages.

```typescript
logger.warn("API rate limit approaching", { current: 95, limit: 100 });
```

#### `error(message: string, error?: Error | any): void`

Log error messages with optional error object.

```typescript
logger.error("Database connection failed", new Error("Connection timeout"));
```

#### `log(message: string, meta?: any): void`

Alias for `info()`.

```typescript
logger.log("Operation completed");
```

---

## Advanced Features

### Contextual Logging

```typescript
@Injectable()
export class UserService {
  private logger = new Logger("UserService");

  async getUser(id: number) {
    this.logger.debug(`Fetching user ${id}`);

    try {
      const user = await this.userRepo.findById(id);
      this.logger.info("User fetched successfully", { userId: id });
      return user;
    } catch (error) {
      this.logger.error("Failed to fetch user", error);
      throw error;
    }
  }
}
```

### Global Exception Filter with Logging

```typescript
export class GlobalExceptionFilter {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("ExceptionFilter");
  }

  catch(error: Error, req: any, res: any): void {
    this.logger.error("Unhandled exception", error);

    // Send error response
    res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
}
```

### HTTP Request Logging

```typescript
export class LoggingInterceptor {
  private logger = new Logger("HTTP");

  intercept(context: any, next: () => void): void {
    const req = context.req;
    const res = context.res;
    const start = Date.now();

    this.logger.info(`Incoming request: ${req.method} ${req.url}`, {
      ip: req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    const originalEnd = res.end;
    res.end = (...args: any[]) => {
      const duration = Date.now() - start;
      this.logger.info(
        `Response: ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`
      );
      return originalEnd.apply(res, args);
    };

    next();
  }
}
```

---

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// Good - appropriate log levels
logger.debug("Cache hit for key: users:123"); // Development info
logger.info("User registered successfully"); // Important events
logger.warn("High memory usage detected"); // Warnings
logger.error("Payment processing failed"); // Errors

// Bad - wrong log levels
logger.error("User logged in"); // Should be info
logger.info("Critical error occurred"); // Should be error
```

### 2. Include Context in Log Messages

```typescript
// Good - descriptive with context
logger.error("Failed to create order", {
  userId: user.id,
  productId: product.id,
  error: error.message,
});

// Bad - vague
logger.error("Error occurred");
```

### 3. Use Consistent Context Names

```typescript
// Good - consistent naming
export class UserService {
  private logger = new Logger("UserService");
}

export class AuthService {
  private logger = new Logger("AuthService");
}

// Bad - inconsistent
export class UserService {
  private logger = new Logger("users"); // lowercase, plural
}
```

### 4. Don't Log Sensitive Information

```typescript
// Good - sanitized logging
logger.info("User authenticated", {
  userId: user.id,
  email: user.email,
});

// Bad - logging passwords
logger.debug("Login attempt", {
  email: email,
  password: password, // NEVER log passwords!
});
```

### 5. Log at Entry and Exit Points

```typescript
@Injectable()
export class OrderService {
  private logger = new Logger("OrderService");

  async createOrder(data: CreateOrderDto): Promise<Order> {
    this.logger.debug("Creating order", { userId: data.userId });

    try {
      const order = await this.orderRepo.create(data);
      this.logger.info("Order created successfully", { orderId: order.id });
      return order;
    } catch (error) {
      this.logger.error("Order creation failed", error);
      throw error;
    }
  }
}
```

---

## Examples

### Service with Complete Logging

```typescript
@Injectable()
export class PaymentService {
  private logger = new Logger("PaymentService");

  constructor(
    private paymentGateway: PaymentGateway,
    private orderService: OrderService
  ) {}

  async processPayment(
    orderId: number,
    paymentData: PaymentDto
  ): Promise<Payment> {
    this.logger.info("Processing payment", { orderId });

    try {
      // Validate order
      const order = await this.orderService.findById(orderId);
      if (!order) {
        this.logger.warn("Payment attempt for non-existent order", { orderId });
        throw new NotFoundException("Order not found");
      }

      this.logger.debug("Order validated", { orderId, amount: order.total });

      // Process payment
      const result = await this.paymentGateway.charge({
        amount: order.total,
        ...paymentData,
      });

      this.logger.info("Payment processed successfully", {
        orderId,
        paymentId: result.id,
        amount: order.total,
      });

      return result;
    } catch (error) {
      this.logger.error("Payment processing failed", {
        orderId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
```

### API Endpoint Logging

```typescript
@Controller("/users")
export class UserController {
  private logger = new Logger("UserController");

  constructor(private userService: UserService) {}

  @Post()
  async createUser(@Body() data: CreateUserDto) {
    this.logger.debug("Create user request", { email: data.email });

    try {
      const user = await this.userService.create(data);
      this.logger.info("User created", { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      this.logger.error("User creation failed", error);
      throw error;
    }
  }

  @Get("/:id")
  async getUser(@Param("id") id: number) {
    this.logger.debug("Get user request", { userId: id });

    const user = await this.userService.findById(id);

    if (!user) {
      this.logger.warn("User not found", { userId: id });
      throw new NotFoundException("User not found");
    }

    return user;
  }
}
```

### Background Job Logging

```typescript
export class EmailJob {
  private logger = new Logger("EmailJob");

  async process(job: Job): Promise<void> {
    this.logger.info("Processing email job", {
      jobId: job.id,
      recipient: job.data.to,
    });

    try {
      await this.emailService.send(job.data);
      this.logger.info("Email sent successfully", {
        jobId: job.id,
        recipient: job.data.to,
      });
    } catch (error) {
      this.logger.error("Failed to send email", {
        jobId: job.id,
        recipient: job.data.to,
        error: error.message,
        attempt: job.attempts,
      });
      throw error;
    }
  }
}
```

---

## Related Documentation

- [Config Service](./CONFIG_SERVICE.md)
- [Exception Filter](./EXCEPTION_FILTER.md)
- [Interceptors](./INTERCEPTORS_DECORATOR.md)

---

**Last Updated**: December 4, 2025
