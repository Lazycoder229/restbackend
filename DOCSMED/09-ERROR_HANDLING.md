# 09 - Error Handling & Exception Filters

## 📋 Table of Contents

- [Understanding Exception Filters](#understanding-exception-filters)
- [Built-in HTTP Exceptions](#built-in-http-exceptions)
- [Custom Exceptions](#custom-exceptions)
- [Exception Filter Implementation](#exception-filter-implementation)
- [Global Error Handling](#global-error-handling)
- [Error Response Format](#error-response-format)
- [Error Logging](#error-logging)
- [Validation Errors](#validation-errors)
- [Database Errors](#database-errors)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)

---

## 🎯 Understanding Exception Filters

Exception filters catch and handle errors thrown during request processing, transforming them into proper HTTP responses.

### Exception Filter Interface

```typescript
export interface ExceptionFilter {
  catch(exception: Error, context: ExecutionContext): void;
}
```

### When to Use Exception Filters

✅ Transform errors into HTTP responses  
✅ Log errors for monitoring  
✅ Format error messages consistently  
✅ Handle specific error types  
✅ Add error tracking integration

---

## 🔥 Built-in HTTP Exceptions

FynixJS provides standard HTTP exceptions:

### Common Exceptions

```typescript
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from "@fynixjs/fynix";

@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  // 400 Bad Request
  @Get("/:id")
  async findOne(@Param("id") id: string) {
    if (!id || isNaN(Number(id))) {
      throw new BadRequestException("Invalid user ID");
    }
    return await this.userService.findById(Number(id));
  }

  // 401 Unauthorized
  @Post("/login")
  async login(@Body() credentials: LoginDto) {
    const user = await this.authService.validateUser(credentials);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.authService.generateToken(user);
  }

  // 403 Forbidden
  @Delete("/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param("id") id: string) {
    const hasPermission = await this.userService.canDelete(id);
    if (!hasPermission) {
      throw new ForbiddenException(
        "You do not have permission to delete this user"
      );
    }
    return await this.userService.delete(Number(id));
  }

  // 404 Not Found
  @Get("/:id")
  async findOne(@Param("id") id: string) {
    const user = await this.userService.findById(Number(id));
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // 409 Conflict
  @Post()
  async create(@Body() dto: CreateUserDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("User with this email already exists");
    }
    return await this.userService.create(dto);
  }

  // 500 Internal Server Error
  @Get("/report")
  async generateReport() {
    try {
      return await this.reportService.generate();
    } catch (error) {
      throw new InternalServerErrorException("Failed to generate report");
    }
  }
}
```

### Exception with Details

```typescript
@Post('/register')
async register(@Body() dto: RegisterDto) {
  const existing = await this.userService.findByEmail(dto.email);

  if (existing) {
    throw new ConflictException({
      message: 'Registration failed',
      errors: {
        email: 'This email is already registered'
      },
      suggestion: 'Please use a different email or try to login'
    });
  }

  return await this.userService.create(dto);
}
```

---

## 🎨 Custom Exceptions

### Creating Custom Exceptions

```typescript
import { HttpException, HttpStatus } from "@fynixjs/fynix";

export class EmailNotVerifiedException extends HttpException {
  constructor() {
    super("Email not verified", HttpStatus.FORBIDDEN);
  }
}

export class InsufficientFundsException extends HttpException {
  constructor(required: number, available: number) {
    super(
      {
        message: "Insufficient funds",
        required,
        available,
        shortage: required - available,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class ResourceLockedException extends HttpException {
  constructor(resourceId: number, lockedBy: string) {
    super(
      {
        message: "Resource is locked",
        resourceId,
        lockedBy,
        action: "Please wait or contact the user who locked it",
      },
      HttpStatus.CONFLICT
    );
  }
}
```

### Usage

```typescript
@Controller("/posts")
export class PostController {
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreatePostDto, @CurrentUser() user: User) {
    if (!user.emailVerified) {
      throw new EmailNotVerifiedException();
    }

    return await this.postService.create(dto, user);
  }
}

@Controller("/payments")
export class PaymentController {
  @Post("/process")
  async processPayment(@Body() dto: PaymentDto) {
    const balance = await this.walletService.getBalance(dto.userId);

    if (balance < dto.amount) {
      throw new InsufficientFundsException(dto.amount, balance);
    }

    return await this.paymentService.process(dto);
  }
}
```

---

## 🛡️ Exception Filter Implementation

### Basic Exception Filter

```typescript
import { ExceptionFilter, Catch, HttpException } from "@fynixjs/fynix";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, context: any) {
    const response = context.response;
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: context.request.url,
      method: context.request.method,
      message:
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : exceptionResponse.message || "Internal server error",
    };

    response.status(status).json(errorResponse);
  }
}
```

### Detailed Exception Filter

```typescript
@Catch(HttpException)
export class DetailedExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, context: any) {
    const response = context.response;
    const request = context.request;
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.extractMessage(exceptionResponse),
      error: status >= 500 ? "Internal Server Error" : exception.message,
      ...(typeof exceptionResponse === "object" && exceptionResponse !== null
        ? exceptionResponse
        : {}),
    };

    // Remove duplicate message if present
    if (errorResponse.message === errorResponse.error) {
      delete errorResponse.error;
    }

    response.status(status).json(errorResponse);
  }

  private extractMessage(response: any): string {
    if (typeof response === "string") {
      return response;
    }
    if (response.message) {
      return Array.isArray(response.message)
        ? response.message[0]
        : response.message;
    }
    return "Internal server error";
  }
}
```

### All Exceptions Filter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, context: any) {
    const response = context.response;
    const request = context.request;

    let status = 500;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(process.env.NODE_ENV === "development" && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    response.status(status).json(errorResponse);
  }
}
```

---

## 🌐 Global Error Handling

### Applying Global Exception Filter

```typescript
// main.ts
import { FynixFactory } from "@fynixjs/fynix";
import { AllExceptionsFilter } from "./filters/all-exceptions.filter";

const app = await FynixFactory.create(AppModule);
await app.init();

// Apply global exception filter
app.useGlobalFilters(new AllExceptionsFilter());

await app.listen(3000);
```

### Multiple Global Filters

```typescript
import { HttpExceptionFilter } from "./filters/http-exception.filter";
import { ValidationExceptionFilter } from "./filters/validation-exception.filter";
import { DatabaseExceptionFilter } from "./filters/database-exception.filter";

app.useGlobalFilters(
  new DatabaseExceptionFilter(),
  new ValidationExceptionFilter(),
  new HttpExceptionFilter()
);
```

---

## 📝 Error Response Format

### Standardized Format

```typescript
interface ErrorResponse {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  errors?: Record<string, string[]>;
  stack?: string; // Only in development
}
```

### Example Responses

```json
// 400 Bad Request
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/users",
  "method": "POST",
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  }
}

// 404 Not Found
{
  "success": false,
  "statusCode": 404,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/users/999",
  "method": "GET",
  "message": "User with ID 999 not found"
}

// 500 Internal Server Error
{
  "success": false,
  "statusCode": 500,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/reports/generate",
  "method": "POST",
  "message": "Internal server error"
}
```

---

## 📊 Error Logging

### Logging Exception Filter

```typescript
import { Logger } from "@fynixjs/fynix";

@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, context: any) {
    const response = context.response;
    const request = context.request;

    let status = 500;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    // Log error details
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined
    );

    // Additional logging for 500 errors
    if (status >= 500) {
      this.logger.error("Critical error occurred", {
        user: request.user?.id,
        body: request.body,
        params: request.params,
        query: request.query,
        exception:
          exception instanceof Error
            ? {
                name: exception.name,
                message: exception.message,
                stack: exception.stack,
              }
            : exception,
      });
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    response.status(status).json(errorResponse);
  }
}
```

---

## ✅ Validation Errors

### Validation Exception Filter

```typescript
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, context: any) {
    const response = context.response;
    const request = context.request;
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Format validation errors
    const errors = this.formatValidationErrors(exceptionResponse);

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: "Validation failed",
      errors,
    };

    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(response: any): Record<string, string[]> {
    if (response.errors) {
      return response.errors;
    }

    if (response.message && Array.isArray(response.message)) {
      // Group validation errors by field
      const errors: Record<string, string[]> = {};
      response.message.forEach((msg: string) => {
        const [field, ...rest] = msg.split(" ");
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(rest.join(" "));
      });
      return errors;
    }

    return {};
  }
}
```

---

## 💾 Database Errors

### Database Exception Filter

```typescript
@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: any, context: any) {
    const response = context.response;
    const request = context.request;

    // Handle database-specific errors
    if (exception.code === "ER_DUP_ENTRY") {
      const errorResponse = {
        success: false,
        statusCode: 409,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: "Duplicate entry found",
        field: this.extractDuplicateField(exception.message),
      };
      return response.status(409).json(errorResponse);
    }

    if (exception.code === "ER_NO_REFERENCED_ROW_2") {
      const errorResponse = {
        success: false,
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: "Referenced record does not exist",
      };
      return response.status(400).json(errorResponse);
    }

    // Pass to next filter
    throw exception;
  }

  private extractDuplicateField(message: string): string {
    const match = message.match(/for key '(.+?)'/);
    return match ? match[1] : "unknown";
  }
}
```

---

## ✅ Best Practices

### 1. Use Appropriate HTTP Status Codes

```typescript
// ✅ Good
@Get('/:id')
async findOne(@Param('id') id: string) {
  const user = await this.userService.findById(Number(id));
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return user;
}

@Post()
async create(@Body() dto: CreateUserDto) {
  const existing = await this.userService.findByEmail(dto.email);
  if (existing) {
    throw new ConflictException('Email already exists');
  }
  return await this.userService.create(dto);
}

// ❌ Bad - wrong status code
@Get('/:id')
async findOne(@Param('id') id: string) {
  const user = await this.userService.findById(Number(id));
  if (!user) {
    throw new BadRequestException('User not found'); // Should be 404
  }
  return user;
}
```

### 2. Provide Clear Error Messages

```typescript
// ✅ Good - clear and actionable
throw new UnauthorizedException(
  "Invalid credentials. Please check your email and password"
);
throw new ForbiddenException(
  "You need admin privileges to perform this action"
);
throw new NotFoundException(`Product with ID ${id} not found`);

// ❌ Bad - vague messages
throw new UnauthorizedException("Error");
throw new ForbiddenException("Access denied");
throw new NotFoundException("Not found");
```

### 3. Don't Expose Sensitive Information

```typescript
// ✅ Good
try {
  await this.paymentService.process(payment);
} catch (error) {
  this.logger.error("Payment processing failed", error.stack);
  throw new InternalServerErrorException("Payment processing failed");
}

// ❌ Bad - exposes internal details
try {
  await this.paymentService.process(payment);
} catch (error) {
  throw new InternalServerErrorException(error.message); // May expose DB details
}
```

### 4. Log Errors Appropriately

```typescript
// ✅ Good - comprehensive logging
try {
  return await this.orderService.process(order);
} catch (error) {
  this.logger.error("Order processing failed", {
    orderId: order.id,
    userId: order.userId,
    error: error.message,
    stack: error.stack,
  });
  throw new InternalServerErrorException("Failed to process order");
}
```

### 5. Use Global Exception Filters

```typescript
// ✅ Good - consistent error handling
// main.ts
app.useGlobalFilters(new AllExceptionsFilter());

// ❌ Bad - try-catch everywhere
@Get()
async findAll() {
  try {
    return await this.service.findAll();
  } catch (error) {
    return { error: error.message };
  }
}
```

---

## 🎯 Real-World Examples

### Complete Error Handling System

```typescript
// filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("HttpException");

  catch(exception: HttpException, context: any) {
    const response = context.response;
    const request = context.request;
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.extractMessage(exceptionResponse),
      ...(typeof exceptionResponse === "object" ? exceptionResponse : {}),
    };

    // Log based on severity
    if (status >= 500) {
      this.logger.error(errorResponse.message, exception.stack);
    } else if (status >= 400) {
      this.logger.warn(errorResponse.message);
    }

    response.status(status).json(errorResponse);
  }

  private extractMessage(response: any): string {
    if (typeof response === "string") return response;
    return response.message || "Internal server error";
  }
}

// filters/database-exception.filter.ts
@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("DatabaseException");

  catch(exception: any, context: any) {
    const response = context.response;
    const request = context.request;

    // MySQL duplicate entry
    if (exception.code === "ER_DUP_ENTRY") {
      const field = this.extractField(exception.sqlMessage);
      const errorResponse = {
        success: false,
        statusCode: 409,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: `Duplicate ${field} found`,
        field,
      };
      return response.status(409).json(errorResponse);
    }

    // MySQL foreign key constraint
    if (exception.code === "ER_NO_REFERENCED_ROW_2") {
      const errorResponse = {
        success: false,
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: "Referenced record does not exist",
      };
      return response.status(400).json(errorResponse);
    }

    // Connection errors
    if (exception.code === "ECONNREFUSED") {
      this.logger.error("Database connection failed", exception);
      const errorResponse = {
        success: false,
        statusCode: 503,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: "Service temporarily unavailable",
      };
      return response.status(503).json(errorResponse);
    }

    // Pass to next handler
    throw exception;
  }

  private extractField(message: string): string {
    const match = message?.match(/for key '(.+?)'/);
    return match ? match[1].replace("idx_", "").replace(/_/g, " ") : "entry";
  }
}

// main.ts
const app = await FynixFactory.create(AppModule);
await app.init();

app.useGlobalFilters(
  new DatabaseExceptionFilter(),
  new ValidationExceptionFilter(),
  new HttpExceptionFilter(),
  new AllExceptionsFilter()
);

await app.listen(3000);
```

### E-Commerce Error Handling

```typescript
// exceptions/custom-exceptions.ts
export class OutOfStockException extends HttpException {
  constructor(productName: string, available: number) {
    super(
      {
        message: "Product out of stock",
        product: productName,
        available,
        suggestion: "Please check back later or choose a different product",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class PaymentFailedException extends HttpException {
  constructor(reason: string) {
    super(
      {
        message: "Payment failed",
        reason,
        action: "Please try again or use a different payment method",
      },
      HttpStatus.PAYMENT_REQUIRED
    );
  }
}

export class InvalidCouponException extends HttpException {
  constructor(code: string, reason: string) {
    super(
      {
        message: "Invalid coupon code",
        code,
        reason,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

// controllers/order.controller.ts
@Controller("/orders")
export class OrderController {
  constructor(
    private orderService: OrderService,
    private inventoryService: InventoryService,
    private paymentService: PaymentService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: User) {
    // Validate stock
    for (const item of dto.items) {
      const stock = await this.inventoryService.checkStock(item.productId);
      if (stock < item.quantity) {
        const product = await this.productService.findById(item.productId);
        throw new OutOfStockException(product.name, stock);
      }
    }

    // Validate coupon if provided
    if (dto.couponCode) {
      const coupon = await this.couponService.validate(dto.couponCode);
      if (!coupon.isValid) {
        throw new InvalidCouponException(dto.couponCode, coupon.reason);
      }
      if (coupon.expiresAt < new Date()) {
        throw new InvalidCouponException(dto.couponCode, "Coupon has expired");
      }
    }

    // Process payment
    try {
      await this.paymentService.charge(dto.paymentMethod, dto.total);
    } catch (error) {
      throw new PaymentFailedException(error.message);
    }

    // Create order
    return await this.orderService.create(dto, user);
  }
}
```

---

## 📚 Next Steps

- **[08-VALIDATION_PIPES.md](./08-VALIDATION_PIPES.md)** - Handle validation errors
- **[07-GUARDS_INTERCEPTORS_DEEP.md](./07-GUARDS_INTERCEPTORS_DEEP.md)** - Error handling in guards
- **[13-BEST_PRACTICES.md](./13-BEST_PRACTICES.md)** - Error handling patterns

---

## 💡 Key Takeaways

✅ Use appropriate HTTP status codes  
✅ Provide clear, actionable error messages  
✅ Never expose sensitive information in errors  
✅ Implement global exception filters  
✅ Log errors with appropriate severity  
✅ Format errors consistently  
✅ Handle database errors gracefully  
✅ Create custom exceptions for domain logic

---

**Master Error Handling** to build robust, user-friendly APIs!
