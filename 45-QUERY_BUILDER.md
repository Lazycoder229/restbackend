# Query Builder Documentation

## Overview

The QueryBuilder provides a fluent, chainable API for constructing SQL queries in a type-safe and intuitive way for Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Query Methods](#query-methods)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { QueryBuilder } from "./builtin/query-builder";
```

---

## Basic Usage

```typescript
const query = new QueryBuilder<User>("users", db);

// Simple SELECT
const users = await query.get();

// With conditions
const activeUsers = await query
  .where("status", "active")
  .where("age", ">=", 18)
  .get();

// With ordering and limiting
const recentUsers = await query
  .where("isActive", true)
  .orderBy("createdAt", "DESC")
  .limit(10)
  .get();
```

---

## API Reference

### Constructor

```typescript
new QueryBuilder<T>(tableName: string, db: DatabaseService)
```

### Query Methods

#### `select(...fields: string[]): this`

Specify fields to select.

```typescript
query.select("id", "name", "email").get();
```

#### `where(field: string, operator: string, value?: any): this`

Add WHERE condition.

```typescript
query.where("age", ">=", 18);
query.where("status", "active");
query.where("email", "LIKE", "%@example.com");
```

#### `orWhere(field: string, operator: string, value?: any): this`

Add OR WHERE condition.

```typescript
query.where("status", "active").orWhere("status", "pending");
```

#### `whereIn(field: string, values: any[]): this`

Add WHERE IN condition.

```typescript
query.whereIn("id", [1, 2, 3, 4, 5]);
```

#### `whereNotIn(field: string, values: any[]): this`

Add WHERE NOT IN condition.

```typescript
query.whereNotIn("status", ["deleted", "banned"]);
```

#### `whereNull(field: string): this`

Add WHERE NULL condition.

```typescript
query.whereNull("deletedAt");
```

#### `whereNotNull(field: string): this`

Add WHERE NOT NULL condition.

```typescript
query.whereNotNull("email");
```

#### `whereBetween(field: string, min: any, max: any): this`

Add WHERE BETWEEN condition.

```typescript
query.whereBetween("price", 10, 100);
```

#### `orderBy(field: string, direction: 'ASC' | 'DESC'): this`

Add ORDER BY clause.

```typescript
query.orderBy("createdAt", "DESC");
```

#### `limit(limit: number): this`

Add LIMIT clause.

```typescript
query.limit(10);
```

#### `offset(offset: number): this`

Add OFFSET clause.

```typescript
query.offset(20);
```

#### `join(table: string, leftKey: string, rightKey: string, type?: string): this`

Add JOIN clause.

```typescript
query.join("profiles", "users.id", "profiles.userId");
query.join("orders", "users.id", "orders.userId", "LEFT");
```

### Execution Methods

#### `get(): Promise<T[]>`

Execute query and get results.

```typescript
const users = await query.where("isActive", true).get();
```

#### `first(): Promise<T | null>`

Get first result.

```typescript
const user = await query.where("email", email).first();
```

#### `count(): Promise<number>`

Get count of results.

```typescript
const total = await query.where("status", "active").count();
```

#### `exists(): Promise<boolean>`

Check if any records exist.

```typescript
const hasActive = await query.where("status", "active").exists();
```

#### `insert(data: Partial<T>): Promise<{ id: number; affectedRows: number }>`

Insert record.

```typescript
const result = await query.insert({ name: "John", email: "john@example.com" });
```

#### `insertMany(records: Partial<T>[]): Promise<{ affectedRows: number }>`

Insert multiple records.

```typescript
await query.insertMany([
  { name: "John", email: "john@example.com" },
  { name: "Jane", email: "jane@example.com" },
]);
```

#### `update(data: Partial<T>): Promise<number>`

Update records.

```typescript
const affected = await query.where("id", 1).update({ name: "John Updated" });
```

#### `delete(): Promise<number>`

Delete records.

```typescript
const deleted = await query.where("id", 1).delete();
```

#### `paginate(page: number, perPage: number): Promise<PaginationResult<T>>`

Get paginated results.

```typescript
const result = await query.where("isActive", true).paginate(1, 10);
```

---

## Best Practices

### 1. Use Method Chaining

```typescript
// Good - fluent and readable
const users = await query
  .where("isActive", true)
  .where("age", ">=", 18)
  .orderBy("createdAt", "DESC")
  .limit(10)
  .get();

// Bad - separate statements
query.where("isActive", true);
query.where("age", ">=", 18);
query.orderBy("createdAt", "DESC");
query.limit(10);
const users = await query.get();
```

### 2. Sanitize User Input

```typescript
// Good - parameterized queries (automatic in QueryBuilder)
query.where("email", userInput);

// Bad - string concatenation
const sql = `SELECT * FROM users WHERE email = '${userInput}'`;
```

### 3. Use Specific Field Selection

```typescript
// Good - select only needed fields
query.select("id", "name", "email").get();

// Bad - select all fields when not needed
query.get(); // SELECT *
```

### 4. Add Indexes for WHERE Conditions

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

---

## Examples

### Basic CRUD Operations

```typescript
@Injectable()
export class UserRepository {
  constructor(private db: DatabaseService) {}

  async findAll(): Promise<User[]> {
    return await new QueryBuilder<User>("users", this.db)
      .where("deletedAt", null)
      .orderBy("createdAt", "DESC")
      .get();
  }

  async findById(id: number): Promise<User | null> {
    return await new QueryBuilder<User>("users", this.db)
      .where("id", id)
      .first();
  }

  async create(data: CreateUserDto): Promise<User> {
    const result = await new QueryBuilder<User>("users", this.db).insert(data);

    return await this.findById(result.id);
  }

  async update(id: number, data: UpdateUserDto): Promise<User> {
    await new QueryBuilder<User>("users", this.db).where("id", id).update(data);

    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await new QueryBuilder<User>("users", this.db).where("id", id).delete();
  }
}
```

### Complex Queries

```typescript
@Injectable()
export class ProductService {
  async searchProducts(filters: ProductFilters): Promise<Product[]> {
    const query = new QueryBuilder<Product>("products", this.db);

    // Category filter
    if (filters.category) {
      query.where("category", filters.category);
    }

    // Price range
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      query.whereBetween("price", filters.minPrice, filters.maxPrice);
    }

    // Stock status
    if (filters.inStock) {
      query.where("stock", ">", 0);
    }

    // Search term
    if (filters.search) {
      query.where("name", "LIKE", `%${filters.search}%`);
    }

    // Active only
    query.where("isActive", true);

    // Ordering
    const orderField = filters.sortBy || "createdAt";
    const orderDirection = filters.sortOrder || "DESC";
    query.orderBy(orderField, orderDirection);

    return await query.get();
  }
}
```

### Joins and Relations

```typescript
async getUsersWithProfiles(): Promise<any[]> {
  return await new QueryBuilder('users', this.db)
    .select('users.*', 'profiles.bio', 'profiles.avatar')
    .join('profiles', 'users.id', 'profiles.userId')
    .where('users.isActive', true)
    .orderBy('users.createdAt', 'DESC')
    .get();
}

async getOrdersWithDetails(): Promise<any[]> {
  return await new QueryBuilder('orders', this.db)
    .select(
      'orders.*',
      'users.name as userName',
      'users.email as userEmail'
    )
    .join('users', 'orders.userId', 'users.id')
    .where('orders.status', 'completed')
    .orderBy('orders.createdAt', 'DESC')
    .limit(50)
    .get();
}
```

### Aggregations and Grouping

```typescript
async getOrderStatsByStatus(): Promise<any[]> {
  const query = new QueryBuilder('orders', this.db);

  const sql = `
    SELECT
      status,
      COUNT(*) as count,
      SUM(total) as totalAmount,
      AVG(total) as avgAmount
    FROM ${query.tableName}
    GROUP BY status
  `;

  return await this.db.query(sql);
}

async getTopCustomers(limit: number = 10): Promise<any[]> {
  const sql = `
    SELECT
      users.id,
      users.name,
      users.email,
      COUNT(orders.id) as orderCount,
      SUM(orders.total) as totalSpent
    FROM users
    JOIN orders ON users.id = orders.userId
    WHERE orders.status = 'completed'
    GROUP BY users.id
    ORDER BY totalSpent DESC
    LIMIT ?
  `;

  return await this.db.query(sql, [limit]);
}
```

---

## Related Documentation

- [Repository Pattern](./REPOSITORY.md)
- [Database Service](./DATABASE_SERVICE.md)
- [Base Entity](./BASE_ENTITY.md)
- [Pagination Service](./PAGINATION_SERVICE.md)

---

**Last Updated**: December 4, 2025
