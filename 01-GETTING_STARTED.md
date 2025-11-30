# 🚀 Getting Started with RestJS

**Welcome!** This guide will take you from zero to a working REST API in under 10 minutes. Perfect for beginners and experienced developers alike.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (CLI)](#quick-start-cli)
- [Manual Installation](#manual-installation)
- [Your First Application](#your-first-application)
- [Understanding the Code](#understanding-the-code)
- [Adding Services](#adding-services)
- [Database Integration](#database-integration)
- [Hot Reload](#hot-reload)
- [Next Steps](#next-steps)

---

## ✅ Prerequisites

<details>
<summary><strong>Click to see system requirements</strong></summary>

### Required

- **Node.js** v14 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **TypeScript** basic knowledge ([Learn basics in 5 mins](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html))

### Optional (for database features)

- **MySQL** 5.7+ or 8.0+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **MySQL Workbench** (GUI tool for database management)

### Check your setup

```bash
node --version    # Should be v14+
npm --version     # Should be 6+
tsc --version     # Should be 4.0+
```

</details>

---

## ⚡ Quick Start (CLI)

**Fastest way to create a new project:**

<details open>
<summary><strong>Using npx (recommended)</strong></summary>

```bash
# Create a new project
npx @restsjsapp/create my-app

# Choose a template:
# 1. basic   - Simple hello world
# 2. api     - CRUD API with users module
# 3. full    - Complete app with database & auth

# Navigate and start
cd my-app
npm install
npm start
```

**Your app is now running at `http://localhost:3000`** 🎉

</details>

<details>
<summary><strong>Using npm init</strong></summary>

```bash
npm init @restsjsapp my-app
cd my-app
npm install
npm start
```

</details>

---

## 🔧 Manual Installation

**Want to start from scratch? Follow these steps:**

<details>
<summary><strong>Step-by-step installation</strong></summary>

### 1. Clone the Repository

```bash
git clone https://github.com/Lazycoder229/restbackend.git
cd restbackend
```

### 2. Install Dependencies

```bash
npm install
```

**What gets installed:**

- `typescript` - TypeScript compiler
- `reflect-metadata` - Decorator metadata support
- `@types/node` - Node.js type definitions
- Built-in features (no external dependencies!)

### 3. Build the Framework

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### 4. Verify Installation

```bash
# Check if build was successful
ls dist/

# You should see:
# - index.js, index.d.ts
# - core/, decorators/, builtin/, common/
```

</details>

---

## 🎯 Your First Application

### Step 1: Create a Controller

<details open>
<summary><strong>What is a Controller?</strong></summary>

A **Controller** handles HTTP requests. Think of it as a set of routes grouped together.

**Example:** A `UserController` handles all `/users` routes like:

- `GET /users` - Get all users
- `GET /users/:id` - Get one user
- `POST /users` - Create user

</details>

**Create your first controller file:**

```typescript
// src/main.ts
import "reflect-metadata"; // Required for decorators to work
import { RestFactory, Controller, Get, Module, Param } from "./index";

// Step 1: Define a Controller
@Controller("/hello") // All routes in this controller start with /hello
class HelloController {
  // GET /hello
  @Get()
  sayHello() {
    return { message: "Hello, World!" };
  }

  // GET /hello/:name (dynamic route parameter)
  @Get("/:name")
  greet(@Param("name") name: string) {
    return { message: `Hello, ${name}!` };
  }
}

// Step 2: Create a Module (organizes your app)
@Module({
  controllers: [HelloController], // Register controllers here
})
class AppModule {}

// Step 3: Bootstrap the application
async function bootstrap() {
  const app = await RestFactory.create(AppModule);

  // Enable hot reload for development
  app.enableHotReload();

  await app.listen(3000);
  console.log("🚀 Server running on http://localhost:3000");
}

bootstrap();
```

<details>
<summary><strong>💡 Understanding the code</strong></summary>

**Line-by-line breakdown:**

1. **`import "reflect-metadata"`** - Enables decorator metadata (required once in your app)
2. **`@Controller("/hello")`** - Class decorator that marks this as a controller with base path
3. **`@Get()`** - Method decorator for GET requests
4. **`@Param("name")`** - Extracts route parameter from URL
5. **`@Module({})`** - Organizes controllers and services
6. **`RestFactory.create()`** - Creates and initializes your app
7. **`app.enableHotReload()`** - Auto-restart on file changes (dev only)
8. **`app.listen(3000)`** - Start HTTP server on port 3000

</details>

---

### Step 2: Run the Application

```bash
npm run dev
```

**Expected output:**

```
Application is running on: http://localhost:3000
🔥 Hot reload enabled - watching for changes...
```

---

### Step 3: Test Your API

<details open>
<summary><strong>Using cURL (command line)</strong></summary>

```bash
# Test basic route
curl http://localhost:3000/hello
# Response: {"message":"Hello, World!"}

# Test with parameter
curl http://localhost:3000/hello/John
# Response: {"message":"Hello, John!"}
```

</details>

<details>
<summary><strong>Using browser</strong></summary>

Open these URLs in your browser:

- http://localhost:3000/hello
- http://localhost:3000/hello/YourName

</details>

<details>
<summary><strong>Using Postman or Thunder Client</strong></summary>

1. Open Postman/Thunder Client
2. Create new GET request
3. Enter URL: `http://localhost:3000/hello`
4. Click Send

</details>

---

## 🔧 Adding Business Logic (Services)

### What is a Service?

<details>
<summary><strong>Click to learn about services</strong></summary>

**Services** contain your business logic, separate from HTTP handling:

- ✅ **Reusable** - Share logic across multiple controllers
- ✅ **Testable** - Easy to unit test without HTTP
- ✅ **Injectable** - Automatically provided by DI container
- ✅ **Single Responsibility** - Controllers handle HTTP, services handle logic

</details>

---

### Step 1: Create a Service

```typescript
// src/users.service.ts
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

---

### Step 2: Create a Controller

<details>
<summary><strong>💡 Notice the Dependency Injection</strong></summary>

The `constructor(private usersService: UsersService)` automatically injects the service!

**How it works:**

1. Framework sees `@Injectable()` on `UsersService`
2. Creates instance of `UsersService`
3. Injects it into controller constructor
4. You can use `this.usersService` everywhere

**No manual instantiation needed!** ✨

</details>

```typescript
// src/users.controller.ts
import { Controller, Get, Post, Param, Body } from "./index";
import { UsersService } from "./users.service";

@Controller("/users") // Base path: /users
export class UsersController {
  // Dependency Injection: Service auto-injected by framework
  constructor(private usersService: UsersService) {}

  // GET /users - Get all users
  @Get()
  getAllUsers() {
    return this.usersService.findAll();
  }

  // GET /users/:id - Get one user by ID
  @Get("/:id")
  getUserById(@Param("id") id: string) {
    const user = this.usersService.findById(parseInt(id));
    if (!user) {
      return { error: "User not found", statusCode: 404 };
    }
    return user;
  }

  // POST /users - Create new user
  @Post()
  createUser(@Body() body: { name: string; email: string }) {
    return this.usersService.create(body.name, body.email);
  }
}
```

<details>
<summary><strong>🔍 Understanding decorators</strong></summary>

| Decorator           | Purpose                 | Example                 |
| ------------------- | ----------------------- | ----------------------- |
| `@Controller(path)` | Define base route       | `@Controller("/users")` |
| `@Get(path)`        | Handle GET requests     | `@Get("/:id")`          |
| `@Post(path)`       | Handle POST requests    | `@Post()`               |
| `@Param(name)`      | Extract URL parameter   | `@Param("id")`          |
| `@Body()`           | Extract request body    | `@Body()`               |
| `@Query(name)`      | Extract query parameter | `@Query("search")`      |

</details>

---

### Step 3: Create a Module

<details>
<summary><strong>What is a Module?</strong></summary>

Modules organize your application into logical sections:

```
AppModule (root)
  ├── UsersModule
  │   ├── UsersController
  │   └── UsersService
  │
  └── ProductsModule
      ├── ProductsController
      └── ProductsService
```

**Benefits:**

- ✅ Better code organization
- ✅ Clear separation of concerns
- ✅ Easier testing
- ✅ Reusable modules

</details>

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

---

## 💾 Database Integration

<details>
<summary><strong>Prerequisites</strong></summary>

- MySQL 5.7+ or 8.0+ installed and running
- MySQL credentials (username/password)
- Database created

**Quick MySQL setup:**

```bash
# Windows (via installer)
# Download from: https://dev.mysql.com/downloads/mysql/

# Mac (via Homebrew)
brew install mysql
brew services start mysql

# Linux (Ubuntu/Debian)
sudo apt-get install mysql-server
sudo systemctl start mysql
```

</details>

---

### Step 1: Setup Database Schema

<details open>
<summary><strong>Create database and table</strong></summary>

**Run this SQL in MySQL Workbench or command line:**

```sql
-- Create database
CREATE DATABASE myapp;
USE myapp;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email, password) VALUES
  ('John Doe', 'john@example.com', 'hashed_password_here'),
  ('Jane Smith', 'jane@example.com', 'hashed_password_here');

-- Verify
SELECT * FROM users;
```

</details>

---

### Step 2: Initialize Database Connection

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
