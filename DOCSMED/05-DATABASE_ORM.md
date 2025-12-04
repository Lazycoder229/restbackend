# 05 - Database & ORM

## 📋 Table of Contents

- [Database Setup](#database-setup)
- [Entities](#entities)
- [Entity Decorators](#entity-decorators)
- [Repository Pattern](#repository-pattern)
- [Query Builder](#query-builder)
- [Active Record Pattern](#active-record-pattern)
- [Relations](#relations)
- [Transactions](#transactions)
- [Schema Synchronization](#schema-synchronization)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)

---

## 🎯 Database Setup

### Configuration

```typescript
// main.ts
import { FynixFactory, DatabaseService } from "@fynixjs/fynix";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();

  // Database connection is automatic if configured
  const dbService = app.get(DatabaseService);

  await dbService.connect({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "myapp",
  });

  await app.listen(3000);
  console.log("🚀 Server running on http://localhost:3000");
}

bootstrap();
```

### Environment Variables

```.env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=myapp
```

---

## 🏗️ Entities

### Basic Entity

```typescript
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
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  age?: number;
}
```

### Entity with All Column Types

```typescript
@Entity("products")
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "int", default: 0 })
  stock: number;

  @Column({ type: "boolean", default: false })
  isActive: boolean;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
```

---

## 🎨 Entity Decorators

### @Entity()

Marks a class as a database entity.

```typescript
@Entity("table_name")
export class MyEntity extends BaseEntity {}
```

### @PrimaryGeneratedColumn()

Auto-incrementing primary key.

```typescript
@PrimaryGeneratedColumn()
id: number;
```

### @Column()

Define table columns with options.

```typescript
// Simple column
@Column()
name: string;

// With options
@Column({
  type: 'varchar',
  length: 100,
  nullable: true,
  unique: true,
  default: 'default value'
})
email: string;

// Numeric columns
@Column({ type: 'int' })
age: number;

@Column({ type: 'decimal', precision: 10, scale: 2 })
price: number;

// Date columns
@Column({ type: 'datetime' })
createdAt: Date;

// Boolean columns
@Column({ type: 'boolean', default: false })
isActive: boolean;

// Text columns
@Column({ type: 'text' })
content: string;
```

### @Index()

Create database indexes.

```typescript
@Entity("users")
export class User extends BaseEntity {
  @Column()
  @Index() // Single column index
  email: string;

  @Column()
  @Index("idx_lastname") // Named index
  lastName: string;
}
```

### @Unique()

Enforce unique constraints.

```typescript
@Entity("users")
export class User extends BaseEntity {
  @Column()
  @Unique()
  email: string;

  @Column()
  @Unique("unique_username")
  username: string;
}
```

### @ForeignKey()

Define foreign key relationships.

```typescript
@Entity("posts")
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  @ForeignKey({ table: "users", column: "id" })
  userId: number;
}
```

---

## 📦 Repository Pattern

### Creating a Repository

```typescript
import { Injectable, Repository } from "@fynixjs/fynix";
import { User } from "./user.entity";

@Injectable()
export class UserRepository extends Repository<User> {
  protected tableName = "users";

  // Custom methods
  async findByEmail(email: string): Promise<User | null> {
    return await this.findOneBy("email", email);
  }

  async findActive(): Promise<User[]> {
    return await this.query()
      .where("isActive", true)
      .orderBy("createdAt", "DESC")
      .get();
  }

  async findAdults(): Promise<User[]> {
    return await this.query().where("age", ">=", 18).get();
  }
}
```

### Built-in Repository Methods

```typescript
@Injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async examples() {
    // Find all
    const all = await this.userRepo.findAll();

    // Find by ID
    const user = await this.userRepo.findById(1);

    // Find by field
    const users = await this.userRepo.findBy("age", 25);

    // Find one by field
    const john = await this.userRepo.findOneBy("name", "John");

    // Create
    const newUser = await this.userRepo.create({
      email: "john@example.com",
      name: "John Doe",
      age: 30,
    });

    // Create many
    await this.userRepo.createMany([
      { email: "user1@example.com", name: "User 1" },
      { email: "user2@example.com", name: "User 2" },
    ]);

    // Update
    await this.userRepo.update(1, { name: "John Updated" });

    // Update by field
    await this.userRepo.updateBy("email", "john@example.com", {
      name: "John",
    });

    // Delete
    await this.userRepo.delete(1);

    // Delete by field
    await this.userRepo.deleteBy("email", "john@example.com");

    // Count
    const count = await this.userRepo.count();

    // Exists
    const exists = await this.userRepo.exists("email", "john@example.com");
  }
}
```

---

## 🔧 Query Builder

### Basic Queries

```typescript
@Injectable()
export class ProductService {
  constructor(private productRepo: ProductRepository) {}

  async findProducts() {
    // Simple select
    const all = await this.productRepo
      .query()
      .select("id", "name", "price")
      .get();

    // With WHERE
    const electronics = await this.productRepo
      .query()
      .where("category", "electronics")
      .get();

    // Multiple conditions
    const filtered = await this.productRepo
      .query()
      .where("category", "electronics")
      .where("price", "<", 100)
      .where("stock", ">", 0)
      .get();

    // WHERE IN
    const specific = await this.productRepo
      .query()
      .whereIn("id", [1, 2, 3, 4, 5])
      .get();

    // LIKE search
    const search = await this.productRepo
      .query()
      .whereLike("name", "laptop")
      .get();

    // ORDER BY
    const sorted = await this.productRepo
      .query()
      .orderBy("price", "DESC")
      .get();

    // LIMIT and OFFSET (pagination)
    const paginated = await this.productRepo.query().limit(10).offset(20).get();

    // First result
    const first = await this.productRepo
      .query()
      .where("category", "books")
      .first();

    // Count
    const count = await this.productRepo
      .query()
      .where("category", "electronics")
      .count();
  }
}
```

### Advanced Queries

```typescript
async advancedQueries() {
  // Complex WHERE conditions
  const products = await this.productRepo.query()
    .where('price', '>=', 100)
    .where('price', '<=', 500)
    .where('stock', '>', 0)
    .whereIn('category', ['electronics', 'computers'])
    .orderBy('price', 'ASC')
    .limit(20)
    .get();

  // Search with pagination
  const searchResults = await this.productRepo.query()
    .whereLike('name', 'laptop')
    .where('isActive', true)
    .orderBy('createdAt', 'DESC')
    .limit(10)
    .offset(0)
    .get();

  // Aggregation
  const totalProducts = await this.productRepo.query()
    .where('category', 'electronics')
    .count();
}
```

---

## 🎭 Active Record Pattern

### Using BaseEntity

```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  name: string;

  // Custom instance methods
  async posts() {
    return await Post.find({ where: { userId: this.id } });
  }

  async activate() {
    this.isActive = true;
    await this.save();
  }
}

// Usage
async function examples() {
  // Find all
  const users = await User.findAll();

  // Find by ID
  const user = await User.findById(1);

  // Find one
  const john = await User.findOne({
    where: { email: "john@example.com" },
  });

  // Find many
  const adults = await User.find({
    where: { age: { $gte: 18 } },
  });

  // Create
  const newUser = new User();
  newUser.email = "jane@example.com";
  newUser.name = "Jane Doe";
  await newUser.save();

  // Or create directly
  const user2 = await User.create({
    email: "bob@example.com",
    name: "Bob Smith",
  });

  // Update
  const userToUpdate = await User.findById(1);
  if (userToUpdate) {
    userToUpdate.name = "Updated Name";
    await userToUpdate.save();
  }

  // Delete
  const userToDelete = await User.findById(1);
  if (userToDelete) {
    await userToDelete.remove();
  }

  // Count
  const count = await User.count();

  // Exists
  const exists = await User.exists({ where: { email: "john@example.com" } });
}
```

---

## 🔗 Relations

### One-to-Many

```typescript
// Parent
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Helper method to get posts
  async posts() {
    return await Post.find({ where: { userId: this.id } });
  }
}

// Child
@Entity("posts")
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  @ForeignKey({ table: "users", column: "id" })
  userId: number;

  // Helper method to get user
  async user() {
    return await User.findById(this.userId);
  }
}

// Usage
const user = await User.findById(1);
const userPosts = await user.posts();

const post = await Post.findById(1);
const postAuthor = await post.user();
```

### Many-to-Many (with Junction Table)

```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  async roles() {
    const userRoles = await UserRole.find({
      where: { userId: this.id },
    });
    const roleIds = userRoles.map((ur) => ur.roleId);
    return await Role.find({
      where: { id: { $in: roleIds } },
    });
  }
}

@Entity("roles")
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}

@Entity("user_roles")
export class UserRole extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @ForeignKey({ table: "users", column: "id" })
  userId: number;

  @Column()
  @ForeignKey({ table: "roles", column: "id" })
  roleId: number;
}
```

---

## 🔄 Transactions

```typescript
@Injectable()
export class OrderService {
  constructor(
    private db: DatabaseService,
    private orderRepo: OrderRepository,
    private productRepo: ProductRepository
  ) {}

  async createOrder(userId: number, items: any[]) {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      // Create order
      const [orderResult] = await connection.query(
        "INSERT INTO orders (userId, total) VALUES (?, ?)",
        [userId, calculateTotal(items)]
      );

      // Update inventory
      for (const item of items) {
        await connection.query(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [item.quantity, item.productId]
        );
      }

      await connection.commit();
      return { orderId: orderResult.insertId };
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

## 🔄 Schema Synchronization

### Auto-Create Tables

```typescript
import { SchemaSyncService } from "@fynixjs/fynix";
import { User } from "./entities/user.entity";
import { Post } from "./entities/post.entity";

async function syncSchema() {
  const schemaSync = new SchemaSyncService(databaseService);

  // Sync specific entities
  await schemaSync.syncEntities([User, Post]);

  // Or sync all entities in a module
  await schemaSync.syncModule(AppModule);
}

// In main.ts
async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();

  // Sync schema on startup (development only!)
  if (process.env.NODE_ENV === "development") {
    const schemaSync = app.get(SchemaSyncService);
    await schemaSync.syncModule(AppModule);
  }

  await app.listen(3000);
}
```

---

## ✅ Best Practices

### 1. Use Repositories

```typescript
// ✅ Good
@Injectable()
export class UserRepository extends Repository<User> {
  protected tableName = "users";

  async findActive() {
    return await this.query().where("isActive", true).get();
  }
}

// ❌ Bad - raw queries in service
@Injectable()
export class UserService {
  async findUsers() {
    return await db.query("SELECT * FROM users WHERE isActive = 1");
  }
}
```

### 2. Use Entities for Type Safety

```typescript
// ✅ Good
@Entity("users")
export class User extends BaseEntity {
  @Column()
  email: string;

  @Column()
  name: string;
}

const user: User = await User.findById(1);

// ❌ Bad - untyped
const user: any = await db.query("SELECT * FROM users WHERE id = 1");
```

### 3. Validate Before Saving

```typescript
// ✅ Good
@Injectable()
export class UserService {
  async create(dto: CreateUserDto) {
    // Validate
    if (!dto.email || !dto.name) {
      throw new BadRequestException("Missing required fields");
    }

    // Check duplicates
    const exists = await this.userRepo.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException("Email already exists");
    }

    return await this.userRepo.create(dto);
  }
}
```

### 4. Use Transactions for Multiple Operations

```typescript
// ✅ Good
async createOrder(items: any[]) {
  const conn = await this.db.getConnection();
  try {
    await conn.beginTransaction();

    const order = await this.createOrderRecord(conn);
    await this.updateInventory(conn, items);

    await conn.commit();
    return order;
  } catch (error) {
    await conn.rollback();
    throw error;
  }
}
```

### 5. Pagination for Large Datasets

```typescript
// ✅ Good
async findAll(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;

  return await this.userRepo.query()
    .limit(limit)
    .offset(offset)
    .get();
}
```

---

## 🎯 Real-World Examples

### Example: Blog with Posts and Comments

```typescript
@Entity("posts")
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column()
  @ForeignKey({ table: "users", column: "id" })
  authorId: number;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  async author() {
    return await User.findById(this.authorId);
  }

  async comments() {
    return await Comment.find({ where: { postId: this.id } });
  }
}

@Injectable()
export class PostService {
  constructor(private postRepo: PostRepository) {}

  async findWithAuthor(id: number) {
    const post = await this.postRepo.findById(id);
    if (!post) throw new NotFoundException();

    const author = await post.author();
    const comments = await post.comments();

    return { ...post, author, comments };
  }

  async search(query: string, page: number = 1) {
    return await this.postRepo
      .query()
      .whereLike("title", query)
      .orWhereLike("content", query)
      .orderBy("createdAt", "DESC")
      .limit(10)
      .offset((page - 1) * 10)
      .get();
  }
}
```

---

## 📚 Next Steps

- **[06-SECURITY_AUTH.md](./06-SECURITY_AUTH.md)** - Secure your data
- **[08-VALIDATION_PIPES.md](./08-VALIDATION_PIPES.md)** - Validate entities
- **[11-TESTING.md](./11-TESTING.md)** - Test database operations

---

## 💡 Key Takeaways

✅ Use entities with decorators for type-safe models  
✅ Repository pattern for organized data access  
✅ Query Builder for complex queries  
✅ Active Record (BaseEntity) for simple CRUD  
✅ Define relations with foreign keys  
✅ Use transactions for data integrity  
✅ Schema sync for automatic table creation  
✅ Always validate before persisting

---

**Master Database & ORM** to build data-driven applications!
