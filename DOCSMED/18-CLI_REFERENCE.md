# 18 - CLI Reference

## 🛠️ FynixJS Command Line Interface

Complete reference for FynixJS CLI tools and commands.

---

## 📦 Installation

The CLI is included with FynixJS. No separate installation needed.

```bash
npm install @fynixjs/fynix
```

Access CLI commands via `npx`:

```bash
npx fynix --help
```

Or add to `package.json` scripts:

```json
{
  "scripts": {
    "fynix": "fynix"
  }
}
```

Then run:

```bash
npm run fynix -- --help
```

---

## 🚀 Available Commands

### General Commands

#### `fynix --help`

Display help information

```bash
npx fynix --help
```

#### `fynix --version`

Show FynixJS version

```bash
npx fynix --version
```

---

## 🗄️ Database Commands

### Migration Commands

#### `fynix migrate:run`

Run pending migrations

```bash
npx fynix migrate:run
```

**Environment Variables:**

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=myapp
```

**Example:**

```bash
DB_HOST=localhost DB_USER=root DB_PASSWORD=secret npx fynix migrate:run
```

#### `fynix migrate:rollback`

Rollback last migration batch

```bash
npx fynix migrate:rollback
```

**Options:**

```bash
# Rollback specific number of batches
npx fynix migrate:rollback --steps=2
```

#### `fynix migrate:reset`

Rollback all migrations

```bash
npx fynix migrate:reset
```

⚠️ **Warning:** This will drop all tables!

#### `fynix migrate:status`

Show migration status

```bash
npx fynix migrate:status
```

**Output:**

```
Migration Status:
✅ 2025_01_01_000000_create_users_table.js - Ran
✅ 2025_01_02_000000_create_posts_table.js - Ran
❌ 2025_01_03_000000_add_role_to_users.js - Pending
```

### Seeder Commands

#### `fynix seed:run`

Run database seeders

```bash
npx fynix seed:run
```

**Options:**

```bash
# Run specific seeder
npx fynix seed:run --class=UserSeeder
```

---

## 🏗️ Project Commands

### `fynix new <project-name>`

Create a new FynixJS project

```bash
npx fynix new my-app
```

**What it creates:**

```
my-app/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   └── app.controller.ts
├── package.json
├── tsconfig.json
└── .env.example
```

**Options:**

```bash
# Skip npm install
npx fynix new my-app --skip-install

# Use specific package manager
npx fynix new my-app --package-manager=yarn
```

### `fynix generate` (or `g`)

Generate code scaffolding

#### Generate Controller

```bash
npx fynix g controller User
```

**Creates:** `src/user/user.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from "@fynixjs/fynix";

@Controller("/users")
export class UserController {
  @Get()
  findAll() {
    return [];
  }

  @Get("/:id")
  findOne(@Param("id") id: string) {
    return { id };
  }

  @Post()
  create(@Body() body: any) {
    return body;
  }

  @Put("/:id")
  update(@Param("id") id: string, @Body() body: any) {
    return { id, ...body };
  }

  @Delete("/:id")
  remove(@Param("id") id: string) {
    return { id };
  }
}
```

#### Generate Service

```bash
npx fynix g service User
```

**Creates:** `src/user/user.service.ts`

```typescript
import { Injectable } from "@fynixjs/fynix";

@Injectable()
export class UserService {
  constructor() {}

  findAll() {
    return [];
  }

  findOne(id: number) {
    return { id };
  }

  create(data: any) {
    return data;
  }

  update(id: number, data: any) {
    return { id, ...data };
  }

  remove(id: number) {
    return { id };
  }
}
```

#### Generate Module

```bash
npx fynix g module User
```

**Creates:** `src/user/user.module.ts`

```typescript
import { Module } from "@fynixjs/fynix";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

#### Generate Entity

```bash
npx fynix g entity User
```

**Creates:** `src/user/entities/user.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
} from "@fynixjs/fynix";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  @Unique()
  email: string;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
```

#### Generate Guard

```bash
npx fynix g guard Auth
```

**Creates:** `src/guards/auth.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from "@fynixjs/fynix";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Add your authentication logic here
    return true;
  }
}
```

#### Generate Interceptor

```bash
npx fynix g interceptor Logging
```

**Creates:** `src/interceptors/logging.interceptor.ts`

```typescript
import {
  Injectable,
  FynixInterceptor,
  ExecutionContext,
  CallHandler,
} from "@fynixjs/fynix";

@Injectable()
export class LoggingInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    console.log(`[${request.method}] ${request.url}`);

    const result = await next.handle();
    return result;
  }
}
```

#### Generate Pipe

```bash
npx fynix g pipe Validation
```

#### Generate Complete Resource

```bash
npx fynix g resource User
```

**Creates complete CRUD setup:**

```
src/user/
├── user.module.ts
├── user.controller.ts
├── user.service.ts
├── entities/
│   └── user.entity.ts
└── dto/
    ├── create-user.dto.ts
    └── update-user.dto.ts
```

---

## ⚙️ Configuration Commands

### `fynix config:show`

Display current configuration

```bash
npx fynix config:show
```

**Output:**

```
FynixJS Configuration:
- Database: mysql://localhost:3306/myapp
- Port: 3000
- Environment: development
```

### `fynix config:validate`

Validate configuration files

```bash
npx fynix config:validate
```

---

## 🧪 Development Commands

### `fynix dev`

Start development server with hot reload

```bash
npx fynix dev
```

**Options:**

```bash
# Specific port
npx fynix dev --port=4000

# Watch specific files
npx fynix dev --watch="src/**/*.ts"
```

### `fynix build`

Build project for production

```bash
npx fynix build
```

**Output:** Compiled files in `dist/` directory

**Options:**

```bash
# Custom output directory
npx fynix build --outDir=build

# Watch mode
npx fynix build --watch
```

### `fynix start`

Start production server

```bash
npx fynix start
```

Runs the built application from `dist/` folder.

---

## 🔍 Utility Commands

### `fynix info`

Display project and system information

```bash
npx fynix info
```

**Output:**

```
FynixJS Project Information:
- FynixJS Version: 1.0.0
- Node.js Version: v18.17.0
- TypeScript Version: 5.2.2
- Platform: win32
- Database: MySQL 8.0
```

### `fynix lint`

Run linting checks

```bash
npx fynix lint
```

### `fynix test`

Run tests

```bash
npx fynix test
```

**Options:**

```bash
# Run specific test
npx fynix test --file=user.spec.ts

# Watch mode
npx fynix test --watch

# Coverage
npx fynix test --coverage
```

---

## 📝 Examples

### Complete Workflow Example

```bash
# 1. Create new project
npx fynix new my-blog

# 2. Navigate to project
cd my-blog

# 3. Generate a complete resource
npx fynix g resource Post

# 4. Generate another resource
npx fynix g resource Comment

# 5. Run migrations
npx fynix migrate:run

# 6. Seed database
npx fynix seed:run

# 7. Start development server
npx fynix dev
```

### Database Workflow Example

```bash
# 1. Check migration status
npx fynix migrate:status

# 2. Run pending migrations
npx fynix migrate:run

# 3. If something wrong, rollback
npx fynix migrate:rollback

# 4. Seed test data
npx fynix seed:run

# 5. View database config
npx fynix config:show
```

---

## 🎨 Generator Options

### Common Options for `generate` Commands

```bash
# Specify path
npx fynix g controller User --path=src/modules/user

# Skip tests
npx fynix g service User --no-spec

# Flat structure (no folder)
npx fynix g controller User --flat

# Dry run (preview without creating)
npx fynix g module User --dry-run
```

---

## 🔧 Environment Variables

### Required for Database Commands

```bash
DB_HOST=localhost        # Database host
DB_PORT=3306            # Database port
DB_USER=root            # Database user
DB_PASSWORD=secret      # Database password
DB_NAME=myapp          # Database name
```

### Optional Configuration

```bash
PORT=3000              # Server port
NODE_ENV=development   # Environment
LOG_LEVEL=debug        # Logging level
```

### Using .env File

Create `.env` file in project root:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=myapp
PORT=3000
```

Then run commands:

```bash
npx fynix migrate:run
# Automatically loads from .env
```

---

## 💡 Tips & Tricks

### 1. **Add to npm scripts**

**package.json:**

```json
{
  "scripts": {
    "dev": "fynix dev",
    "build": "fynix build",
    "start": "fynix start",
    "migrate": "fynix migrate:run",
    "seed": "fynix seed:run",
    "g:controller": "fynix g controller",
    "g:service": "fynix g service",
    "g:resource": "fynix g resource"
  }
}
```

**Usage:**

```bash
npm run dev
npm run migrate
npm run g:resource User
```

### 2. **Create aliases**

**bash/zsh:**

```bash
alias fyx="npx fynix"
```

**Usage:**

```bash
fyx g controller User
fyx dev
```

### 3. **Use with environment files**

```bash
# Development
NODE_ENV=development npx fynix dev

# Production
NODE_ENV=production npx fynix start

# Load from specific env file
source .env.production && npx fynix start
```

---

## 🆘 Troubleshooting

### Command Not Found

**Error:**

```
'fynix' is not recognized as an internal or external command
```

**Solution:**

```bash
# Use npx
npx fynix --help

# Or install globally
npm install -g @fynixjs/fynix
fynix --help
```

### Database Connection Failed

**Error:**

```
Database connection required. Please set environment variables.
```

**Solution:**

```bash
# Set environment variables
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=secret
export DB_NAME=myapp

# Or use .env file
echo "DB_HOST=localhost" >> .env
echo "DB_USER=root" >> .env
```

### Permission Denied (Unix/Linux)

**Error:**

```
EACCES: permission denied
```

**Solution:**

```bash
chmod +x node_modules/.bin/fynix
npx fynix --help
```

---

## 🔗 Related Documentation

- [Getting Started](./00-GETTING_STARTED.md) - Setup guide
- [Database & ORM](./05-DATABASE_ORM.md) - Database features
- [Troubleshooting](./16-TROUBLESHOOTING.md) - Common issues
- [Best Practices](./13-BEST_PRACTICES.md) - Development patterns

---

## 📚 Quick Reference Card

```bash
# Project
npx fynix new <name>           # Create project
npx fynix dev                  # Development mode
npx fynix build                # Build for production
npx fynix start                # Start production

# Generators
npx fynix g controller <name>  # Generate controller
npx fynix g service <name>     # Generate service
npx fynix g module <name>      # Generate module
npx fynix g entity <name>      # Generate entity
npx fynix g resource <name>    # Generate complete CRUD

# Database
npx fynix migrate:run          # Run migrations
npx fynix migrate:rollback     # Rollback migration
npx fynix migrate:status       # Check status
npx fynix seed:run             # Run seeders

# Utility
npx fynix --help               # Show help
npx fynix --version            # Show version
npx fynix info                 # Project info
```

---

**Save this page for quick CLI reference! 🖨️**
