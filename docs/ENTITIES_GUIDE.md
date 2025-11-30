# 🎯 Entities and Models Guide

**Complete guide to using Entity decorators and Active Record pattern in RestJS - just like NestJS + TypeORM!**

> RestJS now supports **Entity decorators** and **Active Record pattern** similar to NestJS with TypeORM, making it familiar and easy to use.

---

## 📑 Table of Contents

- [Quick Start](#quick-start)
- [Entity Decorator](#entity-decorator)
- [BaseEntity Class](#baseentity-class)
- [Static Methods](#static-methods)
- [Instance Methods](#instance-methods)
- [Complete Example](#complete-example)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)

---

## 🚀 Quick Start

### 1. Define an Entity

```typescript
import { Entity, BaseEntity } from "@restjs/core";

@Entity("users")
export class User extends BaseEntity {
  id?: number;
  name: string;
  email: string;
  password: string;
  age?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // Custom static method
  static async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ email });
  }

  // Custom instance method
  isAdult(): boolean {
    return this.age ? this.age >= 18 : false;
  }
}
```

### 2. Use the Entity

```typescript
// Create new user
const user = new User();
user.name = "John Doe";
user.email = "john@example.com";
user.password = "hashed_password";
await user.save();

// Find users
const allUsers = await User.findAll();
const johnDoe = await User.findByEmail("john@example.com");
const activeUsers = await User.findMany({ isActive: true });

// Update user
const user = await User.findById(1);
if (user) {
  user.name = "Jane Doe";
  await user.save();
}

// Delete user
const user = await User.findById(1);
if (user) {
  await user.delete();
}
```

---

## 📦 Entity Decorator

The `@Entity()` decorator marks a class as a database entity/model.

### Syntax

```typescript
@Entity(tableName: string, options?: EntityOptions)
```

### Parameters

| Parameter            | Type     | Required | Description                              |
| -------------------- | -------- | -------- | ---------------------------------------- |
| `tableName`          | `string` | Yes      | Name of the database table               |
| `options.primaryKey` | `string` | No       | Primary key field name (default: `'id'`) |

### Examples

**Basic Usage**

```typescript
@Entity("users")
export class User extends BaseEntity {
  id?: number;
  name: string;
  email: string;
}
```

**Custom Primary Key**

```typescript
@Entity("products", { primaryKey: "productId" })
export class Product extends BaseEntity {
  productId?: number;
  name: string;
  price: number;
}
```

---

## 🏗️ BaseEntity Class

The `BaseEntity` class provides **Active Record pattern** functionality with static and instance methods.

### Features

- ✅ **Static Methods** - Query database without creating instances
- ✅ **Instance Methods** - Save, delete, reload individual records
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Chainable** - Supports method chaining
- ✅ **Automatic Connection** - Database connection handled automatically

---

## 🔍 Static Methods

Static methods allow you to query the database without creating instances.

### `findAll()`

Get all records from the table.

```typescript
const users = await User.findAll();
// Returns: User[]
```

### `findById(id)`

Find a single record by primary key.

```typescript
const user = await User.findById(1);
// Returns: User | null
```

### `findOne(conditions)`

Find first record matching conditions.

```typescript
const user = await User.findOne({
  email: "john@example.com",
});
// Returns: User | null

const admin = await User.findOne({
  role: "admin",
  isActive: true,
});
```

### `findMany(conditions)`

Find all records matching conditions.

```typescript
const activeUsers = await User.findMany({
  isActive: true,
});
// Returns: User[]

const adults = await User.findMany({
  age: 18, // Note: This finds exact match
});
```

### `create(data)`

Create and save a new record.

```typescript
const user = await User.create({
  name: "John Doe",
  email: "john@example.com",
  password: "hashed_password",
});
// Returns: User (with id populated)
```

### `update(conditions, data)`

Update records matching conditions.

```typescript
const affectedRows = await User.update(
  { isActive: false }, // conditions
  { isActive: true } // updates
);
// Returns: number (affected rows count)
```

### `remove(conditions)`

Delete records matching conditions.

```typescript
const affectedRows = await User.remove({
  isActive: false,
});
// Returns: number (deleted rows count)
```

### `count(conditions?)`

Count records matching conditions.

```typescript
const totalUsers = await User.count();
const activeUsers = await User.count({ isActive: true });
// Returns: number
```

### `exists(conditions)`

Check if record exists.

```typescript
const emailExists = await User.exists({
  email: "john@example.com",
});
// Returns: boolean
```

### `query()`

Get a QueryBuilder for complex queries.

```typescript
const adults = await User.query()
  .where("age", ">=", 18)
  .orderBy("name", "ASC")
  .limit(10)
  .get();

const userCount = await User.query().where("isActive", "=", true).count();
```

---

## 💾 Instance Methods

Instance methods operate on a specific entity instance.

### `save()`

Insert new record or update existing one.

```typescript
// Insert new
const user = new User();
user.name = "John Doe";
user.email = "john@example.com";
await user.save(); // user.id is now populated

// Update existing
user.name = "Jane Doe";
await user.save(); // updates existing record
```

### `delete()`

Delete this record from database.

```typescript
const user = await User.findById(1);
if (user) {
  await user.delete();
}
```

### `reload()`

Refresh entity with latest data from database.

```typescript
const user = await User.findById(1);
// ... some time passes, data might have changed ...
await user.reload(); // fetches fresh data
```

---

## 📝 Complete Example

Here's a complete example with User and Post entities:

### User Entity

```typescript
import { Entity, BaseEntity } from "@restjs/core";
import * as bcrypt from "bcrypt";

export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  password: string;
  age?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Entity("users")
export class User extends BaseEntity {
  id?: number;
  name!: string;
  email!: string;
  password!: string;
  age?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // Custom: Find by email
  static async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ email });
  }

  // Custom: Find active users
  static async findActiveUsers(): Promise<User[]> {
    return await this.findMany({ isActive: true });
  }

  // Custom: Find adults
  static async findAdults(): Promise<User[]> {
    return (await this.query().where("age", ">=", 18).get()) as Promise<User[]>;
  }

  // Instance: Check if adult
  isAdult(): boolean {
    return this.age ? this.age >= 18 : false;
  }

  // Instance: Hash password before save
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // Instance: Verify password
  async verifyPassword(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this.password);
  }

  // Instance: Safe JSON (no password)
  toJSON(): Omit<UserAttributes, "password"> {
    const { password, ...safe } = this;
    return safe;
  }
}
```

### Post Entity

```typescript
import { Entity, BaseEntity } from "@restjs/core";

@Entity("posts")
export class Post extends BaseEntity {
  id?: number;
  title!: string;
  content!: string;
  userId!: number;
  published?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // Find posts by user
  static async findByUserId(userId: number): Promise<Post[]> {
    return await this.findMany({ userId });
  }

  // Find published posts
  static async findPublished(): Promise<Post[]> {
    return await this.findMany({ published: true });
  }

  // Get post with author info (JOIN)
  static async findWithAuthor(postId: number): Promise<any> {
    return await this.query()
      .select([
        "posts.*",
        "users.name as authorName",
        "users.email as authorEmail",
      ])
      .join("users", "posts.userId", "users.id")
      .where("posts.id", "=", postId)
      .first();
  }

  // Publish this post
  async publish(): Promise<void> {
    this.published = true;
    await this.save();
  }
}
```

### Service Using Entities

```typescript
import { Injectable } from "@restjs/core";
import { User } from "./entities/user.entity";
import { Post } from "./entities/post.entity";

@Injectable()
export class UserService {
  async createUser(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    // Check if email exists
    const exists = await User.exists({ email: data.email });
    if (exists) {
      throw new Error("Email already exists");
    }

    // Create user with hashed password
    const user = new User();
    user.name = data.name;
    user.email = data.email;
    user.password = data.password;
    await user.hashPassword();
    await user.save();

    return user;
  }

  async getUserWithPosts(userId: number) {
    const user = await User.findById(userId);
    if (!user) return null;

    const posts = await Post.findByUserId(userId);

    return {
      user: user.toJSON(),
      posts,
    };
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    const user = await User.findByEmail(email);
    if (!user) return null;

    const isValid = await user.verifyPassword(password);
    return isValid ? user : null;
  }
}
```

### Controller Using Entities

```typescript
import { Controller, Get, Post, Body, Param } from "@restjs/core";
import { User } from "./entities/user.entity";

@Controller("/users")
export class UserController {
  @Get("/")
  async getAllUsers() {
    const users = await User.findAll();
    return {
      success: true,
      data: users.map((u) => u.toJSON()),
    };
  }

  @Get("/:id")
  async getUser(@Param("id") id: string) {
    const user = await User.findById(Number(id));
    if (!user) {
      return { success: false, error: "User not found" };
    }
    return {
      success: true,
      data: user.toJSON(),
    };
  }

  @Post("/")
  async createUser(@Body() body: any) {
    const user = new User();
    user.name = body.name;
    user.email = body.email;
    user.password = body.password;
    await user.save();

    return {
      success: true,
      data: user.toJSON(),
    };
  }
}
```

---

## 🔥 Advanced Patterns

### Custom Query Methods

```typescript
@Entity("users")
export class User extends BaseEntity {
  // Complex query with multiple conditions
  static async searchUsers(query: string, isActive = true): Promise<User[]> {
    return (await this.query()
      .where("isActive", "=", isActive)
      .where("name", "LIKE", `%${query}%`)
      .orWhere("email", "LIKE", `%${query}%`)
      .orderBy("name", "ASC")
      .limit(50)
      .get()) as Promise<User[]>;
  }

  // Pagination
  static async paginateUsers(page = 1, perPage = 20) {
    return await this.query()
      .orderBy("createdAt", "DESC")
      .paginate(page, perPage);
  }

  // Aggregation
  static async getUserStats() {
    const db = this.query();
    const [stats] = await db.raw(`
      SELECT 
        COUNT(*) as total,
        AVG(age) as avgAge,
        COUNT(CASE WHEN isActive = 1 THEN 1 END) as activeUsers
      FROM users
    `);
    return stats;
  }
}
```

### Relations (Manual)

```typescript
@Entity("posts")
export class Post extends BaseEntity {
  // Get author
  async getAuthor(): Promise<User | null> {
    return await User.findById(this.userId);
  }

  // Get comments (if you have Comments entity)
  async getComments(): Promise<Comment[]> {
    return await Comment.findMany({ postId: this.id });
  }
}

@Entity("users")
export class User extends BaseEntity {
  // Get user's posts
  async getPosts(): Promise<Post[]> {
    return await Post.findMany({ userId: this.id });
  }
}

// Usage
const post = await Post.findById(1);
const author = await post?.getAuthor();
```

### Lifecycle Hooks Pattern

```typescript
@Entity("users")
export class User extends BaseEntity {
  async save(): Promise<this> {
    // Before save hook
    this.updatedAt = new Date();
    if (!this.createdAt) {
      this.createdAt = new Date();
    }

    // Call parent save
    await super.save();

    // After save hook
    console.log(`User ${this.id} saved`);

    return this;
  }

  async delete(): Promise<void> {
    // Before delete hook
    console.log(`Deleting user ${this.id}`);

    // Delete related records
    await Post.remove({ userId: this.id });

    // Call parent delete
    await super.delete();

    // After delete hook
    console.log(`User ${this.id} deleted`);
  }
}
```

---

## ✅ Best Practices

### 1. Use Interfaces for Type Safety

```typescript
export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
}

@Entity("users")
export class User extends BaseEntity implements UserAttributes {
  id?: number;
  name!: string;
  email!: string;
}
```

### 2. Keep Entities Lightweight

```typescript
// ✅ Good - Entity has data and simple methods
@Entity("users")
export class User extends BaseEntity {
  id?: number;
  name!: string;

  isValid(): boolean {
    return !!this.name;
  }
}

// ❌ Bad - Business logic should be in service
@Entity("users")
export class User extends BaseEntity {
  async sendWelcomeEmail() {
    /* complex logic */
  }
  async generateReport() {
    /* complex logic */
  }
}
```

### 3. Use Services for Complex Logic

```typescript
// Entities: Data + simple methods
@Entity("users")
export class User extends BaseEntity {
  static async findByEmail(email: string) {
    return await this.findOne({ email });
  }
}

// Services: Business logic
@Injectable()
export class UserService {
  async registerUser(data: any) {
    // Validation, hashing, sending emails, etc.
  }
}
```

### 4. Handle Errors Gracefully

```typescript
async getUser(id: number) {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}
```

### 5. Use Transactions for Multiple Operations

```typescript
// For multiple related operations, use raw queries with transactions
async transferOwnership(postId: number, fromUserId: number, toUserId: number) {
  const db = Post.query();

  // Start transaction (you may need to implement transaction support)
  await db.raw('START TRANSACTION');

  try {
    await Post.update({ id: postId }, { userId: toUserId });
    await User.update({ id: fromUserId }, { postsCount: /* decrement */ });
    await User.update({ id: toUserId }, { postsCount: /* increment */ });

    await db.raw('COMMIT');
  } catch (error) {
    await db.raw('ROLLBACK');
    throw error;
  }
}
```

---

## 🎓 Summary

| Feature          | Description                                |
| ---------------- | ------------------------------------------ |
| `@Entity()`      | Decorator to mark class as database entity |
| `BaseEntity`     | Base class providing Active Record pattern |
| Static Methods   | Query database without instances           |
| Instance Methods | Save, delete, reload specific records      |
| Type Safe        | Full TypeScript support                    |
| Familiar API     | Similar to NestJS + TypeORM                |

RestJS entities provide a **simple, familiar, and powerful** way to work with your database - no complex ORM setup required! 🚀
