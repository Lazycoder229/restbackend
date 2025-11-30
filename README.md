# RestJS Framework

<p align="center">
  <strong>🚀 Lightweight TypeScript Framework with Built-in Everything</strong>
</p>

<p align="center">
  Build REST APIs faster with decorators, dependency injection, and zero configuration.<br>
  Security, database, and ORM included out of the box!
</p>

---

## ✨ Why RestJS?

```typescript
// This is all you need! No setup, no extra packages.
@Controller("/users")
export class UsersController {
  constructor(private repo: UsersRepository) {}

  @Get()
  @UseGuards(JwtAuthGuard) // ✅ JWT auth built-in
  async getUsers() {
    return await this.repo.findAll(); // ✅ ORM built-in
  }
}
```

### 🎯 Built-in Features (Zero Installation Required)

| Feature                     | Status      | Description                                      |
| --------------------------- | ----------- | ------------------------------------------------ |
| **🔥 Hot Reload**           | ✅ Built-in | Auto-restart on file changes (zero config)       |
| **🔐 Security**             | ✅ Built-in | JWT, bcrypt, password validation, XSS protection |
| **💾 Database**             | ✅ Built-in | MySQL with connection pooling                    |
| **🗂️ ORM**                  | ✅ Built-in | Query Builder + Repository Pattern               |
| **🛡️ CORS**                 | ✅ Built-in | Configurable cross-origin support                |
| **⚡ Rate Limiting**        | ✅ Built-in | Prevent API abuse                                |
| **🔒 Security Headers**     | ✅ Built-in | Helmet-like protection                           |
| **💉 Dependency Injection** | ✅ Built-in | IoC container with decorators                    |
| **📦 Modular**              | ✅ Built-in | NestJS-like module system                        |
| **🚀 High Performance**     | ✅ Built-in | Faster than Fastify, 5x faster than Express      |

### ⚡ Performance

RestJS outperforms industry-leading frameworks:

| Framework  | Requests/sec | Latency  | Performance vs RestJS |
| ---------- | ------------ | -------- | --------------------- |
| **RestJS** | **25,825**   | **36ms** | **100% ⚡**           |
| Fastify    | 21,131       | 43ms     | 82%                   |
| Express    | 4,857        | 195ms    | 19%                   |

✅ **22% faster than Fastify**  
✅ **5.3x faster than Express**  
✅ **Route caching & handler optimization built-in**

[See detailed benchmarks →](./11-PERFORMANCE.md)

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/Lazycoder229/restbackend.git
cd restbackend
npm install
npm run build
```

### Create Your First API

```typescript
// src/main.ts
import { RestFactory, Controller, Get, Module } from "./index";

@Controller("/hello")
class HelloController {
  @Get()
  sayHello() {
    return { message: "Hello RestJS!" };
  }
}

@Module({
  controllers: [HelloController],
})
class AppModule {}

async function bootstrap() {
  const app = await RestFactory.create(AppModule);

  // Enable hot reload for development
  app.enableHotReload();

  await app.listen(3000);
}

bootstrap();
```

```bash
npm run dev
curl http://localhost:3000/hello
```

## 📚 Complete Documentation

### Core Documentation (Read in Order)

| #   | Guide                                            | Description                               |
| --- | ------------------------------------------------ | ----------------------------------------- |
| 1   | **[Getting Started](./01-GETTING_STARTED.md)**   | Complete setup and your first application |
| 2   | **[API Reference](./02-API_REFERENCE.md)**       | Complete decorator and method reference   |
| 3   | **[Creating Modules](./03-CREATING_MODULES.md)** | Build modular applications with DI        |
| 4   | **[ORM Guide](./04-ORM_GUIDE.md)**               | Database queries and repository pattern   |
| 5   | **[Security Guide](./05-SECURITY_GUIDE.md)**     | Authentication, authorization, JWT        |
| 6   | **[Deployment](./06-DEPLOYMENT.md)**             | Production deployment strategies          |
| 7   | **[CI/CD Guide](./07-CI_CD_GUIDE.md)**           | Automated testing and deployment          |
| 8   | **[Contributing](./08-CONTRIBUTING.md)**         | How to contribute to RestJS               |
| 9   | **[Changelog](./09-CHANGELOG.md)**               | Version history and updates               |

### Advanced Topics

| #   | Guide                                                            | Description                                |
| --- | ---------------------------------------------------------------- | ------------------------------------------ |
| 10  | **[Middleware & Interceptors](./10-MIDDLEWARE_INTERCEPTORS.md)** | Guards, interceptors, and request pipeline |
| 11  | **[Performance](./11-PERFORMANCE.md)**                           | Optimization techniques and benchmarks     |

## 🎓 Learn by Example

### Example 1: Simple CRUD

```typescript
// users.repository.ts
@Injectable()
export class UsersRepository extends Repository<User> {
  protected tableName = "users";
}

// users.service.ts
@Injectable()
export class UsersService {
  constructor(private repo: UsersRepository) {}

  async getAll() {
    return await this.repo.findAll();
  }
}

// users.controller.ts
@Controller("/users")
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  async findAll() {
    return await this.service.getAll();
  }

  @Post()
  async create(@Body() data: any) {
    return await this.service.create(data);
  }
}
```

### Example 2: Authentication

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(private security: SecurityService) {}

  async register(email: string, password: string) {
    const hash = await this.security.hashPassword(password);
    // Save to database
    return { success: true };
  }

  async login(email: string, password: string) {
    // Verify credentials
    const token = this.security.generateToken({ email }, "24h");
    return { token };
  }
}

// Protected route
@Controller("/profile")
export class ProfileController {
  @Get()
  @UseGuards(JwtAuthGuard) // Requires JWT token
  getProfile(@Req() req: any) {
    return req.user; // Decoded from JWT
  }
}
```

### Example 3: Database Queries

```typescript
// Using Repository Pattern
const users = await repo.findAll();
const user = await repo.findById(1);
await repo.create({ name: "John", email: "john@test.com" });
await repo.update(1, { name: "Jane" });

// Using Query Builder
const activeUsers = await qb
  .table("users")
  .where("status", "active")
  .orderBy("created_at", "DESC")
  .limit(10)
  .get();

// Using Raw SQL (still available!)
const users = await db.query("SELECT * FROM users WHERE id = ?", [1]);
```

## 🆚 Comparison

### vs Express

- ✅ Built-in dependency injection
- ✅ Decorators for cleaner code
- ✅ Modular architecture
- ✅ Built-in security and database

### vs NestJS

- ✅ Simpler and lighter
- ✅ Faster setup (no CLI needed)
- ✅ Everything built-in (no separate packages)
- ✅ Zero configuration

### vs Fastify/Koa

- ✅ Decorators and DI included
- ✅ Enterprise patterns built-in
- ✅ TypeScript-first design
- ✅ Full-stack ready

## 🏗️ Project Structure

```
my-app/
├── src/
│   ├── modules/
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   └── users.module.ts
│   │   └── auth/
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       └── auth.module.ts
│   ├── app.module.ts
│   ├── main.ts
│   └── index.ts (re-export framework)
├── dist/
├── package.json
└── tsconfig.json
```

## ⚙️ Core Concepts

### Decorators

```typescript
@Controller('/path')    // Define controller
@Get(), @Post(), ...    // HTTP methods
@Injectable()           // Mark for DI
@Module()               // Define module
@UseGuards()            // Apply guards
@UseInterceptors()      // Apply interceptors
@Body(), @Param(), ...  // Extract request data
```

### Dependency Injection

```typescript
@Injectable()
export class UserService {
  constructor(
    private db: DatabaseService, // Auto-injected
    private security: SecurityService // Auto-injected
  ) {}
}
```

### Modules

```typescript
@Module({
  imports: [AuthModule], // Import other modules
  controllers: [UsersController], // HTTP handlers
  providers: [UsersService], // Injectable services
  exports: [UsersService], // Share with other modules
})
export class UsersModule {}
```

## 📊 Performance

- **Fast startup**: < 1 second
- **Low memory**: ~50MB base
- **Native HTTP**: Built on Node.js http module
- **Connection pooling**: Efficient database connections
- **TypeScript**: Compile-time optimization
- **Benchmarked**: Competitive with Express and Fastify (run `npm run benchmark`)

## 🔄 CI/CD

GitHub Actions workflows included:

- ✅ Automated testing on Node 16/18/20
- ✅ Multi-OS testing (Ubuntu/Windows/macOS)
- ✅ Coverage reporting
- ✅ Performance benchmarks
- ✅ Automated npm publishing

See [CI_CD_GUIDE.md](./CI_CD_GUIDE.md) for setup instructions.

## 🧪 Testing & Benchmarking

### Run Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

### Performance Benchmarks

```bash
npm run benchmark        # Compare with Express & Fastify
```

See [CI_CD_GUIDE.md](./CI_CD_GUIDE.md) for CI/CD setup and benchmarking details.

## 🔧 Requirements

- Node.js >= 14
- TypeScript >= 5.0
- MySQL >= 5.7 (optional, only if using database)

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Quick links:**

- Report bugs via [GitHub Issues](https://github.com/Lazycoder229/restbackend/issues)
- Submit pull requests
- Improve documentation
- Share feedback

## 📝 License

MIT License - see [LICENSE](./LICENSE) file

## 👨‍💻 Author

**Resty Gonzales**  
Email: gonzalesresty32@gmail.com  
GitHub: [@Lazycoder229](https://github.com/Lazycoder229)

## 🌟 Support

If you find RestJS helpful, please give it a ⭐ on GitHub!

---

<p align="center">
  <strong>Built with ❤️ using TypeScript, Decorators, and Dependency Injection</strong>
</p>
