# Entity Decorator Documentation

## Overview

The Entity Decorator marks a TypeScript class as a database entity (model) and associates it with a specific database table. It's similar to TypeORM's `@Entity()` decorator and integrates seamlessly with the Column decorator to define complete database schemas using TypeScript classes.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Integration with Columns](#integration-with-columns)
- [Entity Metadata](#entity-metadata)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)
- [Complete Examples](#complete-examples)
- [Troubleshooting](#troubleshooting)

---

## Installation & Setup

The entity decorator requires reflect-metadata and works in conjunction with the Column decorator:

```typescript
import "reflect-metadata";
import { Entity } from "./decorators/entity.decorator";
import { Column, PrimaryGeneratedColumn } from "./decorators/column.decorator";
import { BaseEntity } from "./builtin/base-entity";
```

---

## Basic Usage

Apply the `@Entity` decorator to a class to mark it as a database entity:

```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 255 })
  email: string;
}
```

This creates a mapping between the `User` class and the `users` database table.

---

## API Reference

### @Entity

**Signature:**

```typescript
@Entity(tableName: string, options?: EntityOptions): ClassDecorator
```

**Parameters:**

- `tableName` (required): The database table name
- `options` (optional): Additional entity configuration
  - `primaryKey?: string` - Name of the primary key column (default: `'id'`)

**Returns:** `ClassDecorator` - A class decorator function

**Metadata:**

- **Key:** `ENTITY_METADATA`
- **Stored Data:** `EntityMetadata` object containing table name, primary key, and columns

**Static Properties Added:**

- `target.tableName` - The table name
- `target.primaryKey` - The primary key column name
- `target.columns` - Array of column metadata

**Example:**

```typescript
@Entity("products", { primaryKey: "productId" })
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  productId: number;

  @Column({ type: "varchar", length: 200 })
  name: string;
}
```

---

## Usage Examples

### Simple Entity

```typescript
@Entity("categories")
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "text", isNullable: true })
  description: string;
}
```

### Entity with Custom Primary Key

```typescript
@Entity("orders", { primaryKey: "orderId" })
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  orderId: number;

  @Column({ type: "varchar", length: 50, isUnique: true })
  orderNumber: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
```

### Entity with Multiple Columns

```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 50, isUnique: true })
  username: string;

  @Column({ type: "varchar", length: 255, isUnique: true })
  email: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash: string;

  @Column({ type: "varchar", length: 50, isNullable: true })
  firstName: string;

  @Column({ type: "varchar", length: 50, isNullable: true })
  lastName: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
```

### Entity with Relationships

```typescript
@Entity("posts")
@ForeignKey({
  column: "authorId",
  referencedTable: "users",
  referencedColumn: "id",
  onDelete: "CASCADE",
})
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "int", unsigned: true })
  authorId: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  viewCount: number;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  publishedAt: Date;
}
```

### Entity with Indexes

```typescript
@Entity("articles")
@Index(["authorId"])
@Index(["slug"], { isUnique: true })
@Index(["createdAt"])
@Index(["title", "status"], { name: "title_status_idx" })
export class Article extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, isUnique: true })
  slug: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "int", unsigned: true })
  authorId: number;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status: string;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
```

---

## Integration with Columns

The Entity decorator automatically collects metadata from Column decorators:

```typescript
@Entity("products")
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "text", isNullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  stock: number;
}
```

**Result:** The Entity decorator retrieves all column metadata and stores it alongside the entity metadata for schema generation and ORM operations.

---

## Entity Metadata

### EntityMetadata Interface

```typescript
interface EntityMetadata {
  tableName: string;
  primaryKey?: string;
  columns?: ColumnMetadata[];
}
```

### Accessing Metadata

```typescript
import { ENTITY_METADATA, EntityMetadata } from "./decorators/entity.decorator";

function getEntityMetadata(entityClass: any): EntityMetadata {
  return Reflect.getMetadata(ENTITY_METADATA, entityClass);
}

// Usage
const metadata = getEntityMetadata(User);
console.log(metadata);
// {
//   tableName: 'users',
//   primaryKey: 'id',
//   columns: [...]
// }
```

### Accessing Static Properties

```typescript
const tableName = User.tableName; // 'users'
const primaryKey = User.primaryKey; // 'id'
const columns = User.columns; // Array of ColumnMetadata
```

---

## Advanced Patterns

### Dynamic Entity Creation

```typescript
function createEntity(tableName: string, schema: any) {
  @Entity(tableName)
  class DynamicEntity extends BaseEntity {
    // Properties defined by schema
  }

  // Add columns dynamically
  Object.keys(schema).forEach((key) => {
    const columnOptions = schema[key];
    Column(columnOptions)(DynamicEntity.prototype, key);
  });

  return DynamicEntity;
}

// Usage
const UserEntity = createEntity("users", {
  id: { type: "int", isPrimary: true, autoIncrement: true },
  name: { type: "varchar", length: 100 },
  email: { type: "varchar", length: 255 },
});
```

### Entity Registry

```typescript
class EntityRegistry {
  private static entities = new Map<string, any>();

  static register(entityClass: any) {
    const metadata = Reflect.getMetadata(ENTITY_METADATA, entityClass);
    if (metadata) {
      this.entities.set(metadata.tableName, entityClass);
    }
  }

  static get(tableName: string) {
    return this.entities.get(tableName);
  }

  static getAll() {
    return Array.from(this.entities.values());
  }
}

// Register entities
EntityRegistry.register(User);
EntityRegistry.register(Product);
EntityRegistry.register(Order);

// Retrieve entity by table name
const UserEntity = EntityRegistry.get("users");
```

### Schema Generator

```typescript
function generateCreateTableSQL(entityClass: any): string {
  const metadata: EntityMetadata = Reflect.getMetadata(
    ENTITY_METADATA,
    entityClass
  );
  if (!metadata) {
    throw new Error("Not an entity class");
  }

  const { tableName, columns = [] } = metadata;

  const columnDefs = columns
    .map((col) => {
      let sql = `\`${col.propertyName}\` ${col.type}`;

      if (col.length) sql += `(${col.length})`;
      if (col.precision && col.scale) sql += `(${col.precision}, ${col.scale})`;
      if (col.unsigned) sql += " UNSIGNED";
      if (col.autoIncrement) sql += " AUTO_INCREMENT";
      if (!col.isNullable) sql += " NOT NULL";
      if (col.isUnique) sql += " UNIQUE";
      if (col.default !== undefined) {
        sql += ` DEFAULT ${
          typeof col.default === "string" ? `'${col.default}'` : col.default
        }`;
      }
      if (col.isPrimary) sql += " PRIMARY KEY";
      if (col.comment) sql += ` COMMENT '${col.comment}'`;

      return sql;
    })
    .join(",\n  ");

  return `CREATE TABLE \`${tableName}\` (\n  ${columnDefs}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
}

// Usage
const createTableSQL = generateCreateTableSQL(User);
console.log(createTableSQL);
```

### Entity Validator

```typescript
function validateEntity(entity: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const metadata: EntityMetadata = Reflect.getMetadata(
    ENTITY_METADATA,
    entity.constructor
  );

  if (!metadata) {
    return { valid: false, errors: ["Not an entity instance"] };
  }

  const { columns = [] } = metadata;

  for (const col of columns) {
    const value = entity[col.propertyName];

    // Check nullable
    if (!col.isNullable && (value === null || value === undefined)) {
      errors.push(`${col.propertyName} cannot be null`);
    }

    // Check string length
    if (col.type === "varchar" && col.length && typeof value === "string") {
      if (value.length > col.length) {
        errors.push(`${col.propertyName} exceeds max length of ${col.length}`);
      }
    }

    // Check unsigned
    if (col.unsigned && typeof value === "number" && value < 0) {
      errors.push(`${col.propertyName} must be unsigned (positive)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Usage
const user = new User();
user.email = null;
const validation = validateEntity(user);
console.log(validation);
// { valid: false, errors: ['email cannot be null'] }
```

### Entity Serializer

```typescript
function serializeEntity(entity: any, options?: { exclude?: string[] }) {
  const metadata: EntityMetadata = Reflect.getMetadata(
    ENTITY_METADATA,
    entity.constructor
  );

  if (!metadata) {
    throw new Error("Not an entity instance");
  }

  const { columns = [] } = metadata;
  const exclude = options?.exclude || [];
  const result: any = {};

  for (const col of columns) {
    if (!exclude.includes(col.propertyName)) {
      result[col.propertyName] = entity[col.propertyName];
    }
  }

  return result;
}

// Usage
const user = new User();
user.passwordHash = "hashed_password";
user.email = "user@example.com";

const serialized = serializeEntity(user, { exclude: ["passwordHash"] });
console.log(serialized); // { email: 'user@example.com', ... }
```

---

## Best Practices

### 1. Use Descriptive Table Names

```typescript
// Good - clear, plural table names
@Entity('users')
@Entity('products')
@Entity('order_items')

// Avoid - vague or singular
@Entity('user')
@Entity('data')
```

### 2. Extend BaseEntity

```typescript
// Good - inherit common functionality
@Entity("posts")
export class Post extends BaseEntity {
  // ...
}

// Avoid - missing base functionality
@Entity("posts")
export class Post {
  // ...
}
```

### 3. Use Consistent Naming Conventions

```typescript
// Good - consistent snake_case table names
@Entity('user_profiles')
@Entity('order_items')
@Entity('product_categories')

// Or consistent camelCase
@Entity('userProfiles')
@Entity('orderItems')
@Entity('productCategories')
```

### 4. Specify Primary Key When Non-Standard

```typescript
// Good - explicit primary key
@Entity("legacy_users", { primaryKey: "user_id" })
export class LegacyUser extends BaseEntity {
  @PrimaryGeneratedColumn()
  user_id: number;
}

// Default 'id' is assumed if not specified
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
}
```

### 5. Group Related Entities

```typescript
// User domain
@Entity("users")
export class User extends BaseEntity {}

@Entity("user_profiles")
export class UserProfile extends BaseEntity {}

@Entity("user_sessions")
export class UserSession extends BaseEntity {}

// Product domain
@Entity("products")
export class Product extends BaseEntity {}

@Entity("product_reviews")
export class ProductReview extends BaseEntity {}
```

### 6. Document Complex Entities

```typescript
/**
 * Represents a user in the system
 * Stores authentication and profile information
 */
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Unique username for login
   * Must be 3-50 characters
   */
  @Column({ type: "varchar", length: 50, isUnique: true })
  username: string;

  /**
   * Bcrypt hashed password
   * Never expose in API responses
   */
  @Column({ type: "varchar", length: 255 })
  passwordHash: string;
}
```

### 7. Maintain Entity Isolation

```typescript
// Good - each entity in its own file
// entities/user.entity.ts
@Entity("users")
export class User extends BaseEntity {}

// entities/product.entity.ts
@Entity("products")
export class Product extends BaseEntity {}

// Avoid - multiple entities in one file
// entities/all.entities.ts
@Entity("users")
export class User extends BaseEntity {}

@Entity("products")
export class Product extends BaseEntity {}
```

---

## Complete Examples

### E-Commerce Entities

```typescript
// User entity
@Entity("users")
@Index(["email"], { isUnique: true })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100, isUnique: true })
  email: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash: string;

  @Column({ type: "varchar", length: 50 })
  firstName: string;

  @Column({ type: "varchar", length: 50 })
  lastName: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

// Product entity
@Entity("products")
@Index(["categoryId"])
@Index(["sku"], { isUnique: true })
@ForeignKey({
  column: "categoryId",
  referencedTable: "categories",
  referencedColumn: "id",
  onDelete: "SET NULL",
})
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 50, isUnique: true })
  sku: string;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "text", isNullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  stock: number;

  @Column({ type: "int", unsigned: true, isNullable: true })
  categoryId: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

// Order entity
@Entity("orders")
@Index(["userId"])
@Index(["orderNumber"], { isUnique: true })
@ForeignKey({
  column: "userId",
  referencedTable: "users",
  referencedColumn: "id",
  onDelete: "CASCADE",
})
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 50, isUnique: true })
  orderNumber: string;

  @Column({ type: "int", unsigned: true })
  userId: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: "varchar", length: 20, default: "pending" })
  status: string;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "timestamp", isNullable: true })
  completedAt: Date;
}

// Order Item entity
@Entity("order_items")
@ForeignKey({
  column: "orderId",
  referencedTable: "orders",
  referencedColumn: "id",
  onDelete: "CASCADE",
})
@ForeignKey({
  column: "productId",
  referencedTable: "products",
  referencedColumn: "id",
  onDelete: "RESTRICT",
})
export class OrderItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", unsigned: true })
  orderId: number;

  @Column({ type: "int", unsigned: true })
  productId: number;

  @Column({ type: "int", unsigned: true })
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalPrice: number;
}
```

### Blog System Entities

```typescript
// Author entity
@Entity("authors")
@Index(["email"], { isUnique: true })
export class Author extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100, isUnique: true })
  email: string;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "text", isNullable: true })
  bio: string;

  @Column({ type: "varchar", length: 255, isNullable: true })
  avatarUrl: string;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  joinedAt: Date;
}

// Post entity
@Entity("posts")
@Index(["authorId"])
@Index(["slug"], { isUnique: true })
@Index(["publishedAt"])
@ForeignKey({
  column: "authorId",
  referencedTable: "authors",
  referencedColumn: "id",
  onDelete: "CASCADE",
})
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, isUnique: true })
  slug: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  excerpt: string;

  @Column({ type: "longtext" })
  content: string;

  @Column({ type: "int", unsigned: true })
  authorId: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  viewCount: number;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status: string;

  @Column({ type: "timestamp", isNullable: true })
  publishedAt: Date;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

// Comment entity
@Entity("comments")
@Index(["postId"])
@Index(["authorId"])
@ForeignKey({
  column: "postId",
  referencedTable: "posts",
  referencedColumn: "id",
  onDelete: "CASCADE",
})
@ForeignKey({
  column: "authorId",
  referencedTable: "authors",
  referencedColumn: "id",
  onDelete: "CASCADE",
})
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", unsigned: true })
  postId: number;

  @Column({ type: "int", unsigned: true })
  authorId: number;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "boolean", default: true })
  isApproved: boolean;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
```

---

## Troubleshooting

### Entity Not Recognized

**Problem:** ORM can't find entity

**Solution:** Ensure entity is properly decorated and imported:

```typescript
// Correct
@Entity("users")
export class User extends BaseEntity {}

// In module
import { User } from "./entities/user.entity";
```

### Metadata Not Available

**Problem:** Entity metadata returns undefined

**Solution:** Import reflect-metadata at entry point:

```typescript
// main.ts or index.ts (first line)
import "reflect-metadata";
```

### Columns Not Detected

**Problem:** Entity has no column metadata

**Solution:** Ensure columns are decorated before entity:

```typescript
// Correct order
@Entity("users")
export class User extends BaseEntity {
  @Column({ type: "varchar", length: 100 }) // Decorated first
  name: string;
}
```

### Primary Key Not Working

**Problem:** Custom primary key not recognized

**Solution:** Specify in entity options:

```typescript
@Entity("users", { primaryKey: "userId" })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  userId: number;
}
```

### Table Name Conflicts

**Problem:** Multiple entities with same table name

**Solution:** Use unique table names:

```typescript
// Conflict
@Entity("users")
export class User extends BaseEntity {}

@Entity("users") // ERROR!
export class AdminUser extends BaseEntity {}

// Fixed
@Entity("users")
export class User extends BaseEntity {}

@Entity("admin_users")
export class AdminUser extends BaseEntity {}
```

---

## Related Documentation

- [Column Decorator](./COLUMN_DECORATOR.md) - Define entity columns
- [Base Entity](./src/builtin/base-entity.ts) - Base class for entities
- [Repository](./src/builtin/repository.ts) - Data access layer
- [Database Service](./DOCSMED/05-DATABASE_ORM.md) - ORM operations
- [Relations](./src/builtin/relations.decorator.ts) - Entity relationships

---

## Metadata Constants

```typescript
export const ENTITY_METADATA = "entity:metadata";
```

Used internally to store and retrieve entity metadata via reflection.

---

## License

This documentation is part of the Fynix Framework.

---

**Last Updated**: December 4, 2025
