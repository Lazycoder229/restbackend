# Database Service Documentation

## Overview

The DatabaseService provides MySQL database connectivity, connection pooling, query execution, and transaction management for Fynix applications. It's built on top of mysql2/promise and provides a clean, promise-based API for database operations.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Transactions](#transactions)
- [Connection Management](#connection-management)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { DatabaseService } from "./builtin/database.service";
import { Injectable } from "./decorators/injectable.decorator";
```

### Environment Configuration

Create a `.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=myapp
DB_CONNECTION_LIMIT=10
```

---

## Configuration

The DatabaseService uses environment variables or can be configured programmatically:

```typescript
const db = new DatabaseService({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "myapp",
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});
```

---

## Basic Usage

```typescript
@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async getUsers(): Promise<User[]> {
    const sql = "SELECT * FROM users";
    const users = await this.db.query(sql);
    return users;
  }

  async getUserById(id: number): Promise<User | null> {
    const sql = "SELECT * FROM users WHERE id = ?";
    const users = await this.db.query(sql, [id]);
    return users[0] || null;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const sql = "INSERT INTO users (name, email) VALUES (?, ?)";
    const result = await this.db.query(sql, [data.name, data.email]);
    return { id: result.insertId, ...data };
  }
}
```

---

## API Reference

### Query Methods

#### `query<T>(sql: string, params?: any[]): Promise<T>`

Execute a SQL query with optional parameters.

```typescript
// SELECT
const users = await db.query("SELECT * FROM users");
const user = await db.query("SELECT * FROM users WHERE id = ?", [1]);

// INSERT
const result = await db.query("INSERT INTO users (name, email) VALUES (?, ?)", [
  "John",
  "john@example.com",
]);

// UPDATE
const updated = await db.query("UPDATE users SET name = ? WHERE id = ?", [
  "Jane",
  1,
]);

// DELETE
const deleted = await db.query("DELETE FROM users WHERE id = ?", [1]);
```

#### `execute(sql: string, params?: any[]): Promise<any>`

Execute a SQL statement and return raw results.

```typescript
const [rows, fields] = await db.execute("SELECT * FROM users WHERE id = ?", [
  1,
]);
```

### Transaction Methods

#### `getConnection(): Promise<PoolConnection>`

Get a connection from the pool for manual transaction control.

```typescript
const connection = await db.getConnection();
try {
  await connection.beginTransaction();

  await connection.execute("INSERT INTO users (name) VALUES (?)", ["John"]);
  await connection.execute("INSERT INTO logs (action) VALUES (?)", [
    "user_created",
  ]);

  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

#### `transaction<T>(callback: (connection) => Promise<T>): Promise<T>`

Execute multiple queries in a transaction.

```typescript
const result = await db.transaction(async (conn) => {
  const user = await conn.query("INSERT INTO users (name) VALUES (?)", [
    "John",
  ]);
  await conn.query("INSERT INTO logs (userId, action) VALUES (?, ?)", [
    user.insertId,
    "created",
  ]);
  return user;
});
```

### Utility Methods

#### `isHealthy(): Promise<boolean>`

Check database connection health.

```typescript
const isHealthy = await db.isHealthy();
if (!isHealthy) {
  console.error("Database is not healthy");
}
```

#### `close(): Promise<void>`

Close all connections in the pool.

```typescript
await db.close();
```

#### `getPool(): mysql.Pool`

Get the underlying connection pool.

```typescript
const pool = db.getPool();
```

---

## Transactions

### Using Transaction Helper

```typescript
import { TransactionHelper } from "./builtin/transaction.service";

const result = await TransactionHelper.run(async (transaction) => {
  // All queries run in the transaction
  await transaction.query("INSERT INTO users (name) VALUES (?)", ["John"]);
  await transaction.query("INSERT INTO logs (action) VALUES (?)", [
    "user_created",
  ]);

  // Return result
  return { success: true };
});
```

### Using Transaction Decorator

```typescript
import { Transaction } from "./builtin/transaction.service";

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  @Transaction()
  async createUserWithProfile(userData: CreateUserDto): Promise<User> {
    // Automatically wrapped in transaction
    const userResult = await this.db.query(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [userData.name, userData.email]
    );

    await this.db.query("INSERT INTO profiles (userId, bio) VALUES (?, ?)", [
      userResult.insertId,
      userData.bio,
    ]);

    return { id: userResult.insertId, ...userData };
  }
}
```

### Manual Transaction with Savepoints

```typescript
const connection = await db.getConnection();
const transaction = new TransactionManager(connection);

try {
  await transaction.begin();

  // Create user
  await transaction.query("INSERT INTO users (name) VALUES (?)", ["John"]);

  // Create savepoint
  const savepoint = await transaction.savepoint("after_user");

  try {
    // Try to create profile
    await transaction.query("INSERT INTO profiles (userId) VALUES (?)", [1]);
  } catch (error) {
    // Rollback just the profile creation
    await transaction.rollbackTo(savepoint);
  }

  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
} finally {
  transaction.release();
}
```

---

## Connection Management

### Connection Pooling

The DatabaseService uses connection pooling by default:

```typescript
const db = new DatabaseService({
  connectionLimit: 10, // Max connections in pool
  waitForConnections: true, // Wait if all connections are busy
  queueLimit: 0, // Unlimited queue
  enableKeepAlive: true, // Keep connections alive
  keepAliveInitialDelay: 0,
});
```

### Health Checks

```typescript
@Injectable()
export class HealthService {
  constructor(private db: DatabaseService) {}

  async checkDatabase(): Promise<{ status: string; message: string }> {
    try {
      const isHealthy = await this.db.isHealthy();

      if (isHealthy) {
        return { status: "ok", message: "Database is healthy" };
      } else {
        return { status: "error", message: "Database is not responding" };
      }
    } catch (error) {
      return { status: "error", message: error.message };
    }
  }
}
```

---

## Best Practices

### 1. Use Parameterized Queries

```typescript
// Good - prevents SQL injection
const users = await db.query("SELECT * FROM users WHERE email = ?", [email]);

// Bad - vulnerable to SQL injection
const users = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### 2. Handle Errors Properly

```typescript
@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async getUser(id: number): Promise<User> {
    try {
      const users = await this.db.query("SELECT * FROM users WHERE id = ?", [
        id,
      ]);

      if (users.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return users[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException("Database query failed");
    }
  }
}
```

### 3. Use Transactions for Related Operations

```typescript
@Injectable()
export class OrderService {
  constructor(private db: DatabaseService) {}

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    return await TransactionHelper.run(async (transaction) => {
      // Create order
      const orderResult = await transaction.query(
        "INSERT INTO orders (userId, total) VALUES (?, ?)",
        [orderData.userId, orderData.total]
      );

      // Create order items
      for (const item of orderData.items) {
        await transaction.query(
          "INSERT INTO order_items (orderId, productId, quantity) VALUES (?, ?, ?)",
          [orderResult.insertId, item.productId, item.quantity]
        );

        // Update product stock
        await transaction.query(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [item.quantity, item.productId]
        );
      }

      return { id: orderResult.insertId, ...orderData };
    });
  }
}
```

### 4. Close Connections on Shutdown

```typescript
@Module({
  providers: [DatabaseService],
})
export class AppModule {
  constructor(private db: DatabaseService) {}

  async onModuleDestroy() {
    await this.db.close();
  }
}
```

### 5. Use Connection Pool Efficiently

```typescript
// Good - let the pool manage connections
@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async getUsers() {
    return await this.db.query("SELECT * FROM users");
  }
}

// Bad - manually managing connections for simple queries
@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async getUsers() {
    const connection = await this.db.getConnection();
    try {
      return await connection.query("SELECT * FROM users");
    } finally {
      connection.release();
    }
  }
}
```

---

## Examples

### Complete Service Example

```typescript
@Injectable()
export class ProductService {
  constructor(private db: DatabaseService) {}

  async findAll(): Promise<Product[]> {
    return await this.db.query(
      "SELECT * FROM products WHERE deletedAt IS NULL"
    );
  }

  async findById(id: number): Promise<Product | null> {
    const products = await this.db.query(
      "SELECT * FROM products WHERE id = ? AND deletedAt IS NULL",
      [id]
    );
    return products[0] || null;
  }

  async create(data: CreateProductDto): Promise<Product> {
    const result = await this.db.query(
      "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
      [data.name, data.price, data.stock]
    );

    return { id: result.insertId, ...data };
  }

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    await this.db.query(
      "UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?",
      [data.name, data.price, data.stock, id]
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.db.query("UPDATE products SET deletedAt = NOW() WHERE id = ?", [
      id,
    ]);
  }

  async search(query: string): Promise<Product[]> {
    return await this.db.query(
      "SELECT * FROM products WHERE name LIKE ? AND deletedAt IS NULL",
      [`%${query}%`]
    );
  }

  async updateStock(id: number, quantity: number): Promise<void> {
    await this.db.query("UPDATE products SET stock = stock + ? WHERE id = ?", [
      quantity,
      id,
    ]);
  }

  async bulkCreate(products: CreateProductDto[]): Promise<void> {
    await TransactionHelper.run(async (transaction) => {
      for (const product of products) {
        await transaction.query(
          "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
          [product.name, product.price, product.stock]
        );
      }
    });
  }
}
```

---

## Related Documentation

- [Base Entity](./BASE_ENTITY.md)
- [Repository Pattern](./REPOSITORY.md)
- [Query Builder](./QUERY_BUILDER.md)
- [Transaction Service](./TRANSACTION_SERVICE.md)
- [Injectable Decorator](./INJECTABLE_DECORATOR.md)

---

**Last Updated**: December 4, 2025
