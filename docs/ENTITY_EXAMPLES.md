# Entity/Model Examples

Complete working examples using the new `@Entity` decorator and `BaseEntity` class.

## Example 1: Basic User Entity

### user.entity.ts

```typescript
import { Entity, BaseEntity } from "../src";

@Entity("users")
export class User extends BaseEntity {
  id?: number;
  name: string;
  email: string;
  password: string;
  age?: number;
  isActive?: boolean;

  // Custom static method
  static async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ email });
  }

  // Custom instance method
  isAdult(): boolean {
    return this.age ? this.age >= 18 : false;
  }

  // Remove password from JSON output
  toJSON(): Omit<User, "password"> {
    const { password, ...safe } = this;
    return safe;
  }
}
```

### user.controller.ts

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from "../src";
import { User } from "./user.entity";

@Controller("/users")
export class UserController {
  @Get("/")
  async getAllUsers() {
    const users = await User.findAll();
    return {
      success: true,
      data: users.map((u) => u.toJSON()),
    };
  }

  @Get("/:id")
  async getUser(@Param("id") id: string) {
    const user = await User.findById(Number(id));

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      data: user.toJSON(),
    };
  }

  @Post("/")
  async createUser(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      age?: number;
    }
  ) {
    // Check if email exists
    const exists = await User.exists({ email: body.email });
    if (exists) {
      return {
        success: false,
        error: "Email already exists",
      };
    }

    // Create new user
    const user = new User();
    user.name = body.name;
    user.email = body.email;
    user.password = body.password;
    user.age = body.age;
    user.isActive = true;
    await user.save();

    return {
      success: true,
      data: user.toJSON(),
      message: "User created successfully",
    };
  }

  @Put("/:id")
  async updateUser(@Param("id") id: string, @Body() body: Partial<User>) {
    const user = await User.findById(Number(id));

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Update fields
    Object.assign(user, body);
    await user.save();

    return {
      success: true,
      data: user.toJSON(),
      message: "User updated successfully",
    };
  }

  @Delete("/:id")
  async deleteUser(@Param("id") id: string) {
    const user = await User.findById(Number(id));

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    await user.delete();

    return {
      success: true,
      message: "User deleted successfully",
    };
  }

  @Get("/search/:email")
  async findByEmail(@Param("email") email: string) {
    const user = await User.findByEmail(email);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      data: user.toJSON(),
    };
  }
}
```

## Example 2: Post Entity with Relations

### post.entity.ts

```typescript
import { Entity, BaseEntity } from "../src";
import { User } from "./user.entity";

@Entity("posts")
export class Post extends BaseEntity {
  id?: number;
  title: string;
  content: string;
  userId: number;
  published?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // Find posts by user
  static async findByUserId(userId: number): Promise<Post[]> {
    return await this.findMany({ userId });
  }

  // Find published posts
  static async findPublished(): Promise<Post[]> {
    return await this.findMany({ published: true });
  }

  // Get post with author (JOIN query)
  static async findWithAuthor(postId: number): Promise<any> {
    return await this.query()
      .select([
        "posts.*",
        "users.name as authorName",
        "users.email as authorEmail",
      ])
      .join("users", "posts.userId", "users.id")
      .where("posts.id", "=", postId)
      .first();
  }

  // Instance method: Get author
  async getAuthor(): Promise<User | null> {
    return await User.findById(this.userId);
  }

  // Instance method: Publish post
  async publish(): Promise<void> {
    this.published = true;
    await this.save();
  }

  // Instance method: Unpublish post
  async unpublish(): Promise<void> {
    this.published = false;
    await this.save();
  }
}
```

### post.controller.ts

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "../src";
import { Post as PostEntity } from "./post.entity";

@Controller("/posts")
export class PostController {
  @Get("/")
  async getAllPosts(@Query("published") published?: string) {
    const posts =
      published === "true"
        ? await PostEntity.findPublished()
        : await PostEntity.findAll();

    return {
      success: true,
      data: posts,
    };
  }

  @Get("/:id")
  async getPost(
    @Param("id") id: string,
    @Query("withAuthor") withAuthor?: string
  ) {
    const post =
      withAuthor === "true"
        ? await PostEntity.findWithAuthor(Number(id))
        : await PostEntity.findById(Number(id));

    if (!post) {
      return {
        success: false,
        error: "Post not found",
      };
    }

    return {
      success: true,
      data: post,
    };
  }

  @Get("/user/:userId")
  async getPostsByUser(@Param("userId") userId: string) {
    const posts = await PostEntity.findByUserId(Number(userId));

    return {
      success: true,
      data: posts,
    };
  }

  @Post("/")
  async createPost(
    @Body() body: { title: string; content: string; userId: number }
  ) {
    const post = new PostEntity();
    post.title = body.title;
    post.content = body.content;
    post.userId = body.userId;
    post.published = false;
    await post.save();

    return {
      success: true,
      data: post,
      message: "Post created successfully",
    };
  }

  @Put("/:id")
  async updatePost(@Param("id") id: string, @Body() body: Partial<PostEntity>) {
    const post = await PostEntity.findById(Number(id));

    if (!post) {
      return {
        success: false,
        error: "Post not found",
      };
    }

    Object.assign(post, body);
    await post.save();

    return {
      success: true,
      data: post,
      message: "Post updated successfully",
    };
  }

  @Put("/:id/publish")
  async publishPost(@Param("id") id: string) {
    const post = await PostEntity.findById(Number(id));

    if (!post) {
      return {
        success: false,
        error: "Post not found",
      };
    }

    await post.publish();

    return {
      success: true,
      data: post,
      message: "Post published successfully",
    };
  }

  @Delete("/:id")
  async deletePost(@Param("id") id: string) {
    const post = await PostEntity.findById(Number(id));

    if (!post) {
      return {
        success: false,
        error: "Post not found",
      };
    }

    await post.delete();

    return {
      success: true,
      message: "Post deleted successfully",
    };
  }
}
```

## Example 3: Complete Application Setup

### app.module.ts

```typescript
import { Module } from "../src";
import { UserController } from "./user.controller";
import { PostController } from "./post.controller";
import { DatabaseService } from "../src";

@Module({
  controllers: [UserController, PostController],
  providers: [DatabaseService],
})
export class AppModule {}
```

### main.ts

```typescript
import { RestFactory } from "../src";
import { AppModule } from "./app.module";
import { DatabaseService } from "../src";

async function bootstrap() {
  // Create application
  const app = await RestFactory.create(AppModule);

  // Initialize database
  const db = app.get<DatabaseService>(DatabaseService);
  db.initialize({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "myapp",
    connectionLimit: 10,
  });

  // Initialize app (this will set up BaseEntity with database)
  await app.init();

  // Start server
  await app.listen(3000);

  console.log("🚀 Server is running on http://localhost:3000");
  console.log("\nAvailable endpoints:");
  console.log("  GET    /users");
  console.log("  GET    /users/:id");
  console.log("  POST   /users");
  console.log("  PUT    /users/:id");
  console.log("  DELETE /users/:id");
  console.log("  GET    /posts");
  console.log("  GET    /posts/:id");
  console.log("  POST   /posts");
  console.log("  PUT    /posts/:id");
  console.log("  PUT    /posts/:id/publish");
  console.log("  DELETE /posts/:id");
}

bootstrap();
```

## Database Schema

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  age INT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  userId INT NOT NULL,
  published BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

## Usage Examples

### Create User

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secret123",
    "age": 25
  }'
```

### Get All Users

```bash
curl http://localhost:3000/users
```

### Create Post

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is my first post content",
    "userId": 1
  }'
```

### Get Post with Author

```bash
curl http://localhost:3000/posts/1?withAuthor=true
```

### Publish Post

```bash
curl -X PUT http://localhost:3000/posts/1/publish
```

## Key Features Demonstrated

1. ✅ **Entity Decorator** - `@Entity('tableName')`
2. ✅ **Active Record Pattern** - `extends BaseEntity`
3. ✅ **Static Methods** - `findAll()`, `findById()`, `findOne()`, etc.
4. ✅ **Instance Methods** - `save()`, `delete()`, `reload()`
5. ✅ **Custom Methods** - `findByEmail()`, `isAdult()`, etc.
6. ✅ **Relations** - Manual JOIN queries and helper methods
7. ✅ **Type Safety** - Full TypeScript support
8. ✅ **No ORM Required** - Built-in functionality

---

**That's it!** You now have a full MVC architecture with entities, just like NestJS + TypeORM! 🎉
