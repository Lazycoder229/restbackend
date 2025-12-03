# API Reference

Complete API documentation for FynixJS framework.

---

## 📋 Table of Contents

- [Core Classes](#core-classes)
- [Built-in Services](#built-in-services)
- [Base Classes](#base-classes)
- [Interfaces](#interfaces)
- [Exceptions](#exceptions)

---

## 🎯 Core Classes

### FynixFactory

Bootstrap class for creating FynixJS applications.

```typescript
import { FynixFactory } from "@fynixjs/fynix";
```

#### Methods

##### `create(module: any): Promise<FynixApplication>`

Creates and returns a FynixJS application instance.

```typescript
const app = await FynixFactory.create(AppModule);
```

---

### FynixApplication

The main application instance.

```typescript
import { FynixApplication } from "@fynixjs/fynix";
```

#### Methods

##### `init(): Promise<void>`

Initializes the application (scans modules, builds DI container).

```typescript
await app.init();
```

##### `listen(port: number): Promise<void>`

Starts the HTTP server on the specified port.

```typescript
await app.listen(3000);
console.log("Server running on http://localhost:3000");
```

##### `get<T>(token: any): T`

Retrieves a provider instance from the DI container.

```typescript
const db = app.get<DatabaseService>(DatabaseService);
const security = app.get<SecurityService>(SecurityService);
```

##### `setGlobalPrefix(prefix: string): void`

Sets a global prefix for all routes.

```typescript
app.setGlobalPrefix("/api");
// All routes will be prefixed with /api
```

##### `useGlobalInterceptors(...interceptors: FynixInterceptor[]): void`

Registers global interceptors for all routes.

```typescript
app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
```

##### `enableHotReload(options: HotReloadOptions): void`

Enables hot reload for development.

```typescript
app.enableHotReload({
  enabled: true,
  watchPaths: ["src"],
  debounceMs: 500,
});
```

**HotReloadOptions:**

```typescript
interface HotReloadOptions {
  enabled?: boolean; // Enable/disable hot reload
  watchPaths?: string[]; // Paths to watch (default: ["src"])
  ignore?: string[]; // Paths to ignore
  debounceMs?: number; // Debounce time in ms (default: 500)
  onReload?: () => void; // Callback before reload
}
```

---

### Container

Dependency Injection container.

```typescript
import { Container } from "@fynixjs/fynix";
```

#### Methods

##### `addProvider(provider: any): void`

Registers a provider in the container.

```typescript
container.addProvider(UserService);
```

##### `resolve<T>(provider: any): T`

Resolves and returns a provider instance.

```typescript
const userService = container.resolve<UserService>(UserService);
```

##### `has(provider: any): boolean`

Checks if a provider is registered.

```typescript
if (container.has(UserService)) {
  // Provider is registered
}
```

##### `clear(): void`

Clears all instances and providers.

```typescript
container.clear();
```

---

## 🔧 Built-in Services

### DatabaseService

MySQL database connection and query execution.

```typescript
import { DatabaseService } from "@fynixjs/fynix";
```

#### Methods

##### `initialize(config: DatabaseConfig): void`

Initializes the database connection.

```typescript
db.initialize({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "myapp",
  connectionLimit: 10,
});
```

**DatabaseConfig:**

```typescript
interface DatabaseConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
}
```

##### `query<T>(sql: string, params?: any[]): Promise<T>`

Executes a SQL query with optional parameters.

```typescript
const users = await db.query("SELECT * FROM users WHERE age > ?", [18]);
const user = await db.query("SELECT * FROM users WHERE id = ?", [1]);
```

##### `getConnection(): Promise<Connection>`

Gets a connection for transactions.

```typescript
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  // ... queries
  await connection.commit();
} catch (error) {
  await connection.rollback();
} finally {
  connection.release();
}
```

##### `healthCheck(): Promise<boolean>`

Checks if the database connection is healthy.

```typescript
const isHealthy = await db.healthCheck();
```

##### `close(): Promise<void>`

Closes all database connections.

```typescript
await db.close();
```

---

### SecurityService

Security utilities for JWT, password hashing, and validation.

```typescript
import { SecurityService } from "@fynixjs/fynix";
```

#### Methods

##### `configure(config: SecurityConfig): void`

Configures security settings.

```typescript
security.configure({
  jwtSecret: "your-secret-key",
  saltRounds: 10,
});
```

##### `hashPassword(password: string): Promise<string>`

Hashes a password using bcrypt.

```typescript
const hashed = await security.hashPassword("password123");
```

##### `comparePassword(password: string, hash: string): Promise<boolean>`

Compares a plain password with a hash.

```typescript
const isValid = await security.comparePassword("password123", hashed);
```

##### `generateToken(payload: any, expiresIn?: string | number): string`

Generates a JWT token.

```typescript
const token = security.generateToken(
  { userId: 1, email: "user@example.com" },
  "1h"
);
```

##### `verifyToken(token: string): any`

Verifies and decodes a JWT token.

```typescript
try {
  const decoded = security.verifyToken(token);
  console.log(decoded.userId);
} catch (error) {
  // Invalid token
}
```

##### `decodeToken(token: string): any`

Decodes a JWT token without verification.

```typescript
const decoded = security.decodeToken(token);
```

##### `sanitizeInput(input: string): string`

Sanitizes input to prevent XSS attacks.

```typescript
const clean = security.sanitizeInput(userInput);
```

##### `generateRandomString(length?: number): string`

Generates a random string.

```typescript
const randomStr = security.generateRandomString(32);
```

##### `isValidEmail(email: string): boolean`

Validates email format.

```typescript
if (security.isValidEmail("user@example.com")) {
  // Valid email
}
```

##### `isStrongPassword(password: string): { valid: boolean; message?: string }`

Validates password strength.

```typescript
const result = security.isStrongPassword("MyPass123!");
if (!result.valid) {
  console.log(result.message);
}
```

---

### QueryBuilder

Fluent SQL query builder.

```typescript
import { QueryBuilder } from "@fynixjs/fynix";
```

#### Methods

##### `table(name: string): this`

Sets the table name.

```typescript
qb.table("users");
```

##### `select(...fields: string[]): this`

Specifies columns to select.

```typescript
qb.select("id", "name", "email");
```

##### `where(field: string, operator: string, value: any): this`

Adds a WHERE clause.

```typescript
qb.where("age", ">", 18);
qb.where("status", "active");
```

##### `whereIn(field: string, values: any[]): this`

Adds a WHERE IN clause.

```typescript
qb.whereIn("id", [1, 2, 3]);
```

##### `whereLike(field: string, value: string): this`

Adds a WHERE LIKE clause.

```typescript
qb.whereLike("name", "John");
```

##### `join(table: string, first: string, second: string): this`

Adds an INNER JOIN.

```typescript
qb.join("orders", "users.id", "orders.user_id");
```

##### `leftJoin(table: string, first: string, second: string): this`

Adds a LEFT JOIN.

```typescript
qb.leftJoin("orders", "users.id", "orders.user_id");
```

##### `orderBy(field: string, direction?: "ASC" | "DESC"): this`

Adds ORDER BY clause.

```typescript
qb.orderBy("name", "ASC");
```

##### `limit(value: number): this`

Adds LIMIT clause.

```typescript
qb.limit(10);
```

##### `offset(value: number): this`

Adds OFFSET clause.

```typescript
qb.offset(20);
```

##### `get(): Promise<T[]>`

Executes the query and returns all results.

```typescript
const users = await qb.table("users").where("age", ">", 18).get();
```

##### `first(): Promise<T | null>`

Returns the first result.

```typescript
const user = await qb.table("users").where("id", 1).first();
```

##### `find(id: any): Promise<T | null>`

Finds a record by ID.

```typescript
const user = await qb.table("users").find(1);
```

##### `insert(data: any): Promise<any>`

Inserts a new record.

```typescript
await qb.table("users").insert({ name: "John", email: "john@example.com" });
```

##### `update(data: any): Promise<void>`

Updates records.

```typescript
await qb.table("users").where("id", 1).update({ name: "Jane" });
```

##### `delete(): Promise<void>`

Deletes records.

```typescript
await qb.table("users").where("id", 1).delete();
```

##### `count(): Promise<number>`

Counts records.

```typescript
const total = await qb.table("users").count();
```

##### `exists(): Promise<boolean>`

Checks if records exist.

```typescript
const exists = await qb
  .table("users")
  .where("email", "user@example.com")
  .exists();
```

---

## 🏗️ Base Classes

### BaseEntity

Active Record base class for entities.

```typescript
import { BaseEntity } from "@fynixjs/fynix";

@Entity("users")
export class User extends BaseEntity {}
```

#### Static Methods

##### `findAll(): Promise<T[]>`

Finds all records.

```typescript
const users = await User.findAll();
```

##### `findById(id: any): Promise<T | null>`

Finds a record by ID.

```typescript
const user = await User.findById(1);
```

##### `findOne(conditions: any): Promise<T | null>`

Finds first matching record.

```typescript
const user = await User.findOne({ email: "user@example.com" });
```

##### `findMany(conditions: any): Promise<T[]>`

Finds all matching records.

```typescript
const activeUsers = await User.findMany({ isActive: true });
```

##### `create(data: any): Promise<T>`

Creates a new record.

```typescript
const user = await User.create({ name: "John", email: "john@example.com" });
```

##### `update(conditions: any, data: any): Promise<void>`

Updates records.

```typescript
await User.update({ id: 1 }, { name: "Jane" });
```

##### `remove(conditions: any): Promise<void>`

Deletes records.

```typescript
await User.remove({ isActive: false });
```

##### `count(conditions?: any): Promise<number>`

Counts records.

```typescript
const total = await User.count();
const activeCount = await User.count({ isActive: true });
```

##### `exists(conditions: any): Promise<boolean>`

Checks if records exist.

```typescript
const exists = await User.exists({ email: "user@example.com" });
```

##### `query(): QueryBuilder<T>`

Returns a query builder.

```typescript
const users = await User.query().where("age", ">", 18).get();
```

#### Instance Methods

##### `save(): Promise<T>`

Saves the instance (insert or update).

```typescript
const user = new User();
user.name = "John";
await user.save();
```

##### `delete(): Promise<void>`

Deletes this record.

```typescript
await user.delete();
```

##### `reload(): Promise<void>`

Reloads data from database.

```typescript
await user.reload();
```

---

### Repository

Base repository class for custom repositories.

```typescript
import { Repository } from "@fynixjs/fynix";

@Injectable()
export class UserRepository extends Repository<User> {
  tableName = "users";
}
```

Inherits all QueryBuilder methods.

---

## 🔌 Interfaces

### CanActivate

Interface for guards.

```typescript
import { CanActivate, ExecutionContext } from "@fynixjs/fynix";

export class MyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    return true;
  }
}
```

---

### FynixInterceptor

Interface for interceptors.

```typescript
import {
  FynixInterceptor,
  ExecutionContext,
  CallHandler,
} from "@fynixjs/fynix";

export class MyInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const result = await next.handle();
    return result;
  }
}
```

---

### PipeTransform

Interface for pipes.

```typescript
import { PipeTransform } from "@fynixjs/fynix";

export class MyPipe implements PipeTransform {
  transform(value: any, metadata?: any): any {
    return value;
  }
}
```

---

### ExecutionContext

Provides access to request and response objects.

```typescript
interface ExecutionContext {
  getRequest<T = any>(): T;
  getResponse<T = any>(): T;
  getHandler(): Function;
  getClass(): any;
  switchToHttp(): {
    getRequest(): any;
    getResponse(): any;
  };
}
```

---

## ⚠️ Exceptions

### HttpException

Base HTTP exception class.

```typescript
import { HttpException } from "@fynixjs/fynix";

throw new HttpException("Error message", 400);
```

### Built-in Exception Classes

```typescript
import {
  BadRequestException, // 400
  UnauthorizedException, // 401
  ForbiddenException, // 403
  NotFoundException, // 404
  InternalServerErrorException, // 500
} from "@fynixjs/fynix";

throw new BadRequestException("Invalid input");
throw new UnauthorizedException("Please login");
throw new ForbiddenException("Access denied");
throw new NotFoundException("User not found");
throw new InternalServerErrorException("Server error");
```

---

## 📚 Next Steps

- [Examples](./10-EXAMPLES.md)
- [Getting Started](./01-GETTING_STARTED.md)
- [Core Concepts](./02-CORE_CONCEPTS.md)

---

**Complete API reference for building with FynixJS!**
