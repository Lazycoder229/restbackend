# Base Entity Documentation

## Overview

The Base Entity class provides an Active Record pattern implementation for Fynix, similar to TypeORM's BaseEntity. It offers both static methods for querying and instance methods for saving/deleting records, making database operations intuitive and straightforward.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Static Methods](#static-methods)
- [Instance Methods](#instance-methods)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## Installation & Setup

```typescript
import { BaseEntity } from "./builtin/base-entity";
import { Entity } from "./decorators/entity.decorator";
import { Column, PrimaryGeneratedColumn } from "./decorators/column.decorator";
import { DatabaseService } from "./builtin/database.service";
```

### Initialize Database Connection

```typescript
// Initialize once at application startup
const database = new DatabaseService();
database.initialize({
  host: "localhost",
  user: "root",
  password: "password",
  database: "myapp",
});

BaseEntity.initializeConnection(database);
```

---

## Basic Usage

```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "int", unsigned: true, default: 0 })
  age: number;
}

// Create and save
const user = new User();
user.name = "John Doe";
user.email = "john@example.com";
user.age = 30;
await user.save();

// Find all
const users = await User.findAll();

// Find by ID
const user = await User.findById(1);

// Update
user.age = 31;
await user.save();

// Delete
await user.remove();
```

---

## API Reference

### Static Methods

#### `initializeConnection(db: DatabaseService): void`

Initialize the database connection for all entities.

**Parameters:**

- `db` - DatabaseService instance

**Example:**

```typescript
BaseEntity.initializeConnection(databaseService);
```

#### `query<T>(): QueryBuilder<T>`

Create a new query builder for advanced queries.

**Returns:** QueryBuilder instance

**Example:**

```typescript
const users = await User.query()
  .where("age", ">", 18)
  .orderBy("name", "ASC")
  .limit(10)
  .get();
```

#### `findAll<T>(): Promise<T[]>`

Find all records in the table.

**Returns:** Array of entity instances

**Example:**

```typescript
const users = await User.findAll();
```

#### `findById<T>(id: number): Promise<T | null>`

Find a single record by its primary key.

**Parameters:**

- `id` - Primary key value

**Returns:** Entity instance or null

**Example:**

```typescript
const user = await User.findById(1);
if (user) {
  console.log(user.name);
}
```

#### `findOne<T>(conditions: object): Promise<T | null>`

Find the first record matching conditions.

**Parameters:**

- `conditions` - Object with field-value pairs

**Returns:** Entity instance or null

**Example:**

```typescript
const user = await User.findOne({ email: "john@example.com" });
```

#### `findBy<T>(conditions: object): Promise<T[]>`

Find all records matching conditions.

**Parameters:**

- `conditions` - Object with field-value pairs

**Returns:** Array of entity instances

**Example:**

```typescript
const users = await User.findBy({ age: 30 });
```

#### `create<T>(data: object): Promise<T>`

Create and save a new record.

**Parameters:**

- `data` - Object with entity properties

**Returns:** New entity instance

**Example:**

```typescript
const user = await User.create({
  name: "Jane Doe",
  email: "jane@example.com",
  age: 25,
});
```

#### `update<T>(id: number, data: object): Promise<T | null>`

Update a record by ID.

**Parameters:**

- `id` - Primary key value
- `data` - Object with properties to update

**Returns:** Updated entity instance or null

**Example:**

```typescript
const user = await User.update(1, { age: 31 });
```

#### `delete(id: number): Promise<boolean>`

Delete a record by ID.

**Parameters:**

- `id` - Primary key value

**Returns:** true if deleted, false if not found

**Example:**

```typescript
const deleted = await User.delete(1);
```

#### `count(conditions?: object): Promise<number>`

Count records, optionally with conditions.

**Parameters:**

- `conditions` (optional) - Object with field-value pairs

**Returns:** Number of records

**Example:**

```typescript
const total = await User.count();
const adults = await User.count({ age: { $gte: 18 } });
```

---

### Instance Methods

#### `save(): Promise<this>`

Save the entity (insert or update).

**Returns:** The entity instance

**Example:**

```typescript
const user = new User();
user.name = "John";
await user.save(); // INSERT

user.age = 31;
await user.save(); // UPDATE
```

#### `remove(): Promise<void>`

Delete the entity from database.

**Example:**

```typescript
const user = await User.findById(1);
await user.remove();
```

#### `reload(): Promise<this>`

Reload entity data from database.

**Returns:** The entity instance with fresh data

**Example:**

```typescript
await user.reload();
console.log(user.name); // Fresh from database
```

---

## Advanced Usage

### Custom Static Methods

```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "int" })
  age: number;

  // Custom finder
  static async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ email });
  }

  // Custom query
  static async findAdults(): Promise<User[]> {
    return await this.query<User>()
      .where("age", ">=", 18)
      .orderBy("age", "DESC")
      .get();
  }

  // Complex query
  static async findActiveUsers(limit: number = 10): Promise<User[]> {
    return await this.query<User>()
      .where("isActive", true)
      .where("deletedAt", null)
      .orderBy("createdAt", "DESC")
      .limit(limit)
      .get();
  }
}

// Usage
const user = await User.findByEmail("john@example.com");
const adults = await User.findAdults();
const active = await User.findActiveUsers(20);
```

### Instance Methods

```typescript
@Entity("posts")
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "int" })
  viewCount: number;

  // Instance method
  async incrementViews(): Promise<void> {
    this.viewCount += 1;
    await this.save();
  }

  // Computed property
  get isPopular(): boolean {
    return this.viewCount > 1000;
  }
}

// Usage
const post = await Post.findById(1);
await post.incrementViews();
console.log(post.isPopular);
```

### Query Builder Integration

```typescript
@Entity("products")
export class Product extends BaseEntity {
  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "varchar", length: 100 })
  category: string;

  static async findByPriceRange(min: number, max: number): Promise<Product[]> {
    return await this.query<Product>()
      .where("price", ">=", min)
      .where("price", "<=", max)
      .where("inStock", true)
      .orderBy("price", "ASC")
      .get();
  }

  static async findByCategory(
    category: string,
    page: number = 1
  ): Promise<any> {
    return await this.query<Product>()
      .where("category", category)
      .paginate(page, 20);
  }
}
```

### Relationships

```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", length: 100 })
  name: string;

  // Get user's posts
  async posts(): Promise<Post[]> {
    return await Post.findBy({ userId: this.id });
  }

  // Get user's comments
  async comments(): Promise<Comment[]> {
    return await Comment.query()
      .where("userId", this.id)
      .orderBy("createdAt", "DESC")
      .get();
  }
}

@Entity("posts")
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "int", unsigned: true })
  userId: number;

  @Column({ type: "varchar", length: 255 })
  title: string;

  // Get post author
  async author(): Promise<User | null> {
    return await User.findById(this.userId);
  }
}

// Usage
const user = await User.findById(1);
const posts = await user.posts();

const post = await Post.findById(1);
const author = await post.author();
```

---

## Best Practices

### 1. Always Initialize Connection

```typescript
// At application startup
BaseEntity.initializeConnection(databaseService);
```

### 2. Use Custom Static Methods

```typescript
// Good - readable and reusable
static async findByEmail(email: string) {
  return await this.findOne({ email });
}

// Avoid - repeating logic
const user1 = await User.findOne({ email: 'user1@example.com' });
const user2 = await User.findOne({ email: 'user2@example.com' });
```

### 3. Handle Null Results

```typescript
// Good
const user = await User.findById(id);
if (!user) {
  throw new Error("User not found");
}

// Avoid - not checking for null
const user = await User.findById(id);
console.log(user.name); // May throw if user is null
```

### 4. Use Transactions for Related Operations

```typescript
const connection = await database.getConnection();
try {
  await connection.beginTransaction();

  const user = await User.create({ name: "John" });
  const profile = await Profile.create({ userId: user.id });

  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
}
```

### 5. Validate Before Save

```typescript
@Entity("users")
export class User extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  email: string;

  async save(): Promise<this> {
    this.validate();
    return super.save();
  }

  private validate(): void {
    if (!this.email || !this.isValidEmail(this.email)) {
      throw new Error("Invalid email");
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### 6. Use TypeScript Types

```typescript
interface UserData {
  name: string;
  email: string;
  age: number;
}

@Entity("users")
export class User extends BaseEntity implements UserData {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "int" })
  age: number;
}
```

---

## Examples

### Complete CRUD Example

```typescript
@Entity("products")
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  stock: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}

// CREATE
const product = await Product.create({
  name: "Laptop",
  price: 999.99,
  stock: 10,
  isActive: true,
});

// READ
const allProducts = await Product.findAll();
const laptop = await Product.findById(1);
const activeProducts = await Product.findBy({ isActive: true });

// UPDATE
laptop.price = 899.99;
laptop.stock = 8;
await laptop.save();

// DELETE
await laptop.remove();
// or
await Product.delete(1);
```

### Search and Filter

```typescript
@Entity("articles")
export class Article extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "varchar", length: 100 })
  author: string;

  @Column({ type: "varchar", length: 20 })
  status: string;

  static async search(query: string): Promise<Article[]> {
    return await this.query<Article>()
      .whereLike("title", query)
      .where("status", "published")
      .orderBy("createdAt", "DESC")
      .limit(20)
      .get();
  }

  static async findByAuthor(author: string): Promise<Article[]> {
    return await this.query<Article>()
      .where("author", author)
      .where("status", "published")
      .orderBy("publishedAt", "DESC")
      .get();
  }
}

// Usage
const results = await Article.search("typescript");
const authorArticles = await Article.findByAuthor("John Doe");
```

### Pagination

```typescript
@Entity("users")
export class User extends BaseEntity {
  static async paginate(page: number = 1, perPage: number = 15) {
    return await this.query<User>()
      .orderBy("createdAt", "DESC")
      .paginate(page, perPage);
  }

  static async paginateActive(page: number = 1) {
    return await this.query<User>()
      .where("isActive", true)
      .orderBy("name", "ASC")
      .paginate(page, 20);
  }
}

// Usage
const page1 = await User.paginate(1, 10);
console.log(page1.data); // User[]
console.log(page1.meta); // { page, limit, total, hasNext, hasPrev }
```

---

## Troubleshooting

### Connection Not Initialized

**Problem:** "Database connection not initialized" error

**Solution:**

```typescript
BaseEntity.initializeConnection(databaseService);
```

### Entity Metadata Not Found

**Problem:** "Entity metadata not found" error

**Solution:** Ensure @Entity decorator is applied:

```typescript
@Entity("users")
export class User extends BaseEntity {
  // ...
}
```

### Primary Key Issues

**Problem:** Save operation fails

**Solution:** Check primary key configuration:

```typescript
@Entity("users", { primaryKey: "userId" })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  userId?: number;
}
```

---

## Related Documentation

- [Entity Decorator](./ENTITY_DECORATOR.md)
- [Column Decorator](./COLUMN_DECORATOR.md)
- [Repository Pattern](./REPOSITORY.md)
- [Query Builder](./QUERY_BUILDER.md)
- [Database Service](./DATABASE_SERVICE.md)

---

**Last Updated**: December 4, 2025
