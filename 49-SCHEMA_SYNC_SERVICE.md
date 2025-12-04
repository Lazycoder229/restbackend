# Schema Sync Service Documentation

## Overview

The SchemaSyncService automatically synchronizes database schema with entity definitions, handling table creation, column modifications, and migrations in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { SchemaSyncService } from "./builtin/schema-sync.service";
```

---

## Configuration

```typescript
const schemaSync = new SchemaSyncService(databaseService, {
  autoSync: true,
  dropTables: false, // Be careful!
  alterTables: true,
  createIndexes: true,
});
```

---

## API Reference

### `sync(entities): Promise<void>`

Synchronize schema with entity definitions.

### `drop(entities): Promise<void>`

Drop all tables.

### `compareSchemaDiff(entity): Promise<SchemaDiff>`

Compare entity with actual database schema.

---

## Examples

### Auto-Sync on Startup

```typescript
@Module({
  imports: [],
  providers: [SchemaSyncService],
})
export class AppModule implements OnModuleInit {
  constructor(private schemaSync: SchemaSyncService) {}

  async onModuleInit() {
    await this.schemaSync.sync([User, Post, Comment]);
  }
}
```

### Check Schema Differences

```typescript
const diff = await schemaSync.compareSchemaDiff(User);

if (diff.hasChanges) {
  console.log("Missing columns:", diff.missingColumns);
  console.log("Extra columns:", diff.extraColumns);
  console.log("Modified columns:", diff.modifiedColumns);
}
```

---

## Related Documentation

- [Entity Decorator](./ENTITY_DECORATOR.md)
- [Database Service](./DATABASE_SERVICE.md)
- [Migrations Service](./MIGRATIONS_SERVICE.md)

---

**Last Updated**: December 4, 2025
