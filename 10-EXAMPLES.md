# Examples

Real-world examples and code patterns for building applications with FynixJS.

---

## 📋 Table of Contents

- [Complete REST API](#complete-rest-api)
- [Authentication System](#authentication-system)
- [Blog API](#blog-api)
- [E-commerce API](#e-commerce-api)
- [File Upload](#file-upload)
- [Testing](#testing)

---

## 🚀 Complete REST API

A full CRUD API with authentication and database.

### Project Structure (NestJS-style)

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   └── auth.module.ts
│   ├── user/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.entity.ts
│   │   └── user.module.ts
│   └── database/
│       ├── database.module.ts
│       └── database.service.ts
├── app.module.ts
└── main.ts
```

### User Entity

**Note**: The `@Entity`, `@Column`, and `@PrimaryGeneratedColumn` decorators define metadata but don't auto-generate tables. Create your table schema separately, then use the built-in ORM methods for all queries.

```typescript
// src/modules/user/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
} from "@fynixjs/fynix";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  role: string;

  @Column()
  isActive: boolean;

  static async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ email });
  }

  static async findActiveUsers(): Promise<User[]> {
    return await this.findMany({ isActive: true });
  }
}
```

### User Service

```typescript
// src/modules/user/user.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@fynixjs/fynix";
import { User } from "./user.entity";

@Injectable()
export class UserService {
  async findAll(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const users = await User.query()
      .select("id", "name", "email", "role", "isActive")
      .limit(limit)
      .offset(offset)
      .get();

    const total = await User.count();

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user as any;
    return userWithoutPassword;
  }

  async create(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) {
    // Check if email already exists
    const existing = await User.findByEmail(userData.email);
    if (existing) {
      throw new BadRequestException("Email already exists");
    }

    const user = await User.create({
      ...userData,
      role: userData.role || "user",
      isActive: true,
    });

    const { password, ...userWithoutPassword } = user as any;
    return userWithoutPassword;
  }

  async update(id: number, userData: Partial<User>) {
    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Use QueryBuilder for conditional updates
    const affected = await User.query()
      .table("users")
      .where("id", id)
      .update(userData);

    return await this.findById(id);
  }

  async remove(id: number) {
    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Use instance method or QueryBuilder
    await user.delete(); // or: await User.query().table('users').where('id', id).delete();
    return { message: "User deleted successfully" };
  }

  async search(query: string) {
    return await User.query()
      .whereLike("name", query)
      .orWhereLike("email", query)
      .get();
  }
}
```

### User Controller

```typescript
// src/modules/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  JwtAuthGuard,
  LoggingInterceptor,
} from "@fynixjs/fynix";
import { UserService } from "./user.service";

@Controller("/api/users")
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async findAll(@Query("page") page: string, @Query("limit") limit: string) {
    return await this.userService.findAll(
      parseInt(page) || 1,
      parseInt(limit) || 10
    );
  }

  @Get("/search")
  async search(@Query("q") query: string) {
    return await this.userService.search(query);
  }

  @Get("/:id")
  async findOne(@Param("id") id: string) {
    return await this.userService.findById(parseInt(id));
  }

  @Post()
  async create(@Body() body: any) {
    return await this.userService.create(body);
  }

  @Put("/:id")
  async update(@Param("id") id: string, @Body() body: any) {
    return await this.userService.update(parseInt(id), body);
  }

  @Delete("/:id")
  async remove(@Param("id") id: string) {
    return await this.userService.remove(parseInt(id));
  }
}
```

### User Module

```typescript
// src/modules/user/user.module.ts
import { Module } from "@fynixjs/fynix";
import { DatabaseModule } from "../database/database.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

---

## 🔐 Authentication System

Complete authentication with JWT, registration, and login.

### Auth Service

```typescript
// src/modules/auth/auth.service.ts
import {
  Injectable,
  SecurityService,
  UnauthorizedException,
  BadRequestException,
} from "@fynixjs/fynix";
import { User } from "../user/user.entity";

@Injectable()
export class AuthService {
  constructor(private security: SecurityService) {
    this.security.configure({
      jwtSecret: process.env.JWT_SECRET || "your-secret-key",
      saltRounds: 10,
    });
  }

  async register(data: { name: string; email: string; password: string }) {
    // Validate email
    if (!this.security.isValidEmail(data.email)) {
      throw new BadRequestException("Invalid email format");
    }

    // Validate password strength
    const passwordCheck = this.security.isStrongPassword(data.password);
    if (!passwordCheck.valid) {
      throw new BadRequestException(passwordCheck.message);
    }

    // Check if user exists
    const existingUser = await User.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestException("Email already registered");
    }

    // Hash password
    const hashedPassword = await this.security.hashPassword(data.password);

    // Create user
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: "user",
      isActive: true,
    });

    // Generate token
    const token = this.security.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if active
    if (!user.isActive) {
      throw new UnauthorizedException("Account is inactive");
    }

    // Verify password
    const isValid = await this.security.comparePassword(
      password,
      user.password
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate token
    const token = this.security.generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      "7d" // 7 days
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyToken(token: string) {
    try {
      return this.security.verifyToken(token);
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify old password
    const isValid = await this.security.comparePassword(
      oldPassword,
      user.password
    );
    if (!isValid) {
      throw new BadRequestException("Invalid old password");
    }

    // Validate new password
    const passwordCheck = this.security.isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
      throw new BadRequestException(passwordCheck.message);
    }

    // Hash and update
    const hashedPassword = await this.security.hashPassword(newPassword);
    await User.update({ id: userId }, { password: hashedPassword });

    return { message: "Password changed successfully" };
  }
}
```

### Auth Controller

```typescript
// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  JwtAuthGuard,
  Req,
} from "@fynixjs/fynix";
import { AuthService } from "./auth.service";

@Controller("/api/auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("/register")
  async register(
    @Body() body: { name: string; email: string; password: string }
  ) {
    return await this.authService.register(body);
  }

  @Post("/login")
  async login(@Body() body: { email: string; password: string }) {
    return await this.authService.login(body.email, body.password);
  }

  @Get("/me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const { password, ...userWithoutPassword } = user as any;
    return userWithoutPassword;
  }

  @Post("/change-password")
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: any,
    @Body() body: { oldPassword: string; newPassword: string }
  ) {
    return await this.authService.changePassword(
      req.user.userId,
      body.oldPassword,
      body.newPassword
    );
  }
}
```

### Auth Module

```typescript
// src/modules/auth/auth.module.ts
import { Module } from "@fynixjs/fynix";
import { DatabaseModule } from "../database/database.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 📝 Blog API

Blog system with posts, comments, and categories.

### Post Entity

```typescript
// src/modules/blog/post.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
} from "@fynixjs/fynix";

@Entity("posts")
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column()
  authorId: number;

  @Column()
  categoryId: number;

  @Column()
  published: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  static async findPublished(): Promise<Post[]> {
    return await this.query()
      .where("published", true)
      .orderBy("createdAt", "DESC")
      .get();
  }

  static async findByAuthor(authorId: number): Promise<Post[]> {
    return await this.query()
      .where("authorId", authorId)
      .orderBy("createdAt", "DESC")
      .get();
  }

  static async findByCategory(categoryId: number): Promise<Post[]> {
    return await this.query()
      .where("categoryId", categoryId)
      .where("published", true)
      .orderBy("createdAt", "DESC")
      .get();
  }
}
```

### Post Service

```typescript
// src/modules/blog/post.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@fynixjs/fynix";
import { Post } from "./post.entity";

@Injectable()
export class PostService {
  async findAll(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const posts = await Post.query()
      .where("published", true)
      .orderBy("createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .get();

    const total = await Post.count({ published: true });

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const post = await Post.findById(id);

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async create(
    userId: number,
    data: {
      title: string;
      content: string;
      categoryId: number;
      published?: boolean;
    }
  ) {
    const post = await Post.create({
      ...data,
      authorId: userId,
      published: data.published || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return post;
  }

  async update(userId: number, postId: number, data: Partial<Post>) {
    const post = await Post.findById(postId);

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Check if user is the author
    if (post.authorId !== userId) {
      throw new ForbiddenException("You can only edit your own posts");
    }

    await Post.query()
      .table("posts")
      .where("id", postId)
      .update({
        ...data,
        updatedAt: new Date(),
      });

    return await this.findById(postId);
  }

  async remove(userId: number, postId: number) {
    const post = await Post.findById(postId);

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Check if user is the author
    if (post.authorId !== userId) {
      throw new ForbiddenException("You can only delete your own posts");
    }

    await post.delete(); // Use instance method
    return { message: "Post deleted successfully" };
  }

  async findByAuthor(authorId: number) {
    return await Post.findByAuthor(authorId);
  }

  async findByCategory(categoryId: number) {
    return await Post.findByCategory(categoryId);
  }
}
```

---

## 🛒 E-commerce API

Product catalog with orders and shopping cart.

### Product Entity

```typescript
// src/modules/product/product.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
} from "@fynixjs/fynix";

@Entity("products")
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  price: number;

  @Column()
  stock: number;

  @Column()
  categoryId: number;

  @Column()
  imageUrl: string;

  @Column()
  isActive: boolean;

  static async findInStock(): Promise<Product[]> {
    return await this.query()
      .where("stock", ">", 0)
      .where("isActive", true)
      .get();
  }

  static async searchProducts(query: string): Promise<Product[]> {
    return await this.query()
      .whereLike("name", query)
      .orWhereLike("description", query)
      .where("isActive", true)
      .get();
  }
}
```

### Order Service

**Note**: This example uses raw SQL queries for a complex multi-table transaction. For simple CRUD operations, always use the built-in ORM methods like `Order.create()`, `Order.findById()`, etc.

```typescript
// src/modules/order/order.service.ts
import { Injectable, BadRequestException } from "@fynixjs/fynix";
import { DatabaseService } from "@fynixjs/fynix";

@Injectable()
export class OrderService {
  constructor(private db: DatabaseService) {}

  async createOrder(
    userId: number,
    items: Array<{ productId: number; quantity: number }>
  ) {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      // Calculate total
      let total = 0;
      for (const item of items) {
        const [product] = await connection.execute(
          "SELECT price, stock FROM products WHERE id = ?",
          [item.productId]
        );

        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.productId}`
          );
        }

        total += product.price * item.quantity;
      }

      // Create order
      const [orderResult] = await connection.execute(
        "INSERT INTO orders (user_id, total, status, created_at) VALUES (?, ?, ?, ?)",
        [userId, total, "pending", new Date()]
      );

      const orderId = orderResult.insertId;

      // Insert order items and update stock
      for (const item of items) {
        await connection.execute(
          "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, (SELECT price FROM products WHERE id = ?))",
          [orderId, item.productId, item.quantity, item.productId]
        );

        await connection.execute(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [item.quantity, item.productId]
        );
      }

      await connection.commit();

      return {
        orderId,
        total,
        status: "pending",
      };
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

## ✅ Best Practices Summary

### When to Use Built-in ORM Methods (Most Cases)

```typescript
// ✅ Always prefer built-in methods for standard operations
const users = await User.findAll();
const user = await User.findById(1);
const newUser = await User.create({ name, email, password });
await user.save();
await user.delete();

// ✅ Use QueryBuilder for complex queries
const results = await User.query()
  .where("isActive", true)
  .whereLike("name", searchTerm)
  .orderBy("createdAt", "DESC")
  .limit(10)
  .get();
```

### When to Use Raw SQL (Rarely)

```typescript
// ✅ Only for complex multi-table transactions
const connection = await this.db.getConnection();
try {
  await connection.beginTransaction();
  // Multiple related operations that must be atomic
  await connection.commit();
} catch (error) {
  await connection.rollback();
}
```

### Table Creation

**Two Options:**

#### Option 1: Auto-Sync (Development) 🔥

Use the built-in schema synchronization:

```typescript
// src/main.ts
import { SchemaSyncService } from "@fynixjs/fynix";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  // Auto-create tables from decorators
  if (process.env.NODE_ENV === "development") {
    const schemaSync = app.get<SchemaSyncService>(SchemaSyncService);
    await schemaSync.synchronize([User, Post, Product]);
  }

  await app.listen(3000);
}
```

#### Option 2: Manual SQL (Production)

Create tables manually or generate SQL:

```sql
-- Create your tables
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  isActive BOOLEAN DEFAULT true
);
```

**See [Schema Sync Guide](./11-SCHEMA_SYNC.md) for complete auto-sync documentation!**

---

## 📚 Next Steps

- [Getting Started](./01-GETTING_STARTED.md)
- [API Reference](./09-API_REFERENCE.md)
- [Core Concepts](./02-CORE_CONCEPTS.md)

---

**Build amazing applications with these FynixJS examples!**
