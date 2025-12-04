# 00 - Getting Started

## 🚀 Quick Start Guide

Welcome to FynixJS! This guide will get you up and running in less than 5 minutes.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js**: Version 16.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn**: Comes with Node.js
- **TypeScript knowledge**: Basic understanding recommended
- **Database**: MySQL 5.7+ (for database features)

Check your versions:

```bash
node --version   # Should be v16.0.0 or higher
npm --version    # Should be 8.0.0 or higher
```

---

## ⚡ 30-Second Quick Start

```bash
# Install FynixJS
npm install @fynixjs/fynix

# Create your first file: main.ts
```

```typescript
import { FynixFactory, Module, Controller, Get } from "@fynixjs/fynix";

@Controller("/api")
class AppController {
  @Get("/hello")
  sayHello() {
    return { message: "Hello, FynixJS!" };
  }
}

@Module({
  controllers: [AppController],
})
class AppModule {}

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();
  await app.listen(3000);
  console.log("🚀 Server running on http://localhost:3000");
}

bootstrap();
```

```bash
# Run your app
npx ts-node main.ts
```

Visit http://localhost:3000/api/hello - You should see `{"message": "Hello, FynixJS!"}` 🎉

---

## 📦 Installation

### Option 1: New Project (Recommended)

```bash
# Create project directory
mkdir my-fynix-app
cd my-fynix-app

# Initialize package.json
npm init -y

# Install FynixJS
npm install @fynixjs/fynix

# Install TypeScript dependencies
npm install -D typescript ts-node @types/node

# Create tsconfig.json
npx tsc --init
```

### Option 2: Add to Existing Project

```bash
npm install @fynixjs/fynix
```

### TypeScript Configuration

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 🏗️ Your First Complete Project

### Step 1: Project Structure

```
my-fynix-app/
├── src/
│   ├── main.ts           # Application entry point
│   ├── app.module.ts     # Root module
│   └── app.controller.ts # First controller
├── package.json
└── tsconfig.json
```

### Step 2: Create the Controller

**`src/app.controller.ts`**

```typescript
import { Controller, Get, Post, Body, Param } from "@fynixjs/fynix";

@Controller("/api")
export class AppController {
  @Get("/")
  getRoot() {
    return {
      message: "Welcome to FynixJS API",
      version: "1.0.0",
    };
  }

  @Get("/users")
  getUsers() {
    return [
      { id: 1, name: "Alice", email: "alice@example.com" },
      { id: 2, name: "Bob", email: "bob@example.com" },
    ];
  }

  @Get("/users/:id")
  getUserById(@Param("id") id: string) {
    return {
      id: parseInt(id),
      name: "Alice",
      email: "alice@example.com",
    };
  }

  @Post("/users")
  createUser(@Body() body: any) {
    return {
      message: "User created",
      user: body,
    };
  }
}
```

### Step 3: Create the Module

**`src/app.module.ts`**

```typescript
import { Module } from "@fynixjs/fynix";
import { AppController } from "./app.controller";

@Module({
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
```

### Step 4: Create the Bootstrap File

**`src/main.ts`**

```typescript
import { FynixFactory } from "@fynixjs/fynix";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
    🚀 FynixJS server is running!
    📡 Listening on: http://localhost:${port}
    🔗 API Endpoint: http://localhost:${port}/api
  `);
}

bootstrap().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
```

### Step 5: Update package.json

```json
{
  "name": "my-fynix-app",
  "version": "1.0.0",
  "scripts": {
    "start": "ts-node src/main.ts",
    "dev": "ts-node-dev --respawn src/main.ts",
    "build": "tsc",
    "prod": "node dist/main.js"
  },
  "dependencies": {
    "@fynixjs/fynix": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Step 6: Run Your Application

```bash
# Development mode (auto-reload)
npm install -D ts-node-dev
npm run dev

# Or simple start
npm start
```

### Step 7: Test Your API

```bash
# Test GET endpoint
curl http://localhost:3000/api/users

# Test GET with parameter
curl http://localhost:3000/api/users/1

# Test POST endpoint
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com"}'
```

---

## 🎓 Next Steps

### For Beginners

1. **[Framework Overview](./01-FRAMEWORK_OVERVIEW.md)** - Understand the architecture
2. **[Controllers & Routing](./04-CONTROLLERS_ROUTING.md)** - Learn about routing
3. **[Dependency Injection](./02-DEPENDENCY_INJECTION.md)** - Master DI basics
4. **[Database & ORM](./05-DATABASE_ORM.md)** - Connect to a database

### For Experienced Developers

1. **[Quick Reference](./15-QUICK_REFERENCE.md)** - API cheat sheet
2. **[Migration Guide](./17-MIGRATION_GUIDE.md)** - Coming from Express/NestJS?
3. **[Advanced Features](./10-ADVANCED_FEATURES.md)** - WebSockets, GraphQL, etc.
4. **[Best Practices](./13-BEST_PRACTICES.md)** - Production-ready patterns

---

## 🔥 Hot Reload Development

FynixJS has built-in hot reload support:

```bash
# Install ts-node-dev
npm install -D ts-node-dev

# Add to package.json scripts
"dev": "ts-node-dev --respawn --transpile-only src/main.ts"

# Run with hot reload
npm run dev
```

Now your server auto-restarts when you save files! 🔄

---

## 🗄️ Adding Database (Optional)

### Quick MySQL Setup

```bash
# Install MySQL client (if using database features)
npm install mysql2
```

**Update `src/main.ts`:**

```typescript
import { FynixFactory, DatabaseService } from "@fynixjs/fynix";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();

  // Connect to database
  const db = app.get(DatabaseService);
  await db.connect({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "your_password",
    database: "my_database",
  });

  console.log("✅ Database connected");

  await app.listen(3000);
}

bootstrap();
```

---

## 📚 Learning Path

### Beginner Track (Start Here)

```
1. Getting Started (this file) ✅
2. Framework Overview → Controllers → Modules
3. Add Services (Dependency Injection)
4. Connect Database
5. Add Validation
6. Add Authentication
```

### Intermediate Track

```
1. Guards & Interceptors
2. Error Handling
3. Testing
4. Best Practices
5. Real-World Examples
```

### Advanced Track

```
1. Advanced Features (GraphQL, WebSockets)
2. Performance Optimization
3. Deployment
4. Migration Guides
5. CLI Tools
```

---

## 🆘 Common Issues

### Issue: "experimentalDecorators" Error

**Solution:** Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Issue: Module Not Found

**Solution:** Check your imports and ensure TypeScript is configured correctly:

```typescript
// ✅ Correct
import { Controller, Get } from "@fynixjs/fynix";

// ❌ Wrong
import { Controller, Get } from "fynix";
```

### Issue: Port Already in Use

**Solution:** Change the port or kill the process:

```bash
# Use different port
PORT=4000 npm start

# Or find and kill the process (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 🎯 Quick Tips

- **Use TypeScript** - FynixJS is TypeScript-first
- **Enable decorators** - Required in tsconfig.json
- **Hot reload** - Use ts-node-dev for development
- **Read errors** - FynixJS provides clear error messages
- **Check examples** - Every doc has real-world examples

---

## 📖 Documentation Map

| Topic                    | File                                                             | For              |
| ------------------------ | ---------------------------------------------------------------- | ---------------- |
| Getting Started          | [00-GETTING_STARTED.md](./00-GETTING_STARTED.md)                 | Beginners        |
| Quick Reference          | [15-QUICK_REFERENCE.md](./15-QUICK_REFERENCE.md)                 | All Developers   |
| Framework Overview       | [01-FRAMEWORK_OVERVIEW.md](./01-FRAMEWORK_OVERVIEW.md)           | Understanding    |
| Dependency Injection     | [02-DEPENDENCY_INJECTION.md](./02-DEPENDENCY_INJECTION.md)       | Core Concept     |
| Controllers & Routing    | [04-CONTROLLERS_ROUTING.md](./04-CONTROLLERS_ROUTING.md)         | Building APIs    |
| Database & ORM           | [05-DATABASE_ORM.md](./05-DATABASE_ORM.md)                       | Data Persistence |
| Security & Auth          | [06-SECURITY_AUTH.md](./06-SECURITY_AUTH.md)                     | Security         |
| Testing                  | [11-TESTING.md](./11-TESTING.md)                                 | Quality          |
| Troubleshooting          | [16-TROUBLESHOOTING.md](./16-TROUBLESHOOTING.md)                 | Problem Solving  |
| Migration Guide          | [17-MIGRATION_GUIDE.md](./17-MIGRATION_GUIDE.md)                 | Switching Frameworks |
| Best Practices           | [13-BEST_PRACTICES.md](./13-BEST_PRACTICES.md)                   | Production       |

---

## 🤝 Need Help?

- **Issues**: Check [Troubleshooting Guide](./16-TROUBLESHOOTING.md)
- **Questions**: Open an issue on GitHub
- **Examples**: See [Real-World Examples](./14-REAL_WORLD_EXAMPLES.md)

---

**Ready to build? Let's go! 🚀**

Next: [Framework Overview →](./01-FRAMEWORK_OVERVIEW.md)
