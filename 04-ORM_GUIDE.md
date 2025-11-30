# ORM Guide

RestJS includes a built-in ORM with **QueryBuilder** and **Repository** pattern for database operations without writing raw SQL.

## Table of Contents

1. [Introduction](#introduction)
2. [QueryBuilder](#querybuilder)
3. [Repository Pattern](#repository-pattern)
4. [Advanced Queries](#advanced-queries)
5. [Transactions](#transactions)
6. [Best Practices](#best-practices)

---

## Introduction

RestJS provides two ways to interact with your MySQL database:

1. **QueryBuilder** - Fluent interface for building SQL queries
2. **Repository** - Active Record pattern for entity management

Both are built on top of `DatabaseService` and use MySQL2 connection pooling.

---

## QueryBuilder

The QueryBuilder provides a fluent interface for constructing SQL queries.

### Basic Setup

```typescript
import { Injectable, QueryBuilder, DatabaseService } from "restjs";

@Injectable()
export class UsersService {
  private qb: QueryBuilder;

  constructor(private db: DatabaseService) {
    this.qb = new QueryBuilder(db);
  }
}
```

### Select Queries

#### Select All Columns

```typescript
const users = await this.qb.table("users").select().get();
// SELECT * FROM users
```

#### Select Specific Columns

```typescript
const users = await this.qb
  .table("users")
  .select(["id", "name", "email"])
  .get();
// SELECT id, name, email FROM users
```

#### Get First Result

```typescript
const user = await this.qb.table("users").select().first();
// SELECT * FROM users LIMIT 1
```

#### Find By ID

```typescript
const user = await this.qb.table("users").select().find(123);
// SELECT * FROM users WHERE id = 123 LIMIT 1
```

---

### Where Clauses

#### Simple Where

```typescript
const adults = await this.qb
  .table("users")
  .select()
  .where("age", ">=", 18)
  .get();
// SELECT * FROM users WHERE age >= 18
```

#### Multiple Where Conditions

```typescript
const result = await this.qb
  .table("users")
  .select()
  .where("status", "=", "active")
  .where("age", ">", 18)
  .get();
// SELECT * FROM users WHERE status = 'active' AND age > 18
```

#### Where In

```typescript
const users = await this.qb
  .table("users")
  .select()
  .whereIn("id", [1, 2, 3, 4, 5])
  .get();
// SELECT * FROM users WHERE id IN (1, 2, 3, 4, 5)
```

#### Where Like

```typescript
const users = await this.qb
  .table("users")
  .select()
  .whereLike("name", "%john%")
  .get();
// SELECT * FROM users WHERE name LIKE '%john%'
```

---

### Joins

#### Inner Join

```typescript
const result = await this.qb
  .table("users")
  .select(["users.name", "orders.total"])
  .join("orders", "users.id", "orders.user_id")
  .get();
// SELECT users.name, orders.total FROM users
// INNER JOIN orders ON users.id = orders.user_id
```

#### Left Join

```typescript
const result = await this.qb
  .table("users")
  .select()
  .leftJoin("orders", "users.id", "orders.user_id")
  .get();
// SELECT * FROM users
// LEFT JOIN orders ON users.id = orders.user_id
```

---

### Ordering and Limiting

#### Order By

```typescript
const users = await this.qb
  .table("users")
  .select()
  .orderBy("name", "ASC")
  .get();
// SELECT * FROM users ORDER BY name ASC

const users = await this.qb
  .table("users")
  .select()
  .orderBy("created_at", "DESC")
  .get();
// SELECT * FROM users ORDER BY created_at DESC
```

#### Limit and Offset

```typescript
const users = await this.qb.table("users").select().limit(10).offset(20).get();
// SELECT * FROM users LIMIT 10 OFFSET 20
```

---

### Insert Operations

#### Insert Single Record

```typescript
const result = await this.qb.table("users").insert({
  name: "John Doe",
  email: "john@example.com",
  age: 25,
});

console.log(result.insertId); // Auto-generated ID
```

#### Insert Multiple Records

```typescript
const result = await this.qb.table("users").insertMany([
  { name: "John", email: "john@example.com" },
  { name: "Jane", email: "jane@example.com" },
  { name: "Bob", email: "bob@example.com" },
]);

console.log(result.affectedRows); // Number of records inserted
```

---

### Update Operations

```typescript
const result = await this.qb.table("users").where("id", "=", 123).update({
  name: "John Updated",
  age: 26,
});

console.log(result.affectedRows); // Number of records updated
```

---

### Delete Operations

```typescript
const result = await this.qb.table("users").where("id", "=", 123).delete();

console.log(result.affectedRows); // Number of records deleted
```

---

### Aggregate Functions

#### Count

```typescript
const count = await this.qb.table("users").count();
// SELECT COUNT(*) as count FROM users

const activeCount = await this.qb
  .table("users")
  .where("status", "=", "active")
  .count();
```

#### Exists

```typescript
const exists = await this.qb
  .table("users")
  .where("email", "=", "john@example.com")
  .exists();
// Returns true/false
```

---

### Pagination

```typescript
const page = 1;
const perPage = 20;

const result = await this.qb.table("users").select().paginate(page, perPage);

console.log(result);
// {
//   data: [...],
//   total: 100,
//   page: 1,
//   perPage: 20,
//   lastPage: 5
// }
```

---

## Repository Pattern

The Repository pattern provides a cleaner, more object-oriented way to interact with your database.

### Creating a Repository

```typescript
import { Injectable, Repository } from "restjs";

interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  age?: number;
  created_at?: Date;
}

@Injectable()
export class UsersRepository extends Repository<User> {
  protected tableName = "users";

  // Add custom methods
  async findByEmail(email: string): Promise<User | null> {
    return await this.findOneBy("email", email);
  }

  async findAdults(): Promise<User[]> {
    return await this.qb
      .table(this.tableName)
      .select()
      .where("age", ">=", 18)
      .get();
  }
}
```

### Using the Repository

```typescript
@Injectable()
export class UsersService {
  constructor(private repo: UsersRepository) {}

  async getAllUsers() {
    return await this.repo.findAll();
  }

  async getUserById(id: number) {
    return await this.repo.findById(id);
  }

  async createUser(data: User) {
    return await this.repo.create(data);
  }

  async updateUser(id: number, data: Partial<User>) {
    return await this.repo.update(id, data);
  }

  async deleteUser(id: number) {
    return await this.repo.delete(id);
  }
}
```

---

### Repository Methods

#### `findAll(): Promise<T[]>`

Get all records.

```typescript
const users = await repo.findAll();
```

#### `findById(id: number): Promise<T | null>`

Find by primary key.

```typescript
const user = await repo.findById(123);
```

#### `findBy(column: string, value: any): Promise<T[]>`

Find all matching a condition.

```typescript
const activeUsers = await repo.findBy("status", "active");
```

#### `findOneBy(column: string, value: any): Promise<T | null>`

Find first matching a condition.

```typescript
const user = await repo.findOneBy("email", "john@example.com");
```

#### `create(data: Partial<T>): Promise<T>`

Create a new record.

```typescript
const user = await repo.create({
  name: "John Doe",
  email: "john@example.com",
  password: "hashed_password",
});
```

#### `createMany(data: Partial<T>[]): Promise<any>`

Create multiple records.

```typescript
const result = await repo.createMany([
  { name: "John", email: "john@example.com" },
  { name: "Jane", email: "jane@example.com" },
]);
```

#### `update(id: number, data: Partial<T>): Promise<T | null>`

Update a record by ID.

```typescript
const updated = await repo.update(123, {
  name: "John Updated",
  age: 26,
});
```

#### `updateBy(column: string, value: any, data: Partial<T>): Promise<any>`

Update all matching a condition.

```typescript
const result = await repo.updateBy("status", "pending", {
  status: "active",
});
```

#### `delete(id: number): Promise<boolean>`

Delete a record by ID.

```typescript
const deleted = await repo.delete(123);
```

#### `deleteBy(column: string, value: any): Promise<any>`

Delete all matching a condition.

```typescript
const result = await repo.deleteBy("status", "inactive");
```

#### `count(): Promise<number>`

Count all records.

```typescript
const total = await repo.count();
```

#### `countBy(column: string, value: any): Promise<number>`

Count records matching a condition.

```typescript
const activeCount = await repo.countBy("status", "active");
```

#### `exists(id: number): Promise<boolean>`

Check if a record exists.

```typescript
const exists = await repo.exists(123);
```

#### `paginate(page: number, perPage: number): Promise<PaginationResult<T>>`

Get paginated results.

```typescript
const result = await repo.paginate(1, 20);
// {
//   data: [...],
//   total: 100,
//   page: 1,
//   perPage: 20,
//   lastPage: 5
// }
```

#### `save(entity: Partial<T>): Promise<T>`

Create or update (if ID exists).

```typescript
const user = await repo.save({
  id: 123, // If exists, updates; otherwise creates
  name: "John Doe",
});
```

---

## Advanced Queries

### Complex Where Conditions

```typescript
const users = await this.qb
  .table("users")
  .select()
  .where("age", ">=", 18)
  .where("status", "=", "active")
  .whereIn("role", ["admin", "moderator"])
  .whereLike("email", "%@company.com")
  .orderBy("created_at", "DESC")
  .limit(50)
  .get();
```

### Joins with Conditions

```typescript
const result = await this.qb
  .table("users")
  .select(["users.*", "profiles.bio", "profiles.avatar"])
  .leftJoin("profiles", "users.id", "profiles.user_id")
  .where("users.status", "=", "active")
  .orderBy("users.name", "ASC")
  .get();
```

### Subqueries (Using Raw SQL)

```typescript
// For complex queries, fall back to raw SQL
const result = await this.db.query(
  `
  SELECT u.*, 
    (SELECT COUNT(*) FROM posts WHERE posts.user_id = u.id) as post_count
  FROM users u
  WHERE u.status = ?
`,
  ["active"]
);
```

---

## Transactions

Use transactions for multiple operations that must succeed or fail together.

```typescript
async transferMoney(fromId: number, toId: number, amount: number) {
  const conn = await this.db.getConnection();

  try {
    await conn.beginTransaction();

    // Deduct from sender
    await conn.query(
      "UPDATE accounts SET balance = balance - ? WHERE id = ?",
      [amount, fromId]
    );

    // Add to receiver
    await conn.query(
      "UPDATE accounts SET balance = balance + ? WHERE id = ?",
      [amount, toId]
    );

    // Commit transaction
    await conn.commit();
    return { success: true };
  } catch (error) {
    // Rollback on error
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
```

---

## Best Practices

### 1. Use Repositories for Entities

✅ **Good:**

```typescript
@Injectable()
export class UsersRepository extends Repository<User> {
  protected tableName = "users";
}
```

### 2. Keep Business Logic in Services

✅ **Good:**

```typescript
@Injectable()
export class UsersService {
  constructor(
    private repo: UsersRepository,
    private security: SecurityService
  ) {}

  async register(email: string, password: string) {
    // Business logic here
    const hashedPassword = await this.security.hashPassword(password);
    return await this.repo.create({ email, password: hashedPassword });
  }
}
```

### 3. Use Parameterized Queries

✅ **Good:**

```typescript
await this.qb.table("users").where("email", "=", userEmail).get();
// Prevents SQL injection
```

❌ **Bad:**

```typescript
await this.db.query(`SELECT * FROM users WHERE email = '${userEmail}'`);
// Vulnerable to SQL injection!
```

### 4. Handle Errors Properly

```typescript
async findUserByEmail(email: string) {
  try {
    const user = await this.repo.findOneBy("email", email);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  } catch (error) {
    if (error instanceof NotFoundException) throw error;
    throw new InternalServerErrorException("Database error");
  }
}
```

### 5. Use Indexes

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

### 6. Paginate Large Datasets

```typescript
// Don't load thousands of records at once
const users = await this.repo.paginate(page, 20);
```

### 7. Use Transactions for Related Operations

```typescript
// When multiple operations depend on each other
const conn = await this.db.getConnection();
try {
  await conn.beginTransaction();
  // ... multiple operations
  await conn.commit();
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}
```

---

## Complete Example

```typescript
// user.entity.ts
export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  created_at?: Date;
  updated_at?: Date;
}

// users.repository.ts
import { Injectable, Repository } from "restjs";

@Injectable()
export class UsersRepository extends Repository<User> {
  protected tableName = "users";

  async findByEmail(email: string) {
    return await this.findOneBy("email", email);
  }

  async findActiveUsers() {
    return await this.findBy("status", "active");
  }

  async searchByName(query: string) {
    return await this.qb
      .table(this.tableName)
      .select()
      .whereLike("name", `%${query}%`)
      .orderBy("name", "ASC")
      .get();
  }
}

// users.service.ts
import { Injectable, BadRequestException, NotFoundException } from "restjs";
import { UsersRepository } from "./users.repository";
import { SecurityService } from "restjs";

@Injectable()
export class UsersService {
  constructor(
    private repo: UsersRepository,
    private security: SecurityService
  ) {}

  async getAllUsers(page: number = 1) {
    return await this.repo.paginate(page, 20);
  }

  async getUserById(id: number) {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async register(name: string, email: string, password: string) {
    // Check if email exists
    const existing = await this.repo.findByEmail(email);
    if (existing) {
      throw new BadRequestException("Email already registered");
    }

    // Validate password
    if (!this.security.isStrongPassword(password)) {
      throw new BadRequestException("Password too weak");
    }

    // Hash password
    const hashedPassword = await this.security.hashPassword(password);

    // Create user
    return await this.repo.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      status: "active",
    });
  }

  async updateUser(id: number, data: Partial<User>) {
    const updated = await this.repo.update(id, data);
    if (!updated) {
      throw new NotFoundException("User not found");
    }
    return updated;
  }

  async deleteUser(id: number) {
    const deleted = await this.repo.delete(id);
    if (!deleted) {
      throw new NotFoundException("User not found");
    }
    return { success: true };
  }

  async searchUsers(query: string) {
    return await this.repo.searchByName(query);
  }
}
```

---

## Next Steps

- **[API Reference](./API_REFERENCE.md)** - Full API documentation
- **[Creating Modules](./CREATING_MODULES.md)** - Organize your code
- **[Security Guide](./SECURITY_GUIDE.md)** - Secure your database operations
- **[Deployment Guide](./DEPLOYMENT.md)** - Deploy to production

Happy querying! 🚀
