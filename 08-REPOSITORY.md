# Repository Pattern Documentation

## Overview

The Repository class provides a clean, ORM-like abstraction layer for database operations in Fynix. It follows the Repository pattern, separating data access logic from business logic and providing a consistent API for CRUD operations.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Creating Repositories](#creating-repositories)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { Repository } from "./builtin/repository";
import { Injectable } from "./decorators/injectable.decorator";
import { DatabaseService } from "./builtin/database.service";
```

---

## Basic Usage

```typescript
@Injectable()
export class UserRepository extends Repository<User> {
  protected tableName = "users";

  constructor(db: DatabaseService) {
    super(db);
  }

  // Add custom methods
  async findByEmail(email: string): Promise<User | null> {
    return await this.findOneBy("email", email);
  }
}

// Usage in service
@Injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getUser(id: number) {
    return await this.userRepo.findById(id);
  }
}
```

---

## API Reference

### Query Methods

#### `findAll(): Promise<T[]>`

Find all records.

```typescript
const users = await userRepository.findAll();
```

#### `findById(id: number): Promise<T | null>`

Find a single record by ID.

```typescript
const user = await userRepository.findById(1);
```

#### `findBy(field: string, value: any): Promise<T[]>`

Find records matching a field value.

```typescript
const adults = await userRepository.findBy("age", 18);
```

#### `findOneBy(field: string, value: any): Promise<T | null>`

Find first record matching a field value.

```typescript
const user = await userRepository.findOneBy("email", "john@example.com");
```

### Create Methods

#### `create(data: Partial<T>): Promise<T>`

Create a new record.

```typescript
const user = await userRepository.create({
  name: "John",
  email: "john@example.com",
});
```

#### `createMany(records: Partial<T>[]): Promise<{ affectedRows: number }>`

Create multiple records at once.

```typescript
const result = await userRepository.createMany([
  { name: "John", email: "john@example.com" },
  { name: "Jane", email: "jane@example.com" },
]);
```

### Update Methods

#### `update(id: number, data: Partial<T>): Promise<number>`

Update a record by ID.

```typescript
const affected = await userRepository.update(1, { name: "John Updated" });
```

#### `updateBy(field: string, value: any, data: Partial<T>): Promise<number>`

Update records matching a condition.

```typescript
const affected = await userRepository.updateBy("status", "pending", {
  status: "active",
});
```

### Delete Methods

#### `delete(id: number): Promise<number>`

Delete a record by ID.

```typescript
const deleted = await userRepository.delete(1);
```

#### `deleteBy(field: string, value: any): Promise<number>`

Delete records matching a condition.

```typescript
const deleted = await userRepository.deleteBy("status", "inactive");
```

### Utility Methods

#### `count(): Promise<number>`

Count all records.

```typescript
const total = await userRepository.count();
```

#### `countBy(field: string, value: any): Promise<number>`

Count records matching a condition.

```typescript
const activeCount = await userRepository.countBy("isActive", true);
```

#### `exists(id: number): Promise<boolean>`

Check if a record exists.

```typescript
const exists = await userRepository.exists(1);
```

#### `paginate(page: number, perPage: number)`

Get paginated results.

```typescript
const result = await userRepository.paginate(1, 10);
// { data: [...], meta: { page, limit, total, ... } }
```

#### `save(data: any): Promise<T>`

Save (insert or update) a record.

```typescript
// Insert if no ID
const newUser = await userRepository.save({ name: "John" });

// Update if ID exists
const updated = await userRepository.save({ id: 1, name: "John Updated" });
```

---

## Creating Repositories

### Basic Repository

```typescript
interface User {
  id?: number;
  name: string;
  email: string;
  age: number;
}

@Injectable()
export class UserRepository extends Repository<User> {
  protected tableName = "users";

  constructor(db: DatabaseService) {
    super(db);
  }
}
```

### Repository with Custom Methods

```typescript
@Injectable()
export class ProductRepository extends Repository<Product> {
  protected tableName = "products";

  constructor(db: DatabaseService) {
    super(db);
  }

  async findByCategory(category: string): Promise<Product[]> {
    return await this.findBy("category", category);
  }

  async findInStock(): Promise<Product[]> {
    return await this.query()
      .where("stock", ">", 0)
      .where("isActive", true)
      .get();
  }

  async findByPriceRange(min: number, max: number): Promise<Product[]> {
    return await this.query()
      .where("price", ">=", min)
      .where("price", "<=", max)
      .orderBy("price", "ASC")
      .get();
  }

  async updateStock(id: number, quantity: number): Promise<void> {
    await this.update(id, { stock: quantity });
  }

  async decrementStock(id: number, amount: number): Promise<void> {
    const product = await this.findById(id);
    if (product && product.stock >= amount) {
      await this.update(id, { stock: product.stock - amount });
    }
  }
}
```

### Repository with Query Builder

```typescript
@Injectable()
export class OrderRepository extends Repository<Order> {
  protected tableName = "orders";

  constructor(db: DatabaseService) {
    super(db);
  }

  async findByUser(userId: number, status?: string): Promise<Order[]> {
    const query = this.query().where("userId", userId);

    if (status) {
      query.where("status", status);
    }

    return await query.orderBy("createdAt", "DESC").get();
  }

  async findPending(): Promise<Order[]> {
    return await this.query()
      .where("status", "pending")
      .where("createdAt", ">", this.getDateDaysAgo(7))
      .get();
  }

  async getTotalsByStatus(): Promise<any> {
    const sql = `
      SELECT status, COUNT(*) as count, SUM(total) as total
      FROM ${this.tableName}
      GROUP BY status
    `;
    return await this.db.query(sql);
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }
}
```

---

## Advanced Usage

### Generic Repository

```typescript
export function createRepository<T>(tableName: string) {
  @Injectable()
  class GenericRepository extends Repository<T> {
    protected tableName = tableName;
  }

  return GenericRepository;
}

// Usage
const UserRepo = createRepository<User>("users");
const ProductRepo = createRepository<Product>("products");
```

### Repository with Validation

```typescript
@Injectable()
export class UserRepository extends Repository<User> {
  protected tableName = "users";

  constructor(db: DatabaseService) {
    super(db);
  }

  async create(data: Partial<User>): Promise<User> {
    this.validate(data);
    return await super.create(data);
  }

  async update(id: number, data: Partial<User>): Promise<number> {
    this.validate(data);
    return await super.update(id, data);
  }

  private validate(data: Partial<User>): void {
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    if (data.age !== undefined && (data.age < 0 || data.age > 150)) {
      throw new Error("Invalid age");
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.findOneBy("email", email);
    return user;
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !!user;
  }
}
```

### Repository with Soft Deletes

```typescript
@Injectable()
export class SoftDeleteRepository<T> extends Repository<T> {
  async delete(id: number): Promise<number> {
    return await this.update(id, { deletedAt: new Date() } as any);
  }

  async deleteBy(field: string, value: any): Promise<number> {
    return await this.updateBy(field, value, { deletedAt: new Date() } as any);
  }

  async restore(id: number): Promise<number> {
    return await this.update(id, { deletedAt: null } as any);
  }

  async findAll(): Promise<T[]> {
    return await this.query().where("deletedAt", null).get();
  }

  async findAllWithDeleted(): Promise<T[]> {
    return await super.findAll();
  }

  async findDeleted(): Promise<T[]> {
    return await this.query().where("deletedAt", "!=", null).get();
  }
}
```

---

## Best Practices

### 1. One Repository Per Entity

```typescript
// Good
@Injectable()
export class UserRepository extends Repository<User> {
  protected tableName = "users";
}

@Injectable()
export class ProductRepository extends Repository<Product> {
  protected tableName = "products";
}
```

### 2. Keep Business Logic in Services

```typescript
// Repository - data access only
@Injectable()
export class UserRepository extends Repository<User> {
  protected tableName = "users";

  async findByEmail(email: string): Promise<User | null> {
    return await this.findOneBy("email", email);
  }
}

// Service - business logic
@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService
  ) {}

  async registerUser(data: CreateUserDto): Promise<User> {
    // Business logic
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const user = await this.userRepo.create(data);
    await this.emailService.sendWelcome(user.email);

    return user;
  }
}
```

### 3. Use TypeScript Interfaces

```typescript
interface User {
  id?: number;
  name: string;
  email: string;
  createdAt?: Date;
}

@Injectable()
export class UserRepository extends Repository<User> {
  protected tableName = "users";
}
```

### 4. Handle Errors Appropriately

```typescript
@Injectable()
export class UserRepository extends Repository<User> {
  protected tableName = "users";

  async findByIdOrFail(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return user;
  }

  async createUnique(data: Partial<User>): Promise<User> {
    const existing = await this.findOneBy("email", data.email!);
    if (existing) {
      throw new Error("User with this email already exists");
    }
    return await this.create(data);
  }
}
```

### 5. Use Transactions

```typescript
@Injectable()
export class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private productRepo: ProductRepository,
    private db: DatabaseService
  ) {}

  async createOrder(userId: number, items: OrderItem[]): Promise<Order> {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      // Create order
      const order = await this.orderRepo.create({
        userId,
        status: "pending",
        total: 0,
      });

      // Update product stock
      for (const item of items) {
        await this.productRepo.decrementStock(item.productId, item.quantity);
      }

      await connection.commit();
      return order;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
```

---

## Examples

### Complete CRUD Example

```typescript
@Injectable()
export class PostRepository extends Repository<Post> {
  protected tableName = "posts";

  constructor(db: DatabaseService) {
    super(db);
  }

  async findPublished(): Promise<Post[]> {
    return await this.query()
      .where("status", "published")
      .where("publishedAt", "<=", new Date().toISOString())
      .orderBy("publishedAt", "DESC")
      .get();
  }

  async findByAuthor(authorId: number): Promise<Post[]> {
    return await this.findBy("authorId", authorId);
  }

  async publish(id: number): Promise<void> {
    await this.update(id, {
      status: "published",
      publishedAt: new Date(),
    });
  }

  async incrementViews(id: number): Promise<void> {
    const post = await this.findById(id);
    if (post) {
      await this.update(id, { views: post.views + 1 });
    }
  }
}

// Usage
const postRepo = new PostRepository(db);

// Create
const post = await postRepo.create({
  title: "My Post",
  content: "Content here",
  authorId: 1,
});

// Read
const allPosts = await postRepo.findAll();
const published = await postRepo.findPublished();
const authorPosts = await postRepo.findByAuthor(1);

// Update
await postRepo.update(post.id, { title: "Updated Title" });
await postRepo.publish(post.id);

// Delete
await postRepo.delete(post.id);
```

---

## Related Documentation

- [Base Entity](./BASE_ENTITY.md)
- [Query Builder](./QUERY_BUILDER.md)
- [Database Service](./DATABASE_SERVICE.md)
- [Injectable Decorator](./INJECTABLE_DECORATOR.md)

---

**Last Updated**: December 4, 2025
