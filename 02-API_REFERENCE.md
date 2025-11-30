# API Reference

Complete reference for all RestJS decorators, classes, and built-in features.

## Table of Contents

1. [Core Classes](#core-classes)
2. [Decorators](#decorators)
3. [Built-in Services](#built-in-services)
4. [Guards](#guards)
5. [Interceptors](#interceptors)
6. [Interfaces](#interfaces)

---

## Core Classes

### RestFactory

Factory class for creating RestJS applications.

#### `create(module: Type<any>): Promise<RestApplication>`

Creates and initializes a new application instance.

```typescript
import { RestFactory, Module } from "restjs";

@Module({
  controllers: [AppController],
})
class AppModule {}

const app = await RestFactory.create(AppModule);
```

---

### RestApplication

Main application class.

#### `init(): Promise<void>`

Initializes the module container and dependency injection.

```typescript
await app.init();
```

#### `listen(port: number): Promise<void>`

Starts the HTTP server on the specified port.

```typescript
await app.listen(3000);
console.log("Server running on http://localhost:3000");
```

#### `setGlobalPrefix(prefix: string): void`

Sets a global prefix for all routes.

```typescript
app.setGlobalPrefix("/api");
// All routes will be prefixed with /api
```

#### `get<T>(token: Type<T>): T`

Retrieves a provider from the dependency injection container.

```typescript
const dbService = app.get<DatabaseService>(DatabaseService);
```

#### `useGlobalInterceptors(...interceptors: NestInterceptor[]): void`

Registers global interceptors.

```typescript
app.useGlobalInterceptors(
  new CorsInterceptor(),
  new SecurityHeadersInterceptor()
);
```

---

## Decorators

### Class Decorators

#### `@Controller(path?: string)`

Defines a controller class with an optional route path prefix.

```typescript
@Controller("/users")
export class UsersController {
  // Routes will be prefixed with /users
}
```

#### `@Injectable()`

Marks a class as injectable and available for dependency injection.

```typescript
@Injectable()
export class UsersService {
  // Can be injected into controllers and other services
}
```

#### `@Module(metadata: ModuleMetadata)`

Defines a module with controllers, providers, and imports.

```typescript
@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // Optional
})
export class UsersModule {}
```

**ModuleMetadata:**

- `imports?: Type<any>[]` - Other modules to import
- `controllers?: Type<any>[]` - Controllers in this module
- `providers?: Type<any>[]` - Services/repositories/guards/interceptors
- `exports?: Type<any>[]` - Providers to export to other modules

---

### HTTP Method Decorators

#### `@Get(path?: string)`

Defines a GET route handler.

```typescript
@Get()
findAll() {
  return { users: [] };
}

@Get("/:id")
findOne(@Param("id") id: string) {
  return { id };
}
```

#### `@Post(path?: string)`

Defines a POST route handler.

```typescript
@Post()
create(@Body() data: any) {
  return { created: true };
}
```

#### `@Put(path?: string)`

Defines a PUT route handler.

```typescript
@Put("/:id")
update(@Param("id") id: string, @Body() data: any) {
  return { updated: true };
}
```

#### `@Delete(path?: string)`

Defines a DELETE route handler.

```typescript
@Delete("/:id")
remove(@Param("id") id: string) {
  return { deleted: true };
}
```

#### `@Patch(path?: string)`

Defines a PATCH route handler.

```typescript
@Patch("/:id")
partialUpdate(@Param("id") id: string, @Body() data: any) {
  return { patched: true };
}
```

#### `@Options(path?: string)`

Defines an OPTIONS route handler.

#### `@Head(path?: string)`

Defines a HEAD route handler.

---

### Parameter Decorators

#### `@Param(key?: string)`

Extracts route parameters.

```typescript
@Get("/:id")
findOne(@Param("id") id: string) {
  // id = "123" from /users/123
}

@Get("/:userId/posts/:postId")
findPost(@Param() params: any) {
  // params = { userId: "1", postId: "2" }
}
```

#### `@Query(key?: string)`

Extracts query string parameters.

```typescript
@Get()
search(@Query("q") query: string) {
  // /users?q=john -> query = "john"
}

@Get()
filter(@Query() query: any) {
  // /users?name=john&age=25 -> query = { name: "john", age: "25" }
}
```

#### `@Body(key?: string)`

Extracts request body.

```typescript
@Post()
create(@Body() data: any) {
  // Full body
}

@Post()
create(@Body("email") email: string) {
  // Specific property
}
```

#### `@Headers(key?: string)`

Extracts request headers.

```typescript
@Get()
index(@Headers("authorization") auth: string) {
  // Specific header
}

@Get()
index(@Headers() headers: any) {
  // All headers
}
```

#### `@Req()`

Injects the raw request object.

```typescript
@Get()
index(@Req() req: any) {
  // Full Node.js request object
}
```

#### `@Res()`

Injects the raw response object.

```typescript
@Get()
index(@Res() res: any) {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "Hello" }));
}
```

---

### Guard Decorators

#### `@UseGuards(...guards: Type<CanActivate>[])`

Applies guards to routes or controllers.

```typescript
@Controller("/admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  // All routes protected
}

@Get("/profile")
@UseGuards(JwtAuthGuard)
getProfile() {
  // Only this route protected
}
```

---

### Interceptor Decorators

#### `@UseInterceptors(...interceptors: Type<NestInterceptor>[])`

Applies interceptors to routes or controllers.

```typescript
@Controller("/users")
@UseInterceptors(LoggingInterceptor)
export class UsersController {
  // All routes logged
}
```

---

### Pipe Decorators

#### `@UsePipes(...pipes: Type<PipeTransform>[])`

Applies transformation/validation pipes.

```typescript
@Post()
@UsePipes(ValidationPipe)
create(@Body() data: any) {
  // Data is validated before reaching handler
}
```

---

## Built-in Services

### DatabaseService

MySQL database connection and query execution.

#### Configuration

```typescript
@Injectable()
export class DatabaseService {
  initialize(config: {
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number;
    waitForConnections?: boolean;
    queueLimit?: number;
  }): void;
}
```

#### Methods

##### `query<T>(sql: string, params?: any[]): Promise<T>`

Execute a SQL query with parameterized values.

```typescript
const users = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
```

##### `getConnection(): Promise<PoolConnection>`

Get a connection from the pool for transactions.

```typescript
const conn = await db.getConnection();
try {
  await conn.beginTransaction();
  await conn.query("INSERT INTO users ...");
  await conn.commit();
} catch (err) {
  await conn.rollback();
} finally {
  conn.release();
}
```

##### `healthCheck(): Promise<boolean>`

Check if database connection is healthy.

```typescript
const isHealthy = await db.healthCheck();
```

##### `close(): Promise<void>`

Close all database connections.

```typescript
await db.close();
```

---

### SecurityService

JWT, password hashing, and validation utilities.

#### Configuration

```typescript
@Injectable()
export class SecurityService {
  configure(config: { jwtSecret: string; jwtExpiration?: string }): void;
}
```

#### Methods

##### `hashPassword(password: string): Promise<string>`

Hash a password using bcrypt.

```typescript
const hashed = await security.hashPassword("myPassword123");
```

##### `comparePassword(password: string, hash: string): Promise<boolean>`

Compare plain password with hash.

```typescript
const isValid = await security.comparePassword("myPassword123", hashed);
```

##### `generateToken(payload: any): string`

Generate a JWT token.

```typescript
const token = security.generateToken({
  userId: 123,
  email: "user@example.com",
});
```

##### `verifyToken(token: string): any`

Verify and decode a JWT token.

```typescript
try {
  const decoded = security.verifyToken(token);
  console.log(decoded.userId);
} catch (err) {
  console.error("Invalid token");
}
```

##### `sanitizeInput(input: string): string`

Remove dangerous characters from user input.

```typescript
const clean = security.sanitizeInput("<script>alert('xss')</script>");
```

##### `isValidEmail(email: string): boolean`

Validate email format.

```typescript
const valid = security.isValidEmail("test@example.com");
```

##### `isStrongPassword(password: string): boolean`

Check password strength (min 8 chars, uppercase, lowercase, number).

```typescript
const strong = security.isStrongPassword("MySecure123");
```

---

### QueryBuilder

Fluent SQL query builder (see [ORM_GUIDE.md](./ORM_GUIDE.md) for detailed examples).

```typescript
const users = await qb
  .table("users")
  .select(["id", "name", "email"])
  .where("age", ">", 18)
  .orderBy("name", "ASC")
  .limit(10)
  .get();
```

---

### Repository

Abstract base class for database repositories (see [ORM_GUIDE.md](./ORM_GUIDE.md) for detailed examples).

```typescript
@Injectable()
export class UsersRepository extends Repository<User> {
  protected tableName = "users";
}
```

---

## Guards

### JwtAuthGuard

Built-in guard for JWT authentication.

```typescript
import { JwtAuthGuard } from "restjs";

@Controller("/profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get()
  getProfile(@Req() req: any) {
    // req.user contains decoded JWT payload
    return { user: req.user };
  }
}
```

**How it works:**

1. Extracts `Authorization: Bearer <token>` header
2. Verifies token with SecurityService
3. Attaches decoded payload to `req.user`
4. Throws `UnauthorizedException` if invalid

---

### Custom Guard

Create your own guard by implementing `CanActivate`.

```typescript
import { Injectable, CanActivate } from "restjs";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: any): boolean | Promise<boolean> {
    const req = context.req;
    return req.user?.role === "admin";
  }
}
```

---

## Interceptors

### CorsInterceptor

Configure Cross-Origin Resource Sharing.

```typescript
const cors = new CorsInterceptor();
cors.configure({
  origin: "*", // or specific domain
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

app.useGlobalInterceptors(cors);
```

---

### SecurityHeadersInterceptor

Add security headers to responses.

```typescript
app.useGlobalInterceptors(new SecurityHeadersInterceptor());
```

**Headers added:**

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `Referrer-Policy: no-referrer`

---

### RateLimitInterceptor

Limit requests per IP address.

```typescript
const rateLimiter = new RateLimitInterceptor();
rateLimiter.configure({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

app.useGlobalInterceptors(rateLimiter);
```

---

### Custom Interceptor

Create your own interceptor by implementing `NestInterceptor`.

```typescript
import { Injectable, NestInterceptor } from "restjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: any, next: any) {
    const req = context.req;
    console.log(`${req.method} ${req.url}`);
    return next();
  }
}
```

---

## Interfaces

### CanActivate

Interface for guards.

```typescript
export interface CanActivate {
  canActivate(context: any): boolean | Promise<boolean>;
}
```

---

### NestInterceptor

Interface for interceptors.

```typescript
export interface NestInterceptor {
  intercept(context: any, next: () => void): void | Promise<void>;
}
```

---

### PipeTransform

Interface for pipes.

```typescript
export interface PipeTransform {
  transform(value: any, metadata?: any): any;
}
```

---

## Exception Classes

### HttpException

Base exception class.

```typescript
throw new HttpException("Something went wrong", 500);
```

### Built-in Exceptions

```typescript
throw new BadRequestException("Invalid input");
throw new UnauthorizedException("Not authenticated");
throw new ForbiddenException("Access denied");
throw new NotFoundException("Resource not found");
throw new InternalServerErrorException("Server error");
```

---

## Complete Example

```typescript
import "reflect-metadata";
import {
  RestFactory,
  Module,
  Controller,
  Get,
  Post,
  UseGuards,
  JwtAuthGuard,
  Injectable,
  Repository,
  DatabaseService,
  SecurityService,
  Body,
  Param,
} from "restjs";

// Repository
@Injectable()
class UsersRepository extends Repository<any> {
  protected tableName = "users";
}

// Service
@Injectable()
class UsersService {
  constructor(private repo: UsersRepository) {}

  async findAll() {
    return await this.repo.findAll();
  }

  async findById(id: number) {
    return await this.repo.findById(id);
  }
}

// Controller
@Controller("/users")
class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getAll() {
    return await this.usersService.findAll();
  }

  @Get("/:id")
  @UseGuards(JwtAuthGuard)
  async getOne(@Param("id") id: string) {
    return await this.usersService.findById(parseInt(id));
  }
}

// Module
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, DatabaseService, SecurityService],
})
class AppModule {}

// Bootstrap
async function bootstrap() {
  const app = await RestFactory.create(AppModule);
  await app.init();

  const db = app.get<DatabaseService>(DatabaseService);
  db.initialize({
    host: "localhost",
    user: "root",
    password: "password",
    database: "myapp",
  });

  const security = app.get<SecurityService>(SecurityService);
  security.configure({
    jwtSecret: "your-secret-key",
    jwtExpiration: "24h",
  });

  await app.listen(3000);
}

bootstrap();
```

---

For more examples and guides:

- [Getting Started](./GETTING_STARTED.md)
- [ORM Guide](./ORM_GUIDE.md)
- [Creating Modules](./CREATING_MODULES.md)
- [Security Guide](./SECURITY_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)
