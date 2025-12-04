# Seeders Service Documentation

## Overview

The SeederRunner provides database seeding functionality for populating your database with test or initial data in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Creating Seeders](#creating-seeders)
- [Running Seeders](#running-seeders)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { SeederRunner, Seeder } from "./builtin/seeders.service";
```

---

## Creating Seeders

### Seeder Interface

```typescript
export class UserSeeder implements Seeder {
  name = "UserSeeder";

  async run(connection: Pool): Promise<void> {
    await connection.query(`
      INSERT INTO users (name, email, password) VALUES
      ('John Doe', 'john@example.com', 'hashed_password'),
      ('Jane Smith', 'jane@example.com', 'hashed_password')
    `);
  }
}
```

---

## Running Seeders

```typescript
const runner = new SeederRunner(pool);

// Run all seeders
await runner.run([new UserSeeder(), new PostSeeder()]);

// Run with force (re-run even if already executed)
await runner.run([new UserSeeder()], true);

// Run specific seeder
await runner.runOne(new UserSeeder());
```

---

## API Reference

### `run(seeders: Seeder[], force?: boolean): Promise<void>`

Run all seeders.

### `runOne(seeder: Seeder, force?: boolean): Promise<void>`

Run specific seeder.

### `reset(): Promise<void>`

Reset seeders table.

---

## Examples

### Complete Seeder

```typescript
export class UserSeeder implements Seeder {
  name = "UserSeeder";

  async run(connection: Pool): Promise<void> {
    const users = [
      {
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        password: await bcrypt.hash("password", 10),
      },
      {
        name: "Test User",
        email: "user@example.com",
        role: "user",
        password: await bcrypt.hash("password", 10),
      },
    ];

    for (const user of users) {
      await connection.query(
        `
        INSERT INTO users (name, email, role, password)
        VALUES (?, ?, ?, ?)
      `,
        [user.name, user.email, user.role, user.password]
      );
    }
  }
}
```

---

## Related Documentation

- [Database Service](./DATABASE_SERVICE.md)
- [Migrations Service](./MIGRATIONS_SERVICE.md)

---

**Last Updated**: December 4, 2025
