# Column Decorator Documentation

## Overview

The Column Decorator module provides a comprehensive set of decorators for defining database schema at the entity level. It uses TypeScript's reflection metadata system to attach database schema information to entity classes and their properties.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Core Decorators](#core-decorators)
- [Metadata Interfaces](#metadata-interfaces)
- [Usage Examples](#usage-examples)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Installation & Setup

The column decorator is part of the Fynix framework and requires the `reflect-metadata` package:

```typescript
import "reflect-metadata";
import {
  Column,
  PrimaryGeneratedColumn,
  Index,
  Unique,
  ForeignKey,
} from "./decorators/column.decorator";
```

---

## Core Decorators

### @Column

The primary decorator for marking entity properties as database columns.

**Signature:**

```typescript
@Column(options?: ColumnOptions): PropertyDecorator
```

**Options:**

- `type?: string` - Database column type (e.g., 'varchar', 'int', 'decimal')
- `length?: number` - Maximum length for string types
- `precision?: number` - Total number of digits for decimal types
- `scale?: number` - Number of digits after decimal point
- `isPrimary?: boolean` - Mark as primary key
- `isNullable?: boolean` - Allow NULL values (default: false)
- `isUnique?: boolean` - Add unique constraint
- `default?: any` - Default value
- `unsigned?: boolean` - Use unsigned integer (numbers only)
- `autoIncrement?: boolean` - Enable auto-increment
- `comment?: string` - Column comment/description

**Example:**

```typescript
@Column({ type: 'varchar', length: 255, isUnique: true })
email: string;

@Column({ type: 'text', isNullable: true })
bio: string;

@Column({ type: 'int', unsigned: true, default: 0 })
views: number;
```

### @PrimaryGeneratedColumn

Convenience decorator for auto-incrementing primary keys.

**Signature:**

```typescript
@PrimaryGeneratedColumn(options?: { type?: 'int' | 'bigint' }): PropertyDecorator
```

**Example:**

```typescript
@PrimaryGeneratedColumn()
id: number;

@PrimaryGeneratedColumn({ type: 'bigint' })
id: bigint;
```

### @Index

Creates database indexes on entity columns (class-level decorator).

**Signature:**

```typescript
@Index(columns: string[], options?: IndexOptions): ClassDecorator
```

**Options:**

- `isUnique?: boolean` - Create unique index
- `name?: string` - Custom index name

**Example:**

```typescript
@Entity("users")
@Index(["email"])
@Index(["firstName", "lastName"], { name: "name_idx" })
@Index(["username"], { isUnique: true })
export class User extends BaseEntity {
  // ...
}
```

### @Unique

Shorthand decorator for creating unique indexes.

**Signature:**

```typescript
@Unique(columns: string[]): ClassDecorator
```

**Example:**

```typescript
@Entity("products")
@Unique(["sku"])
@Unique(["name", "categoryId"])
export class Product extends BaseEntity {
  // ...
}
```

### @ForeignKey

Defines foreign key relationships between tables (class-level decorator).

**Signature:**

```typescript
@ForeignKey(options: ForeignKeyOptions): ClassDecorator
```

**Options:**

- `column: string` - Local column name
- `referencedTable: string` - Referenced table name
- `referencedColumn: string` - Referenced column name
- `onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'` - Delete action
- `onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'` - Update action
- `name?: string` - Custom constraint name

**Example:**

```typescript
@Entity("posts")
@ForeignKey({
  column: "userId",
  referencedTable: "users",
  referencedColumn: "id",
  onDelete: "CASCADE",
})
@ForeignKey({
  column: "categoryId",
  referencedTable: "categories",
  referencedColumn: "id",
  onDelete: "SET NULL",
})
export class Post extends BaseEntity {
  // ...
}
```

---

## Metadata Interfaces

### ColumnMetadata

```typescript
interface ColumnMetadata {
  propertyName: string;
  type?: string;
  length?: number;
  precision?: number;
  scale?: number;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  default?: any;
  unsigned?: boolean;
  autoIncrement?: boolean;
  comment?: string;
}
```

### IndexMetadata

```typescript
interface IndexMetadata {
  columns: string[];
  isUnique?: boolean;
  name?: string;
}
```

### ForeignKeyMetadata

```typescript
interface ForeignKeyMetadata {
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  onUpdate?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  name?: string;
}
```

---

## Usage Examples

### Complete Entity Example

```typescript
import { Entity } from "./entity.decorator";
import {
  Column,
  PrimaryGeneratedColumn,
  Index,
  ForeignKey,
} from "./column.decorator";
import { BaseEntity } from "../builtin/base-entity";

@Entity("users")
@Index(["email"], { isUnique: true })
@Index(["createdAt"])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100, isUnique: true })
  username: string;

  @Column({ type: "varchar", length: 255, isUnique: true })
  email: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash: string;

  @Column({ type: "varchar", length: 50, isNullable: true })
  firstName: string;

  @Column({ type: "varchar", length: 50, isNullable: true })
  lastName: string;

  @Column({ type: "text", isNullable: true })
  bio: string;

  @Column({ type: "boolean", default: false })
  isActive: boolean;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
```

### Numeric Columns

```typescript
@Entity("products")
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 200 })
  name: string;

  // Decimal for prices
  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  // Integer for quantities
  @Column({ type: "int", unsigned: true, default: 0 })
  stock: number;

  // Float for ratings
  @Column({ type: "float", isNullable: true })
  rating: number;

  // BigInt for large numbers
  @Column({ type: "bigint", unsigned: true })
  views: bigint;
}
```

### Text and String Columns

```typescript
@Entity("articles")
export class Article extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Short strings
  @Column({ type: "varchar", length: 255 })
  title: string;

  // Medium text
  @Column({ type: "text" })
  content: string;

  // Long text
  @Column({ type: "longtext", isNullable: true })
  extendedContent: string;

  // Fixed length strings
  @Column({ type: "char", length: 10 })
  code: string;

  // Enum-like columns
  @Column({ type: "varchar", length: 20, default: "draft" })
  status: "draft" | "published" | "archived";
}
```

### Date and Time Columns

```typescript
@Entity("events")
export class Event extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 200 })
  name: string;

  // Date only
  @Column({ type: "date" })
  eventDate: Date;

  // Time only
  @Column({ type: "time" })
  startTime: Date;

  // DateTime
  @Column({ type: "datetime" })
  eventDateTime: Date;

  // Timestamp with auto-update
  @Column({ type: "timestamp", default: "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
```

### Relationships with Foreign Keys

```typescript
@Entity("posts")
@ForeignKey({
  column: "authorId",
  referencedTable: "users",
  referencedColumn: "id",
  onDelete: "CASCADE",
})
@ForeignKey({
  column: "categoryId",
  referencedTable: "categories",
  referencedColumn: "id",
  onDelete: "SET NULL",
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

  @Column({ type: "int", unsigned: true, isNullable: true })
  categoryId: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  views: number;
}
```

### Composite Indexes

```typescript
@Entity("user_profiles")
@Index(["userId"], { isUnique: true, name: "user_profile_unique" })
@Index(["firstName", "lastName"], { name: "name_search_idx" })
@Index(["country", "city"], { name: "location_idx" })
export class UserProfile extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", unsigned: true })
  userId: number;

  @Column({ type: "varchar", length: 50, isNullable: true })
  firstName: string;

  @Column({ type: "varchar", length: 50, isNullable: true })
  lastName: string;

  @Column({ type: "varchar", length: 100, isNullable: true })
  country: string;

  @Column({ type: "varchar", length: 100, isNullable: true })
  city: string;
}
```

---

## Advanced Patterns

### Custom Metadata Retrieval

```typescript
import { COLUMN_METADATA, ColumnMetadata } from "./column.decorator";

function getEntityColumns(entityClass: any): ColumnMetadata[] {
  return Reflect.getMetadata(COLUMN_METADATA, entityClass) || [];
}

// Usage
const columns = getEntityColumns(User);
console.log(columns);
```

### Dynamic Schema Generation

```typescript
function generateCreateTableSQL(entityClass: any, tableName: string): string {
  const columns: ColumnMetadata[] =
    Reflect.getMetadata(COLUMN_METADATA, entityClass) || [];

  const columnDefs = columns
    .map((col) => {
      let sql = `\`${col.propertyName}\` ${col.type}`;

      if (col.length) sql += `(${col.length})`;
      if (col.precision && col.scale) sql += `(${col.precision}, ${col.scale})`;
      if (col.unsigned) sql += " UNSIGNED";
      if (col.autoIncrement) sql += " AUTO_INCREMENT";
      if (!col.isNullable) sql += " NOT NULL";
      if (col.isUnique) sql += " UNIQUE";
      if (col.default !== undefined) sql += ` DEFAULT ${col.default}`;
      if (col.isPrimary) sql += " PRIMARY KEY";

      return sql;
    })
    .join(",\n  ");

  return `CREATE TABLE \`${tableName}\` (\n  ${columnDefs}\n);`;
}
```

### Validation from Metadata

```typescript
function validateEntity(entity: any): string[] {
  const errors: string[] = [];
  const columns: ColumnMetadata[] =
    Reflect.getMetadata(COLUMN_METADATA, entity.constructor) || [];

  for (const col of columns) {
    const value = entity[col.propertyName];

    // Check nullable
    if (!col.isNullable && (value === null || value === undefined)) {
      errors.push(`${col.propertyName} cannot be null`);
    }

    // Check string length
    if (col.type === "varchar" && col.length && typeof value === "string") {
      if (value.length > col.length) {
        errors.push(
          `${col.propertyName} exceeds maximum length of ${col.length}`
        );
      }
    }
  }

  return errors;
}
```

---

## Best Practices

### 1. Always Use Type Annotations

```typescript
// Good
@Column({ type: 'varchar', length: 100 })
email: string;

// Better - explicit type helps with validation
@Column({ type: 'varchar', length: 255, isUnique: true })
email: string;
```

### 2. Set Appropriate Defaults

```typescript
@Column({ type: 'boolean', default: false })
isActive: boolean;

@Column({ type: 'int', unsigned: true, default: 0 })
loginCount: number;

@Column({ type: 'timestamp', default: 'CURRENT_TIMESTAMP' })
createdAt: Date;
```

### 3. Use Unsigned Integers for IDs and Counts

```typescript
@PrimaryGeneratedColumn()  // Automatically unsigned
id: number;

@Column({ type: 'int', unsigned: true, default: 0 })
views: number;
```

### 4. Be Explicit About Nullability

```typescript
// Required field
@Column({ type: 'varchar', length: 100, isNullable: false })
username: string;

// Optional field
@Column({ type: 'varchar', length: 255, isNullable: true })
middleName: string | null;
```

### 5. Use Appropriate Decimal Precision

```typescript
// Prices - 2 decimal places
@Column({ type: 'decimal', precision: 10, scale: 2 })
price: number;

// Scientific measurements - more precision
@Column({ type: 'decimal', precision: 15, scale: 5 })
measurement: number;
```

### 6. Create Indexes for Search Columns

```typescript
@Entity("users")
@Index(["email"]) // Frequently searched
@Index(["lastName", "firstName"]) // Name searches
@Index(["createdAt"]) // Sorting by date
export class User extends BaseEntity {
  // ...
}
```

### 7. Use Proper Foreign Key Actions

```typescript
// Delete user -> delete their posts
@ForeignKey({
  column: 'userId',
  referencedTable: 'users',
  referencedColumn: 'id',
  onDelete: 'CASCADE'
})

// Delete category -> set posts to null
@ForeignKey({
  column: 'categoryId',
  referencedTable: 'categories',
  referencedColumn: 'id',
  onDelete: 'SET NULL'
})
```

### 8. Add Comments for Complex Columns

```typescript
@Column({
  type: 'varchar',
  length: 255,
  comment: 'User email address, must be unique across system'
})
email: string;

@Column({
  type: 'json',
  comment: 'Serialized user preferences and settings'
})
preferences: object;
```

---

## API Reference

### Metadata Constants

```typescript
export const COLUMN_METADATA = "column:metadata";
export const INDEX_METADATA = "index:metadata";
export const FOREIGN_KEY_METADATA = "foreignkey:metadata";
```

### Type Definitions

#### Column Types (Common)

- **String Types**: `varchar`, `char`, `text`, `mediumtext`, `longtext`
- **Numeric Types**: `int`, `bigint`, `smallint`, `tinyint`, `decimal`, `float`, `double`
- **Date/Time Types**: `date`, `time`, `datetime`, `timestamp`
- **Boolean Type**: `boolean`, `tinyint(1)`
- **Other Types**: `json`, `blob`, `enum`

#### Referential Actions

- `CASCADE` - Automatically delete/update related records
- `SET NULL` - Set foreign key to NULL when referenced record is deleted/updated
- `RESTRICT` - Prevent deletion/update if related records exist
- `NO ACTION` - Similar to RESTRICT (database-dependent behavior)

---

## Metadata Retrieval

To access metadata programmatically:

```typescript
import {
  COLUMN_METADATA,
  INDEX_METADATA,
  FOREIGN_KEY_METADATA,
} from "./column.decorator";

// Get columns
const columns = Reflect.getMetadata(COLUMN_METADATA, MyEntity);

// Get indexes
const indexes = Reflect.getMetadata(INDEX_METADATA, MyEntity);

// Get foreign keys
const foreignKeys = Reflect.getMetadata(FOREIGN_KEY_METADATA, MyEntity);
```

---

## Related Documentation

- [Entity Decorator](./ENTITY_DECORATOR.md) - Learn about the @Entity decorator
- [Database Service](./DOCSMED/05-DATABASE_ORM.md) - Database operations and ORM
- [Repository Pattern](./src/builtin/repository.ts) - Working with repositories
- [Base Entity](./src/builtin/base-entity.ts) - Base entity class

---

## Troubleshooting

### Metadata Not Found

**Problem**: Decorators don't seem to store metadata

**Solution**: Ensure `reflect-metadata` is imported at the application entry point:

```typescript
import "reflect-metadata";
```

### Circular Dependencies

**Problem**: Entities with circular foreign key references

**Solution**: Use string references for types instead of importing directly:

```typescript
@ForeignKey({
  column: 'userId',
  referencedTable: 'users',  // String reference
  referencedColumn: 'id'
})
```

### Type Mismatches

**Problem**: TypeScript types don't match column types

**Solution**: Ensure consistency between decorator and property type:

```typescript
// Correct
@Column({ type: 'int', unsigned: true })
age: number;

// Incorrect
@Column({ type: 'int' })
age: string;  // Should be number
```

---

## License

This documentation is part of the Fynix Framework.

---

**Last Updated**: December 4, 2025
