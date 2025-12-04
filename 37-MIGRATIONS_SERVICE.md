# Migrations Service Documentation

## Overview

The MigrationRunner provides database migration management for creating, running, and rolling back database schema changes in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Creating Migrations](#creating-migrations)
- [Running Migrations](#running-migrations)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { MigrationRunner, Migration } from "./builtin/migrations.service";
```

---

## Creating Migrations

### Migration Interface

```typescript
export class CreateUsersTable implements Migration {
  name = "2024_01_01_create_users_table";
  timestamp = Date.now();

  async up(connection: Pool): Promise<void> {
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async down(connection: Pool): Promise<void> {
    await connection.query(`DROP TABLE IF EXISTS users`);
  }
}
```

---

## Running Migrations

```typescript
const runner = new MigrationRunner(pool);

// Initialize migrations table
await runner.initialize();

// Run pending migrations
await runner.up([new CreateUsersTable(), new CreatePostsTable()]);

// Rollback last batch
await runner.down();
```

---

## API Reference

### `initialize(): Promise<void>`

Create migrations table.

### `up(migrations: Migration[]): Promise<void>`

Run pending migrations.

### `down(count?: number): Promise<void>`

Rollback migrations.

### `getExecuted(): Promise<MigrationRecord[]>`

Get executed migrations.

---

## Examples

### Complete Migration

```typescript
export class CreateUsersTable implements Migration {
  name = "2024_01_01_000001_create_users_table";
  timestamp = Date.now();

  async up(connection: Pool): Promise<void> {
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE INDEX idx_users_email ON users(email)
    `);
  }

  async down(connection: Pool): Promise<void> {
    await connection.query(`DROP TABLE IF EXISTS users`);
  }
}
```

---

## Related Documentation

- [Database Service](./DATABASE_SERVICE.md)
- [Seeders Service](./SEEDERS_SERVICE.md)
- [Schema Sync Service](./SCHEMA_SYNC_SERVICE.md)

---

**Last Updated**: December 4, 2025
