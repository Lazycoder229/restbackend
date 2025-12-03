# Getting Started with FynixJS

Welcome to FynixJS! This guide will help you create your first application in minutes.

---

## 📋 Prerequisites

- **Node.js** 16 or higher
- **npm** or **yarn**
- Basic TypeScript knowledge
- MySQL database (optional, for database features)

---

## 🚀 Installation

### Option 1: Start from Scratch

```bash
# Create a new directory
mkdir my-fynix-app
cd my-fynix-app

# Initialize npm
npm init -y

# Install FynixJS
npm install @fynixjs/fynix

# Install TypeScript
npm install -D typescript @types/node

# Create tsconfig.json
npx tsc --init
```

### Option 2: Use CLI (Recommended)

```bash
npx @fynixjs/create-app my-app
cd my-app
npm install
npm start
```

---

## 📁 Project Structure

```
my-fynix-app/
├── src/
│   ├── controllers/
│   │   └── app.controller.ts
│   ├── services/
│   │   └── app.service.ts
│   ├── app.module.ts
│   └── main.ts
├── package.json
└── tsconfig.json
```

---

## 🔧 TypeScript Configuration

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 📝 Create Your First Application

### Step 1: Create a Controller

Create `src/controllers/app.controller.ts`:

```typescript
import { Controller, Get } from "@fynixjs/fynix";

@Controller("/")
export class AppController {
  @Get()
  getHello() {
    return { message: "Hello FynixJS!" };
  }

  @Get("/about")
  getAbout() {
    return {
      name: "FynixJS",
      version: "1.0.0",
      description: "Lightweight TypeScript framework",
    };
  }
}
```

### Step 2: Create a Module

Create `src/app.module.ts`:

```typescript
import { Module } from "@fynixjs/fynix";
import { AppController } from "./controllers/app.controller";

@Module({
  controllers: [AppController],
})
export class AppModule {}
```

### Step 3: Bootstrap the Application

Create `src/main.ts`:

```typescript
import { FynixFactory } from "@fynixjs/fynix";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();
  await app.listen(3000);
  console.log("🚀 Application is running on http://localhost:3000");
}

bootstrap();
```

### Step 4: Add Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "ts-node src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js"
  }
}
```

### Step 5: Run Your Application

```bash
# Development mode
npm run dev

# Or build and run
npm run build
npm start
```

### Step 6: Test It!

```bash
curl http://localhost:3000
# Response: {"message":"Hello FynixJS!"}

curl http://localhost:3000/about
# Response: {"name":"FynixJS","version":"1.0.0",...}
```

---

## 🔥 Enable Hot Reload

Add hot reload to your `main.ts`:

```typescript
async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();

  // Enable hot reload
  app.enableHotReload({
    enabled: true,
    watchPaths: ["src"],
    debounceMs: 500,
  });

  await app.listen(3000);
  console.log("🚀 Application is running on http://localhost:3000");
  console.log("🔥 Hot reload enabled");
}
```

Now your application will automatically restart when you change files!

---

## 📦 Adding a Service

### Create a Service

Create `src/services/app.service.ts`:

```typescript
import { Injectable } from "@fynixjs/fynix";

@Injectable()
export class AppService {
  getGreeting(): string {
    return "Hello from AppService!";
  }

  getRandomNumber(): number {
    return Math.floor(Math.random() * 100);
  }
}
```

### Use the Service in Controller

Update `src/controllers/app.controller.ts`:

```typescript
import { Controller, Get } from "@fynixjs/fynix";
import { AppService } from "../services/app.service";

@Controller("/")
export class AppController {
  constructor(private appService: AppService) {} // Automatically injected!

  @Get()
  getHello() {
    return { message: this.appService.getGreeting() };
  }

  @Get("/random")
  getRandom() {
    return { number: this.appService.getRandomNumber() };
  }
}
```

### Register the Service

Update `src/app.module.ts`:

```typescript
import { Module } from "@fynixjs/fynix";
import { AppController } from "./controllers/app.controller";
import { AppService } from "./services/app.service";

@Module({
  controllers: [AppController],
  providers: [AppService], // Register the service
})
export class AppModule {}
```

---

## 🎯 Next Steps

Now that you have a basic application running:

1. **Add Database** - [Database & ORM Guide](./05-DATABASE.md)
2. **Add Authentication** - [Security Guide](./06-SECURITY.md)
3. **Create More Controllers** - [Controllers Guide](./03-CONTROLLERS.md)
4. **Organize with Modules** - [Modules Guide](./04-MODULES.md)

---

## 🐛 Troubleshooting

### Port Already in Use

```typescript
await app.listen(3001); // Try a different port
```

### TypeScript Errors

```bash
npm install -D @types/node
```

### Hot Reload Not Working

Make sure you're using `ts-node` or a process manager:

```bash
npm install -D ts-node
```

---

## 📚 Additional Resources

- [Core Concepts](./02-CORE_CONCEPTS.md)
- [API Reference](./09-API_REFERENCE.md)
- [Examples](./10-EXAMPLES.md)

---

**Congratulations! 🎉** You've created your first FynixJS application!
