# 🚀 Entity Quick Reference

Quick reference for RestJS Entity decorators and BaseEntity methods.

## Import

```typescript
import { Entity, BaseEntity } from "@restjs/core";
```

## Basic Usage

```typescript
@Entity("users")
export class User extends BaseEntity {
  id?: number;
  name: string;
  email: string;
}
```

## Static Methods Reference

| Method                     | Parameters                     | Returns              | Description         |
| -------------------------- | ------------------------------ | -------------------- | ------------------- |
| `findAll()`                | -                              | `Promise<T[]>`       | Get all records     |
| `findById(id)`             | `id: number`                   | `Promise<T \| null>` | Find by primary key |
| `findOne(conditions)`      | `conditions: Partial<T>`       | `Promise<T \| null>` | Find first matching |
| `findMany(conditions)`     | `conditions: Partial<T>`       | `Promise<T[]>`       | Find all matching   |
| `create(data)`             | `data: Partial<T>`             | `Promise<T>`         | Create and save     |
| `update(conditions, data)` | `conditions, data: Partial<T>` | `Promise<number>`    | Update records      |
| `remove(conditions)`       | `conditions: Partial<T>`       | `Promise<number>`    | Delete records      |
| `count(conditions?)`       | `conditions?: Partial<T>`      | `Promise<number>`    | Count records       |
| `exists(conditions)`       | `conditions: Partial<T>`       | `Promise<boolean>`   | Check existence     |
| `query()`                  | -                              | `QueryBuilder<T>`    | Get query builder   |

## Instance Methods Reference

| Method     | Returns         | Description        |
| ---------- | --------------- | ------------------ |
| `save()`   | `Promise<this>` | Insert or update   |
| `delete()` | `Promise<void>` | Delete this record |
| `reload()` | `Promise<this>` | Refresh from DB    |

## Examples

### Create

```typescript
const user = new User();
user.name = "John";
user.email = "john@example.com";
await user.save();
```

### Read

```typescript
const user = await User.findById(1);
const users = await User.findAll();
const john = await User.findOne({ email: "john@example.com" });
const activeUsers = await User.findMany({ isActive: true });
```

### Update

```typescript
const user = await User.findById(1);
user.name = "Jane";
await user.save();

// OR
await User.update({ id: 1 }, { name: "Jane" });
```

### Delete

```typescript
const user = await User.findById(1);
await user.delete();

// OR
await User.remove({ id: 1 });
```

### Custom Methods

```typescript
@Entity("users")
export class User extends BaseEntity {
  // Static method
  static async findByEmail(email: string) {
    return await this.findOne({ email });
  }

  // Instance method
  isAdult(): boolean {
    return this.age >= 18;
  }
}

// Usage
const user = await User.findByEmail("john@example.com");
if (user?.isAdult()) {
  console.log("Adult user");
}
```

### Complex Queries

```typescript
const adults = await User.query()
  .where("age", ">=", 18)
  .where("isActive", "=", true)
  .orderBy("name", "ASC")
  .limit(10)
  .get();

const userCount = await User.query()
  .where("createdAt", ">", "2024-01-01")
  .count();
```

### Joins

```typescript
const postsWithAuthors = await Post.query()
  .select(["posts.*", "users.name as authorName"])
  .join("users", "posts.userId", "users.id")
  .where("posts.published", "=", true)
  .get();
```

## TypeScript Tips

### Use Interfaces

```typescript
export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
}

@Entity("users")
export class User extends BaseEntity implements UserAttributes {
  id?: number;
  name!: string; // ! = required
  email!: string;
}
```

### Type Safety with Generics

```typescript
// Method returns properly typed User[]
const users: User[] = await User.findAll();

// TypeScript knows user is User | null
const user = await User.findById(1);
if (user) {
  console.log(user.name); // ✅ TypeScript knows name exists
}
```

## Best Practices

✅ **DO:**

- Use entities for database operations
- Keep entities lightweight
- Add custom query methods as static methods
- Use services for complex business logic
- Handle null/undefined properly

❌ **DON'T:**

- Put complex business logic in entities
- Forget to check for null after findById/findOne
- Directly expose entities in API responses (use DTOs)
- Call save() without handling errors

## Common Patterns

### Repository Pattern

```typescript
@Injectable()
export class UserRepository {
  async findActiveUsers(): Promise<User[]> {
    return await User.findMany({ isActive: true });
  }

  async createUser(data: Partial<User>): Promise<User> {
    return await User.create(data);
  }
}
```

### Service Pattern

```typescript
@Injectable()
export class UserService {
  async registerUser(data: any): Promise<User> {
    // Validation
    if (!data.email) throw new Error("Email required");

    // Check duplicate
    const exists = await User.exists({ email: data.email });
    if (exists) throw new Error("Email already exists");

    // Create
    const user = new User();
    user.name = data.name;
    user.email = data.email;
    await user.save();

    return user;
  }
}
```

### Controller Pattern

```typescript
@Controller("/users")
export class UserController {
  @Get("/")
  async list() {
    const users = await User.findAll();
    return { success: true, data: users };
  }

  @Get("/:id")
  async get(@Param("id") id: string) {
    const user = await User.findById(Number(id));
    if (!user) {
      return { success: false, error: "Not found" };
    }
    return { success: true, data: user };
  }

  @Post("/")
  async create(@Body() body: any) {
    const user = await User.create(body);
    return { success: true, data: user };
  }
}
```

---

**Full Documentation:** [Entities Guide](./ENTITIES_GUIDE.md) | [Entity Examples](./ENTITY_EXAMPLES.md)
