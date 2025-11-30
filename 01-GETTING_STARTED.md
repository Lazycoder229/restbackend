# Getting Started with RestJS

This guide will help you create your first REST API with RestJS in under 10 minutes.

## Prerequisites

- Node.js (v14 or higher)
- TypeScript knowledge (basic)
- MySQL (optional, only if you need database)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Lazycoder229/restbackend.git
cd restbackend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Framework

```bash
npm run build
```

## Your First Application

### Step 1: Create a Simple Controller

Create `src/main.ts`:

```typescript
import "reflect-metadata";
import { RestFactory, Controller, Get, Module } from "./index";

@Controller("/hello")
class HelloController {
  @Get()
  sayHello() {
    return { message: "Hello, World!" };
  }

  @Get("/:name")
  greet(@Param("name") name: string) {
    return { message: `Hello, ${name}!` };
  }
}

@Module({
  controllers: [HelloController],
})
class AppModule {}

async function bootstrap() {
  const app = await RestFactory.create(AppModule);

  // Enable hot reload for development (automatically restarts on file changes)
  app.enableHotReload();

  await app.listen(3000);
  console.log("🚀 Server running on http://localhost:3000");
}

bootstrap();
```

### Step 2: Run the Application

```bash
npm run dev
```

### Step 3: Test Your API

```bash
# Test basic route
curl http://localhost:3000/hello

# Test with parameter
curl http://localhost:3000/hello/John
```

## Next: Add a Service

### Step 1: Create a Service

```typescript
// users.service.ts
import { Injectable } from "./index";

interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class UsersService {
  private users: User[] = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
  ];

  findAll(): User[] {
    return this.users;
  }

  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  create(name: string, email: string): User {
    const newUser = {
      id: this.users.length + 1,
      name,
      email,
    };
    this.users.push(newUser);
    return newUser;
  }
}
```

### Step 2: Create a Controller

```typescript
// users.controller.ts
import { Controller, Get, Post, Param, Body, NotFoundException } from "./index";
import { UsersService } from "./users.service";

@Controller("/users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Get("/:id")
  getUserById(@Param("id") id: string) {
    const user = this.usersService.findById(parseInt(id));
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  @Post()
  createUser(@Body() body: { name: string; email: string }) {
    return this.usersService.create(body.name, body.email);
  }
}
```

### Step 3: Create a Module

```typescript
// users.module.ts
import { Module } from "./index";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

### Step 4: Update App Module

```typescript
// main.ts
import "reflect-metadata";
import { RestFactory, Module } from "./index";
import { UsersModule } from "./users.module";

@Module({
  imports: [UsersModule],
})
class AppModule {}

async function bootstrap() {
  const app = await RestFactory.create(AppModule);
  await app.listen(3000);
  console.log("🚀 Server running on http://localhost:3000");
}

bootstrap();
```

### Step 5: Test the Users API

```bash
# Get all users
curl http://localhost:3000/users

# Get specific user
curl http://localhost:3000/users/1

# Create new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com"}'
```

## Add Database Support

### Step 1: Setup Database

```sql
CREATE DATABASE myapp;
USE myapp;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Initialize Database in Main

```typescript
// main.ts
import "reflect-metadata";
import { RestFactory, Module, DatabaseService } from "./index";
import { UsersModule } from "./users.module";

@Module({
  imports: [UsersModule],
  providers: [DatabaseService],
})
class AppModule {}

async function bootstrap() {
  const app = await RestFactory.create(AppModule);

  // Initialize app first
  await app.init();

  // Setup database
  const db = app.get<DatabaseService>(DatabaseService);
  db.initialize({
    host: "localhost",
    user: "root",
    password: "your_password",
    database: "myapp",
  });

  await app.listen(3000);
  console.log("🚀 Server running on http://localhost:3000");
}

bootstrap();
```

### Step 3: Create Repository

```typescript
// users.repository.ts
import { Injectable, Repository } from "./index";

interface User {
  id?: number;
  name: string;
  email: string;
  created_at?: Date;
}

@Injectable()
export class UsersRepository extends Repository<User> {
  protected tableName = "users";

  async findByEmail(email: string) {
    return await this.findOneBy("email", email);
  }
}
```

### Step 4: Update Service to Use Repository

```typescript
// users.service.ts
import { Injectable, BadRequestException } from "./index";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(private repo: UsersRepository) {}

  async findAll() {
    return await this.repo.findAll();
  }

  async findById(id: number) {
    return await this.repo.findById(id);
  }

  async create(name: string, email: string) {
    // Check if email exists
    const existing = await this.repo.findByEmail(email);
    if (existing) {
      throw new BadRequestException("Email already exists");
    }

    return await this.repo.create({ name, email });
  }
}
```

### Step 5: Update Module

```typescript
// users.module.ts
import { Module } from "./index";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}
```

## Project Structure

After following this guide, your project should look like:

```
restbackend/
├── src/
│   ├── core/              # Framework (don't touch)
│   ├── builtin/           # Built-in services (don't touch)
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── users.module.ts
│   ├── main.ts
│   └── index.ts
├── dist/
├── node_modules/
├── package.json
└── tsconfig.json
```

## Next Steps

Now that you have a basic application running:

1. **[Learn about ORM](./ORM_GUIDE.md)** - Database queries without raw SQL
2. **[Add Security](./SECURITY_GUIDE.md)** - JWT authentication and protection
3. **[Create More Modules](./CREATING_MODULES.md)** - Build complex applications
4. **[API Reference](./API_REFERENCE.md)** - Complete decorator reference

## Common Issues

### TypeScript Errors

Make sure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Database Connection Failed

- Check MySQL is running
- Verify credentials in `db.initialize()`
- Ensure database exists

### Port Already in Use

Change the port in `app.listen(3000)` to another number like `3001`.

## 🔥 Hot Reload (Development Mode)

RestJS includes built-in hot reload - automatically restart your server when files change!

### Basic Usage

```typescript
async function bootstrap() {
  const app = await RestFactory.create(AppModule);

  // Enable hot reload (zero configuration)
  app.enableHotReload();

  await app.listen(3000);
}

bootstrap();
```

### Advanced Configuration

```typescript
app.enableHotReload({
  watchPaths: ["src", "config"], // Directories to watch
  debounceMs: 500, // Wait 500ms for multiple changes
  ignore: ["*.log", "*.tmp"], // Patterns to ignore
  onReload: () => {
    // Custom hook before reload
    console.log("Cleaning up...");
  },
});
```

### What Gets Watched

- ✅ TypeScript files (`.ts`)
- ✅ JavaScript files (`.js`)
- ✅ JSON files (`.json`)
- ❌ `node_modules/` (automatically ignored)
- ❌ `dist/` (automatically ignored)
- ❌ `.git/` (automatically ignored)

### Hot Reload in Action

```bash
# 1. Start your app
npm run dev

# Output:
# Application is running on: http://localhost:3000
# 🔥 Hot reload enabled - watching for changes...

# 2. Edit any file in src/
# Automatically see:
# 🔄 File changed: app.controller.ts
# ♻️  Reloading application...
# Application is running on: http://localhost:3000
```

### When to Use

- ✅ **Development**: Always enable for faster iteration
- ❌ **Production**: Never enable (use PM2 or process managers instead)

## Summary

You've learned:

- ✅ How to create controllers with decorators
- ✅ How to use dependency injection with services
- ✅ How to organize code with modules
- ✅ How to connect to a database
- ✅ How to use the built-in ORM
- ✅ How to enable hot reload for development

Ready to build amazing APIs! 🚀
