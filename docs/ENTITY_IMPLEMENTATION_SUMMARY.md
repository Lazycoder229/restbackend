# 🎉 Entity/Model System - Implementation Summary

## Overview

RestJS now supports **Entity decorators** and **Active Record pattern** just like NestJS + TypeORM! This provides a familiar, powerful way to work with database models.

---

## ✅ What Was Added

### 1. **Entity Decorator** (`@Entity`)

- **File:** `src/decorators/entity.decorator.ts`
- **Purpose:** Mark classes as database entities/models
- **Usage:**
  ```typescript
  @Entity("users", { primaryKey: "id" })
  export class User extends BaseEntity {
    id?: number;
    name: string;
    email: string;
  }
  ```

### 2. **BaseEntity Class**

- **File:** `src/builtin/base-entity.ts`
- **Purpose:** Provides Active Record pattern functionality
- **Features:**
  - ✅ Static query methods (`findAll`, `findById`, `findOne`, `findMany`, etc.)
  - ✅ Instance methods (`save`, `delete`, `reload`)
  - ✅ Custom query builder access
  - ✅ Type-safe operations
  - ✅ Automatic database connection handling

### 3. **Core Integration**

- **Updated:** `src/core/module-container.ts`
  - Added `initializeDatabase()` method
  - Automatically connects BaseEntity to DatabaseService
- **Updated:** `src/core/rest-application.ts`
  - Calls `initializeDatabase()` during app initialization
- **Updated:** `src/core/metadata.ts`
  - Added `ENTITY_METADATA` constant

### 4. **Exports**

- **Updated:** `src/index.ts` - Added `Entity` and `BaseEntity` exports
- **Updated:** `src/builtin/index.ts` - Added `BaseEntity` export

### 5. **Documentation**

- **Created:** `docs/ENTITIES_GUIDE.md` - Complete entity system guide
- **Created:** `docs/ENTITY_EXAMPLES.md` - Full working examples
- **Created:** `docs/ENTITY_QUICK_REFERENCE.md` - Quick reference card
- **Updated:** `README.md` - Added entity feature and documentation links

---

## 🚀 Key Features

### Static Methods (Class-level)

| Method                     | Description                          |
| -------------------------- | ------------------------------------ |
| `findAll()`                | Get all records                      |
| `findById(id)`             | Find by primary key                  |
| `findOne(conditions)`      | Find first matching record           |
| `findMany(conditions)`     | Find all matching records            |
| `create(data)`             | Create and save new record           |
| `update(conditions, data)` | Update matching records              |
| `remove(conditions)`       | Delete matching records              |
| `count(conditions?)`       | Count records                        |
| `exists(conditions)`       | Check if exists                      |
| `query()`                  | Get QueryBuilder for complex queries |

### Instance Methods

| Method     | Description                  |
| ---------- | ---------------------------- |
| `save()`   | Insert or update this entity |
| `delete()` | Delete this entity           |
| `reload()` | Refresh from database        |

---

## 📖 Usage Example

### Define Entity

```typescript
import { Entity, BaseEntity } from "@restjs/core";

@Entity("users")
export class User extends BaseEntity {
  id?: number;
  name: string;
  email: string;
  password: string;
  age?: number;

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

### Use in Controller

```typescript
import { Controller, Get, Post, Body, Param } from "@restjs/core";
import { User } from "./entities/user.entity";

@Controller("/users")
export class UserController {
  @Get("/")
  async getAllUsers() {
    const users = await User.findAll();
    return { success: true, data: users };
  }

  @Get("/:id")
  async getUser(@Param("id") id: string) {
    const user = await User.findById(Number(id));
    if (!user) {
      return { success: false, error: "User not found" };
    }
    return { success: true, data: user };
  }

  @Post("/")
  async createUser(@Body() body: any) {
    // Check if exists
    const exists = await User.exists({ email: body.email });
    if (exists) {
      return { success: false, error: "Email already exists" };
    }

    // Create new user
    const user = new User();
    user.name = body.name;
    user.email = body.email;
    user.password = body.password;
    await user.save();

    return { success: true, data: user };
  }
}
```

---

## 🔧 Technical Details

### How It Works

1. **Entity Decorator** stores metadata about the table name and primary key
2. **BaseEntity** provides static and instance methods for database operations
3. **ModuleContainer** initializes BaseEntity with DatabaseService connection during app startup
4. **All entities** share the same database connection automatically

### Type Safety

```typescript
// TypeScript knows the return types!
const users: User[] = await User.findAll();
const user: User | null = await User.findById(1);
const count: number = await User.count();
const exists: boolean = await User.exists({ email: "test@test.com" });
```

### Custom Queries

```typescript
// Use query builder for complex operations
const adults = await User.query()
  .where("age", ">=", 18)
  .where("isActive", "=", true)
  .orderBy("name", "ASC")
  .limit(10)
  .get();

// JOINs are supported
@Entity("posts")
export class Post extends BaseEntity {
  static async findWithAuthor(postId: number) {
    return await this.query()
      .select(["posts.*", "users.name as authorName"])
      .join("users", "posts.userId", "users.id")
      .where("posts.id", "=", postId)
      .first();
  }
}
```

---

## 🎯 Benefits

### For Developers

- ✅ **Familiar API** - Same as NestJS + TypeORM
- ✅ **Less Boilerplate** - No need for separate repository classes
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Flexible** - Can still use Repository pattern if needed
- ✅ **Zero Config** - Works automatically after app initialization

### For Framework

- ✅ **No Breaking Changes** - Repository class still works
- ✅ **Optional** - Can use either Entity or Repository pattern
- ✅ **Lightweight** - No external ORM dependencies
- ✅ **Performance** - Built on existing QueryBuilder

---

## 📚 Documentation Links

- **[Entities Guide](../docs/ENTITIES_GUIDE.md)** - Complete guide with all features
- **[Entity Examples](../docs/ENTITY_EXAMPLES.md)** - Full working examples
- **[Quick Reference](../docs/ENTITY_QUICK_REFERENCE.md)** - Quick lookup table

---

## 🔄 Migration Path

### Old Way (Repository Pattern)

```typescript
@Injectable()
export class UsersRepository extends Repository<User> {
  protected tableName = 'users';
}

// In controller
constructor(private repo: UsersRepository) {}
const users = await this.repo.findAll();
```

### New Way (Entity Pattern)

```typescript
@Entity("users")
export class User extends BaseEntity {
  id?: number;
  name: string;
}

// In controller (no injection needed!)
const users = await User.findAll();
```

**Both patterns are supported!** Choose what works best for your project.

---

## ✨ What's Next?

Potential future enhancements:

- [ ] Relation decorators (`@OneToMany`, `@ManyToOne`, etc.)
- [ ] Column decorators for validation
- [ ] Auto-migrations support
- [ ] Virtual properties
- [ ] Lifecycle hooks (beforeSave, afterSave, etc.)
- [ ] Soft deletes
- [ ] Timestamps automation

---

## 🎉 Summary

RestJS now has a **full-featured Entity/Model system** that:

- Works just like NestJS + TypeORM
- Requires zero configuration
- Provides type-safe operations
- Supports both simple and complex queries
- Is fully documented with examples

**Try it out and enjoy building with entities!** 🚀
