# Schema Synchronization Guide

**Auto-create and update database tables from your entity decorators** - no manual SQL needed!

---

## 🎯 Overview

FynixJS includes a built-in **Schema Synchronization Service** that automatically creates and updates database tables based on your `@Entity` decorators. Similar to TypeORM's `synchronize` or Prisma migrations, but **completely dependency-free**.

---

## 🚀 Quick Start

### 1. Define Your Entities

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
  password: string;
}

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
}
```

### 2. Enable Auto-Sync in Development

```typescript
// src/main.ts
import {
  FynixFactory,
  DatabaseService,
  SchemaSyncService,
} from "@fynixjs/fynix";
import { AppModule } from "./app.module";
import { User } from "./modules/user/user.entity";
import { Post } from "./modules/blog/post.entity";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  // Get services
  const db = app.get<DatabaseService>(DatabaseService);
  const schemaSync = app.get<SchemaSyncService>(SchemaSyncService);

  // Configure database
  db.initialize({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "myapp",
  });

  // 🔥 Auto-sync schemas (development only!)
  if (process.env.NODE_ENV === "development") {
    await schemaSync.synchronize([User, Post]);
  }

  await app.listen(3000);
}

bootstrap();
```

### 3. Tables Are Created Automatically! 🎉

```
🔄 Starting schema synchronization...
📝 Syncing table: users
✅ Created table: users
📝 Syncing table: posts
✅ Created table: posts
✅ Schema synchronization completed!
Application is running on: http://localhost:3000
```

---

## 📚 Advanced Usage

### Column Types

Specify custom column types:

```typescript
@Entity("products")
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "decimal" })
  price: number;

  @Column({ type: "int" })
  stock: number;

  @Column({ type: "boolean" })
  isActive: boolean;

  @Column({ type: "datetime" })
  createdAt: Date;

  @Column({ type: "json" })
  metadata: any;
}
```

**Supported Types:**

- `string` → `VARCHAR(255)`
- `number` → `INT`
- `boolean` → `BOOLEAN`
- `date` → `DATETIME`
- `text` → `TEXT`
- `bigint` → `BIGINT`
- `float` → `FLOAT`
- `double` → `DOUBLE`
- `decimal` → `DECIMAL(10,2)`
- `json` → `JSON`

### Drop & Recreate (Development Only!)

⚠️ **WARNING: This will delete all data!**

```typescript
await schemaSync.synchronize([User, Post], {
  dropBeforeSync: true,
});
```

### Adding New Columns

Just add the decorator and restart:

```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  // ✨ New column - will be auto-added!
  @Column()
  phoneNumber: string;
}
```

Output:

```
📝 Syncing table: users
  ➕ Added column: users.phoneNumber
```

### Generate SQL Migration Files

For production, generate SQL files:

```typescript
const schemaSync = app.get<SchemaSyncService>(SchemaSyncService);

const sql = await schemaSync.generateMigration(
  [User, Post, Product],
  "initial-schema"
);

console.log(sql);
// Save to file: migrations/1234567890-initial-schema.sql
```

---

## 🏗️ Module Setup

Register `SchemaSyncService` in your database module:

```typescript
// src/modules/database/database.module.ts
import { Module, DatabaseService, SchemaSyncService } from "@fynixjs/fynix";

@Module({
  providers: [DatabaseService, SchemaSyncService],
  exports: [DatabaseService, SchemaSyncService],
})
export class DatabaseModule {}
```

---

## ⚠️ Production Best Practices

### ❌ Don't Use Auto-Sync in Production

```typescript
// ❌ BAD - risky in production
await schemaSync.synchronize(entities);
```

### ✅ Use Manual Migrations

```typescript
// ✅ GOOD - controlled migrations
// 1. Generate SQL in development
const sql = await schemaSync.generateMigration(entities, "add-users-table");

// 2. Save to file
import fs from "fs";
fs.writeFileSync(`migrations/${Date.now()}-add-users-table.sql`, sql);

// 3. Run manually in production
// mysql -u root -p mydb < migrations/1234567890-add-users-table.sql
```

### Environment-Based Configuration

```typescript
async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  const db = app.get<DatabaseService>(DatabaseService);
  const schemaSync = app.get<SchemaSyncService>(SchemaSyncService);

  db.initialize({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Only sync in development
  if (process.env.NODE_ENV === "development") {
    await schemaSync.synchronize([User, Post]);
  }

  await app.listen(3000);
}
```

---

## 🎯 Complete Example

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

  @Column({ type: "boolean" })
  isActive: boolean;

  @Column({ type: "datetime" })
  createdAt: Date;
}

// src/main.ts
import {
  FynixFactory,
  DatabaseService,
  SchemaSyncService,
} from "@fynixjs/fynix";
import { AppModule } from "./app.module";
import { User } from "./modules/user/user.entity";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  const db = app.get<DatabaseService>(DatabaseService);
  db.initialize({
    host: "localhost",
    user: "root",
    password: "password",
    database: "myapp",
  });

  // Auto-create tables in development
  if (process.env.NODE_ENV === "development") {
    const schemaSync = app.get<SchemaSyncService>(SchemaSyncService);
    await schemaSync.synchronize([User]);
  }

  await app.listen(3000);
}

bootstrap();

// Now use the ORM - no manual CREATE TABLE needed!
const user = await User.create({
  name: "John Doe",
  email: "john@example.com",
  password: "hashed...",
  role: "user",
  isActive: true,
  createdAt: new Date(),
});
```

---

## 🚀 Advanced Features

### Foreign Keys

Define relationships between tables:

```typescript
@Entity("posts")
@ForeignKey({
  column: "userId",
  referencedTable: "users",
  referencedColumn: "id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "int", unsigned: true })
  userId: number; // Foreign key to users.id
}
```

**Foreign Key Options:**

- `onDelete`: `CASCADE` | `SET NULL` | `RESTRICT` | `NO ACTION`
- `onUpdate`: `CASCADE` | `SET NULL` | `RESTRICT` | `NO ACTION`

### Indexes

Create indexes for better query performance:

```typescript
@Entity("users")
@Index(["email"]) // Single column index
@Index(["firstName", "lastName"], { name: "name_idx" }) // Composite index
@Unique(["email"]) // Unique index (shorthand)
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100, isUnique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;
}
```

### All MySQL Data Types

Full support for all MySQL column types:

```typescript
@Entity("products")
export class Product extends BaseEntity {
  // String types
  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "char", length: 10 })
  code: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "mediumtext" })
  content: string;

  // Numeric types
  @Column({ type: "int", unsigned: true })
  stock: number;

  @Column({ type: "bigint", unsigned: true })
  views: number;

  @Column({ type: "tinyint", length: 1 })
  isActive: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, unsigned: true })
  price: number;

  @Column({ type: "float" })
  rating: number;

  // Date/Time types
  @Column({ type: "datetime" })
  createdAt: Date;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  updatedAt: Date;

  @Column({ type: "date" })
  publishDate: Date;

  // JSON
  @Column({ type: "json" })
  metadata: any;

  // Binary
  @Column({ type: "blob" })
  thumbnail: Buffer;
}
```

### Column Options

Full control over column definitions:

```typescript
@Column({
  type: "varchar",           // Data type
  length: 100,               // Length for string/numeric types
  precision: 10,             // Precision for decimal
  scale: 2,                  // Scale for decimal
  isNullable: true,          // Allow NULL values
  isUnique: true,            // Add UNIQUE constraint
  unsigned: true,            // For numeric types
  default: "active",         // Default value
  autoIncrement: true,       // AUTO_INCREMENT (usually with primary key)
  comment: "User status"     // Column comment
})
status: string;
```

### Complete Example with All Features

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  Index,
  Unique,
  ForeignKey,
} from "@fynixjs/fynix";

@Entity("posts")
@Index(["userId"]) // Index for foreign key
@Index(["title", "published"]) // Composite index
@Index(["slug"], { isUnique: true }) // Unique index
@ForeignKey({
  column: "userId",
  referencedTable: "users",
  referencedColumn: "id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
@ForeignKey({
  column: "categoryId",
  referencedTable: "categories",
  referencedColumn: "id",
  onDelete: "SET NULL",
})
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ type: "varchar", length: 200, comment: "Post title" })
  title: string;

  @Column({ type: "varchar", length: 200, isUnique: true })
  slug: string;

  @Column({ type: "mediumtext" })
  content: string;

  @Column({ type: "bigint", unsigned: true })
  userId: number;

  @Column({ type: "int", unsigned: true, isNullable: true })
  categoryId: number | null;

  @Column({ type: "tinyint", length: 1, default: 0 })
  published: boolean;

  @Column({ type: "int", unsigned: true, default: 0 })
  viewCount: number;

  @Column({ type: "json", isNullable: true })
  tags: string[];

  @Column({ type: "datetime" })
  createdAt: Date;

  @Column({ type: "datetime" })
  updatedAt: Date;
}
```

## 🔧 Supported MySQL Types

**String Types:**

- `VARCHAR(n)` - Variable length string
- `CHAR(n)` - Fixed length string
- `TEXT` - Text up to 65,535 characters
- `TINYTEXT` - Text up to 255 characters
- `MEDIUMTEXT` - Text up to 16,777,215 characters
- `LONGTEXT` - Text up to 4GB

**Numeric Types:**

- `TINYINT(n)` - -128 to 127
- `SMALLINT(n)` - -32,768 to 32,767
- `MEDIUMINT(n)` - -8,388,608 to 8,388,607
- `INT(n)` - -2,147,483,648 to 2,147,483,647
- `BIGINT(n)` - -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807
- `FLOAT` - Floating point number
- `DOUBLE` - Double precision floating point
- `DECIMAL(p,s)` - Fixed-point number

**Date/Time Types:**

- `DATE` - Date (YYYY-MM-DD)
- `TIME` - Time (HH:MM:SS)
- `DATETIME` - Date and time
- `TIMESTAMP` - Timestamp with timezone
- `YEAR` - Year (YYYY)

**Binary Types:**

- `BINARY(n)` - Fixed length binary
- `VARBINARY(n)` - Variable length binary
- `BLOB` - Binary large object
- `TINYBLOB`, `MEDIUMBLOB`, `LONGBLOB`

**Other Types:**

- `JSON` - JSON data
- `ENUM('a','b','c')` - Enumeration
- `SET('a','b','c')` - Set of values
- `BOOLEAN` - Alias for TINYINT(1)

---

## 📚 Next Steps

- [Database Guide](./05-DATABASE.md)
- [Getting Started](./01-GETTING_STARTED.md)
- [Examples](./10-EXAMPLES.md)

---

**Build faster with auto-schema synchronization in FynixJS!**
