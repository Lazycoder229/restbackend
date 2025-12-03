# Database & ORM

FynixJS includes a built-in ORM with three approaches: QueryBuilder, Repository Pattern, and Active Record (BaseEntity).

---

## 📋 Table of Contents

- [Setup & Configuration](#setup--configuration)
- [Entity Pattern (Recommended)](#entity-pattern-recommended)
- [QueryBuilder](#querybuilder)
- [Repository Pattern](#repository-pattern)
- [Transactions](#transactions)
- [Best Practices](#best-practices)

---

## ⚙️ Setup & Configuration

### Initialize Database Connection

```typescript
import { FynixFactory, DatabaseService } from "@fynixjs/fynix";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();

  // Get database service
  const db = app.get<DatabaseService>(DatabaseService);

  // Initialize connection
  await db.initialize({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "myapp",
    connectionLimit: 10,
  });

  console.log(" Database connected");
  await app.listen(3000);
}

bootstrap();
```

### Environment Variables

```bash
# .env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=myapp
```

---

## 🌟 Entity Pattern (Recommended)

The Active Record pattern with decorators - just like TypeORM!

### Define an Entity

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
  name: string;

  @Column()
  email: string;

  @Column()
  age?: number;

  @Column()
  isActive?: boolean;
}
```

### Entity Methods

#### Static Methods

```typescript
// Find all
const users = await User.findAll();

// Find by ID
const user = await User.findById(1);

// Find one with conditions
const user = await User.findOne({ email: "john@example.com" });

// Find many with conditions
const activeUsers = await User.findMany({ isActive: true });

// Create
const user = await User.create({
  name: "John",
  email: "john@example.com",
  age: 25,
});

// Update (returns number of affected rows)
const affectedRows = await User.update({ id: 1 }, { name: "Jane" });

// Remove (returns number of affected rows)
const deletedRows = await User.remove({ isActive: false });

// Count
const total = await User.count();
const activeCount = await User.count({ isActive: true });

// Exists
const exists = await User.exists({ email: "john@example.com" });

// Query builder for complex queries
const users = await User.query()
  .where("age", ">", 18)
  .orderBy("name", "ASC")
  .limit(10)
  .get();
```

#### Instance Methods

```typescript
// Create and save
const user = new User();
user.name = "John";
user.email = "john@example.com";
user.age = 25;
await user.save();

// Update
const user = await User.findById(1);
user.name = "Jane";
await user.save();

// Delete
const user = await User.findById(1);
await user.delete();

// Reload from database
await user.reload();
```

### Custom Entity Methods

```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  age: number;

  // Custom static method
  static async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ email });
  }

  // Custom static method with complex query
  static async findAdults(): Promise<User[]> {
    return await this.query()
      .where("age", ">=", 18)
      .orderBy("name", "ASC")
      .get();
  }

  // Custom instance method
  isAdult(): boolean {
    return this.age >= 18;
  }

  // Custom instance method
  getDisplayName(): string {
    return `${this.name} (${this.email})`;
  }
}

// Usage
const user = await User.findByEmail("john@example.com");
const adults = await User.findAdults();

if (user && user.isAdult()) {
  console.log(user.getDisplayName());
}
```

### Advanced Queries with QueryBuilder

```typescript
const users = await User.query()
  .where("age", ">", 18)
  .where("isActive", true)
  .orderBy("name", "ASC")
  .limit(10)
  .get();
```

---

## 🔨 QueryBuilder

Fluent interface for building SQL queries.

### Basic Queries

```typescript
import { QueryBuilder, DatabaseService } from "@fynixjs/fynix";

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async getUsers() {
    const qb = new QueryBuilder(this.db);
    return await qb.table("users").get();
  }
}
```

### SELECT Queries

```typescript
// Select all
const users = await qb.table("users").get();

// Select specific fields
const users = await qb.table("users").select("id", "name", "email").get();

// First result only
const user = await qb.table("users").first();

// Find by ID
const user = await qb.table("users").find(1);
```

### WHERE Clauses

```typescript
// Simple where
const users = await qb.table("users").where("age", ">", 18).get();

// Multiple conditions (AND)
const users = await qb
  .table("users")
  .where("age", ">", 18)
  .where("isActive", true)
  .get();

// WHERE IN
const users = await qb.table("users").whereIn("id", [1, 2, 3]).get();

// WHERE LIKE
const users = await qb.table("users").whereLike("name", "John").get();
```

### Joins

```typescript
const results = await qb
  .table("users")
  .join("orders", "users.id", "orders.user_id")
  .select("users.name", "orders.total")
  .get();

// Left join
const results = await qb
  .table("users")
  .leftJoin("orders", "users.id", "orders.user_id")
  .get();
```

### ORDER BY & LIMIT

```typescript
const users = await qb
  .table("users")
  .orderBy("name", "ASC")
  .limit(10)
  .offset(20)
  .get();
```

### INSERT

```typescript
const result = await qb.table("users").insert({
  name: "John",
  email: "john@example.com",
  age: 25,
});

console.log(result.insertId);
```

### UPDATE

```typescript
await qb.table("users").where("id", 1).update({ name: "Jane" });
```

### DELETE

```typescript
await qb.table("users").where("id", 1).delete();
```

### Aggregations

```typescript
// Count
const count = await qb.table("users").count();

// With conditions
const activeCount = await qb.table("users").where("isActive", true).count();

// Exists
const exists = await qb
  .table("users")
  .where("email", "john@example.com")
  .exists();
```

### Pagination

```typescript
// Paginate results
const result = await qb.table("users").paginate(1, 10);
// Returns: { data, total, currentPage, perPage, lastPage }

console.log(result.data); // Array of users
console.log(result.total); // Total records
console.log(result.lastPage); // Total pages
```

### Raw Queries

```typescript
// Execute raw SQL when needed
const results = await qb.raw("SELECT * FROM users WHERE age > ?", [18]);
```

---

## 🗂️ Repository Pattern

Service-based approach for database operations.

### Create a Repository

```typescript
import { Injectable, Repository } from "@fynixjs/fynix";

interface User {
  id?: number;
  name: string;
  email: string;
  age?: number;
}

@Injectable()
export class UserRepository extends Repository<User> {
  tableName = "users";

  // Custom method using built-in findOneBy
  async findByEmail(email: string): Promise<User | null> {
    return await this.findOneBy("email", email);
  }

  // Custom method using built-in findBy
  async findActiveUsers(): Promise<User[]> {
    return await this.findBy("isActive", true);
  }

  // Custom method using query builder
  async search(query: string): Promise<User[]> {
    return await this.query().whereLike("name", query).get();
  }
}
```

### Built-in Repository Methods

```typescript
// Find all records
const users = await userRepo.findAll();

// Find by ID
const user = await userRepo.findById(1);

// Find by field
const activeUsers = await userRepo.findBy("isActive", true);

// Find one by field
const user = await userRepo.findOneBy("email", "john@example.com");

// Create single record
const user = await userRepo.create({ name: "John", email: "john@example.com" });

// Create multiple records
await userRepo.createMany([
  { name: "John", email: "john@example.com" },
  { name: "Jane", email: "jane@example.com" },
]);

// Update by ID (returns affected rows)
const affected = await userRepo.update(1, { name: "Jane" });

// Update by field (returns affected rows)
const affected = await userRepo.updateBy("email", "john@example.com", {
  name: "Johnny",
});

// Delete by ID (returns affected rows)
await userRepo.delete(1);

// Delete by field (returns affected rows)
await userRepo.deleteBy("isActive", false);

// Count all
const total = await userRepo.count();

// Count by field
const activeCount = await userRepo.countBy("isActive", true);

// Check if exists
const exists = await userRepo.exists(1);

// Paginate
const result = await userRepo.paginate(1, 10);

// Save (insert or update based on ID presence)
const user = await userRepo.save({ id: 1, name: "Updated" }); // Update
const newUser = await userRepo.save({ name: "New" }); // Insert
```

### Use Repository in Service

```typescript
@Injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getAllUsers() {
    return await this.userRepo.findAll();
  }

  async getUserById(id: number) {
    return await this.userRepo.findById(id);
  }

  async createUser(userData: User) {
    return await this.userRepo.create(userData);
  }

  async updateUser(id: number, userData: Partial<User>) {
    return await this.userRepo.update(id, userData);
  }

  async deleteUser(id: number) {
    return await this.userRepo.delete(id);
  }

  async getUsersPaginated(page: number, limit: number) {
    return await this.userRepo.paginate(page, limit);
  }
}
```

---

## 💼 Transactions

Execute multiple queries atomically.

### Using Transactions

```typescript
import { DatabaseService } from "@fynixjs/fynix";

@Injectable()
export class OrderService {
  constructor(private db: DatabaseService) {}

  async createOrder(orderData: any) {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      // Insert order
      const [orderResult] = await connection.execute(
        "INSERT INTO orders (user_id, total) VALUES (?, ?)",
        [orderData.userId, orderData.total]
      );

      // Insert order items
      for (const item of orderData.items) {
        await connection.execute(
          "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
          [orderResult.insertId, item.productId, item.quantity]
        );
      }

      // Update inventory
      for (const item of orderData.items) {
        await connection.execute(
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

## ✅ Best Practices

### 1. Use Entities for Simple CRUD

```typescript
// ✅ Good - clean and simple
const users = await User.findAll();
const user = await User.findById(1);
```

### 2. Use QueryBuilder for Complex Queries

```typescript
// ✅ Good - complex joins and conditions
const results = await User.query()
  .join("orders", "users.id", "orders.user_id")
  .where("orders.total", ">", 1000)
  .groupBy("users.id")
  .having("COUNT(orders.id)", ">", 5)
  .get();
```

### 3. Always Use Parameterized Queries

```typescript
// ✅ Good - SQL injection safe
await qb.table("users").where("id", userId).get();

// ❌ Bad - SQL injection vulnerable
await db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

### 4. Handle Errors Properly

```typescript
try {
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundException("User not found");
  }
  return user;
} catch (error) {
  throw new InternalServerErrorException(error.message);
}
```

### 5. Use Transactions for Multi-Step Operations

```typescript
// ✅ Good - atomic operation
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  // ... multiple queries
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
}
```

---

## 📚 Next Steps

- [Security](./06-SECURITY.md)
- [Guards & Interceptors](./07-GUARDS_INTERCEPTORS.md)
- [Examples](./10-EXAMPLES.md)

---

**Master the ORM to build data-driven applications with FynixJS!**
