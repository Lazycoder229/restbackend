# FynixJS Framework

<p align="center">
  <strong>🚀 Lightweight TypeScript Framework with Built-in Everything</strong>
</p>

<p align="center">
  Build modern APIs faster with decorators, dependency injection, and zero configuration.<br>
  Security, database, ORM, and hot reload included out of the box!
</p>

---

## ✨ Why FynixJS?

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
| **🗂️ ORM**                  | ✅ Built-in | Query Builder + Repository + Active Record       |
| **📊 Entity/Models**        | ✅ Built-in | TypeORM-like @Entity decorator & BaseEntity      |
| **🔄 Schema Sync**          | ✅ Built-in | Auto-create tables from decorators (no SQL!)     |
| **📁 Static Files**         | ✅ Built-in | Serve HTML, CSS, JS, images with caching         |
| **🛡️ CORS**                 | ✅ Built-in | Configurable cross-origin support                |
| **⚡ Rate Limiting**        | ✅ Built-in | Prevent API abuse                                |
| **🔒 Security Headers**     | ✅ Built-in | Helmet-like protection                           |
| **💉 Dependency Injection** | ✅ Built-in | IoC container with decorators                    |
| **📦 Modular**              | ✅ Built-in | NestJS-like module system                        |
| **🚀 High Performance**     | ✅ Built-in | Optimized routing and request handling           |

---

## 🚀 Quick Start

### Installation

```bash
npm install @fynixjs/fynix
```

### Basic Example

```typescript
import { FynixFactory, Controller, Get, Module } from "@fynixjs/fynix";

@Controller("/api")
export class AppController {
  @Get("/hello")
  getHello() {
    return { message: "Hello FynixJS!" };
  }
}

@Module({
  controllers: [AppController],
})
export class AppModule {}

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();
  await app.listen(3000);
  console.log("🚀 Server running at http://localhost:3000");
}

bootstrap();
```

### Test It

```bash
curl http://localhost:3000/api/hello
# Response: {"message":"Hello FynixJS!"}
```

---

## 📚 Documentation

| #   | Topic                                                    | Description                          |
| --- | -------------------------------------------------------- | ------------------------------------ |
| 1   | **[Getting Started](./01-GETTING_STARTED.md)**           | Installation & first app             |
| 2   | **[Core Concepts](./02-CORE_CONCEPTS.md)**               | Architecture & DI container          |
| 3   | **[Controllers & Routing](./03-CONTROLLERS.md)**         | HTTP methods & request handling      |
| 4   | **[Modules](./04-MODULES.md)**                           | Module system & organization         |
| 5   | **[Database & ORM](./05-DATABASE.md)**                   | QueryBuilder, Repository, BaseEntity |
| 6   | **[Security](./06-SECURITY.md)**                         | JWT, bcrypt, guards, validation      |
| 7   | **[Guards & Interceptors](./07-GUARDS_INTERCEPTORS.md)** | Request pipeline customization       |
| 8   | **[Decorators Reference](./08-DECORATORS.md)**           | Complete decorator API               |
| 9   | **[API Reference](./09-API_REFERENCE.md)**               | Full API documentation               |
| 10  | **[Examples](./10-EXAMPLES.md)**                         | Real-world code examples             |

---

## 🔥 Key Features

### Dependency Injection

```typescript
@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}
}

@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {} // Auto-injected!
}
```

### Entity/Active Record Pattern

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
  email: string;
}

// Usage
const users = await User.findAll();
const user = await User.findById(1);

const newUser = new User();
newUser.name = "John";
await newUser.save();
```

### Guards & Authentication

```typescript
@Controller("/admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  @Get("/dashboard")
  getDashboard() {
    return { message: "Protected route!" };
  }
}
```

### Interceptors

```typescript
@Controller("/api")
@UseInterceptors(LoggingInterceptor)
export class ApiController {
  @Get("/data")
  getData() {
    return { data: "example" };
  }
}
```

### Static Files

```typescript
import { StaticFilesInterceptor } from "@fynixjs/fynix";

const app = await FynixFactory.create(AppModule);

// Serve static files from 'public' directory
app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    rootDir: "public",
    prefix: "/static",
    maxAge: 86400, // Cache for 1 day
  })
);

await app.listen(3000);
// Access: http://localhost:3000/static/index.html
```

---

## 💡 Philosophy

FynixJS is designed to:

- ✅ **Minimize boilerplate** - Focus on business logic, not configuration
- ✅ **Be production-ready** - Security, database, and ORM included
- ✅ **Stay lightweight** - No unnecessary dependencies
- ✅ **Be familiar** - Inspired by NestJS and Express
- ✅ **Be fast** - Optimized routing and request handling

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 👤 Author

**Resty Gonzales**  
Email: gonzalesresty32@gmail.com  
GitHub: [@Lazycoder229](https://github.com/Lazycoder229)

---

## ⭐ Support

If you find FynixJS helpful, please give it a ⭐ on GitHub!

**Happy Coding! 🚀**
