# 13 - Best Practices

## 📋 Table of Contents

- [Code Organization](#code-organization)
- [Naming Conventions](#naming-conventions)
- [Error Handling Patterns](#error-handling-patterns)
- [Security Best Practices](#security-best-practices)
- [Performance Optimization](#performance-optimization)
- [Testing Strategies](#testing-strategies)
- [Database Best Practices](#database-best-practices)
- [API Design](#api-design)
- [Common Anti-Patterns](#common-anti-patterns)
- [Code Review Checklist](#code-review-checklist)

---

## 📁 Code Organization

### Feature-Based Structure (Recommended)

```
src/
├── main.ts
├── app.module.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── entities/
│   │   └── user.entity.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   ├── update-user.dto.ts
│   │   └── user-response.dto.ts
│   ├── guards/
│   │   └── user-ownership.guard.ts
│   └── tests/
│       ├── users.service.spec.ts
│       └── users.controller.spec.ts
│
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── ...
│
├── shared/
│   ├── database/
│   │   └── database.module.ts
│   ├── common/
│   │   ├── interceptors/
│   │   ├── guards/
│   │   ├── pipes/
│   │   └── filters/
│   └── utils/
│       ├── pagination.util.ts
│       └── validation.util.ts
│
└── config/
    ├── database.config.ts
    ├── app.config.ts
    └── jwt.config.ts
```

### ✅ DO

```typescript
// ✅ Group by feature
users / users.module.ts;
users.controller.ts;
users.service.ts;
users.repository.ts;

products / products.module.ts;
products.controller.ts;
products.service.ts;
```

### ❌ DON'T

```typescript
// ❌ Group by type
controllers / users.controller.ts;
products.controller.ts;

services / users.service.ts;
products.service.ts;
```

---

## 🏷️ Naming Conventions

### Files

```typescript
// ✅ Good
user.entity.ts;
user.repository.ts;
user.service.ts;
user.controller.ts;
create - user.dto.ts;
jwt - auth.guard.ts;
logging.interceptor.ts;
validation.pipe.ts;

// ❌ Bad
User.ts;
userRepo.ts;
UserServ.ts;
usercontroller.ts;
```

### Classes

```typescript
// ✅ Good - Clear, descriptive names
export class UserService {}
export class ProductRepository {}
export class JwtAuthGuard {}
export class LoggingInterceptor {}
export class ValidationPipe {}
export class CreateUserDto {}

// ❌ Bad
export class UserServ {}
export class ProdRepo {}
export class Auth {}
export class Logger {}
export class Validator {}
```

### Methods

```typescript
// ✅ Good - Action verbs
async findUserById(id: number) {}
async createProduct(dto: CreateProductDto) {}
async updateOrderStatus(orderId: number, status: string) {}
async deleteUser(id: number) {}
async validateEmail(email: string) {}

// ❌ Bad
async user(id: number) {}
async product(dto: any) {}
async order(id: number, status: string) {}
```

### Variables

```typescript
// ✅ Good
const isAuthenticated = true;
const userCount = await this.userRepo.count();
const hasPermission = await this.checkPermission();
const createdAt = new Date();

// ❌ Bad
const auth = true;
const cnt = await this.userRepo.count();
const perm = await this.checkPermission();
const created = new Date();
```

---

## 🚨 Error Handling Patterns

### Use Specific Exceptions

```typescript
// ✅ Good
if (!user) {
  throw new NotFoundException("User not found");
}

if (exists) {
  throw new ConflictException("Email already exists");
}

if (!hasPermission) {
  throw new ForbiddenException("Insufficient permissions");
}

// ❌ Bad
if (!user) {
  throw new Error("User not found");
}

if (exists) {
  return { error: "Email exists" };
}
```

### Consistent Error Format

```typescript
// ✅ Good - Consistent structure
try {
  await this.userService.create(dto);
} catch (error) {
  if (error instanceof ValidationException) {
    throw new BadRequestException({
      message: "Validation failed",
      errors: error.errors,
    });
  }
  throw error;
}

// Global exception filter
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const response = context.switchToHttp().getResponse();

    response.status(exception.status || 500).json({
      success: false,
      statusCode: exception.status || 500,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Handle Async Errors

```typescript
// ✅ Good
@Get('/:id')
async findOne(@Param('id') id: string) {
  try {
    const user = await this.userService.findById(Number(id));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw new InternalServerErrorException('Failed to fetch user');
  }
}

// ❌ Bad - No error handling
@Get('/:id')
async findOne(@Param('id') id: string) {
  const user = await this.userService.findById(Number(id));
  return user;
}
```

---

## 🔐 Security Best Practices

### Input Validation

```typescript
// ✅ Good
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;
}

@Post()
@UsePipes(ValidationPipe)
async create(@Body() dto: CreateUserDto) {
  return await this.userService.create(dto);
}
```

### Sanitize Input

```typescript
// ✅ Good
import { sanitize } from 'sanitize-html';

@Post('/posts')
async createPost(@Body() dto: CreatePostDto) {
  const sanitized = {
    ...dto,
    title: sanitize(dto.title),
    content: sanitize(dto.content)
  };
  return await this.postService.create(sanitized);
}
```

### Never Expose Sensitive Data

```typescript
// ✅ Good
@Get('/:id')
async findOne(@Param('id') id: string) {
  const user = await this.userService.findById(Number(id));
  const { password, ...safeUser } = user;
  return safeUser;
}

// Or use DTOs
export class UserResponseDto {
  id: number;
  email: string;
  name: string;
  // password excluded
}

// ❌ Bad
@Get('/:id')
async findOne(@Param('id') id: string) {
  const user = await this.userService.findById(Number(id));
  return user; // Includes password!
}
```

### Rate Limit Sensitive Endpoints

```typescript
// ✅ Good
@Controller("/auth")
export class AuthController {
  @Post("/login")
  @UseInterceptors(
    new RateLimitInterceptor({ maxRequests: 5, windowMs: 300000 })
  )
  async login() {}

  @Post("/register")
  @UseInterceptors(
    new RateLimitInterceptor({ maxRequests: 3, windowMs: 3600000 })
  )
  async register() {}
}
```

---

## ⚡ Performance Optimization

### Use Pagination

```typescript
// ✅ Good
@Get()
async findAll(
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '10'
) {
  const pageNum = Number(page);
  const limitNum = Number(limit);

  return await this.userService.findAll({
    page: pageNum,
    limit: limitNum
  });
}

// ❌ Bad - Returns all records
@Get()
async findAll() {
  return await this.userService.findAll(); // Could be millions of records!
}
```

### Select Only Needed Fields

```typescript
// ✅ Good
async findUsers() {
  return await this.userRepo.query()
    .select('id', 'email', 'name')
    .get();
}

// ❌ Bad - Selects all columns
async findUsers() {
  return await this.userRepo.findAll();
}
```

### Use Caching

```typescript
// ✅ Good
@Injectable()
export class ProductService {
  private cache = new Map<number, Product>();

  async findById(id: number) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const product = await this.productRepo.findById(id);
    this.cache.set(id, product);
    return product;
  }
}
```

### Avoid N+1 Queries

```typescript
// ✅ Good - Single query
async getPostsWithAuthors() {
  const posts = await this.postRepo.query()
    .select('posts.*, users.name as authorName')
    .join('users', 'posts.userId', 'users.id')
    .get();

  return posts;
}

// ❌ Bad - N+1 queries
async getPostsWithAuthors() {
  const posts = await this.postRepo.findAll();

  for (const post of posts) {
    post.author = await this.userRepo.findById(post.userId); // N queries!
  }

  return posts;
}
```

---

## 🧪 Testing Strategies

### Unit Test Services

```typescript
describe("UserService", () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    service = new UserService(mockRepo);
  });

  it("should find user by id", async () => {
    const mockUser = { id: 1, email: "test@example.com", name: "Test" };
    mockRepo.findById.mockResolvedValue(mockUser);

    const result = await service.findById(1);

    expect(result).toEqual(mockUser);
    expect(mockRepo.findById).toHaveBeenCalledWith(1);
  });

  it("should throw NotFoundException when user not found", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(service.findById(999)).rejects.toThrow(NotFoundException);
  });
});
```

### Integration Tests

```typescript
describe("UserController (e2e)", () => {
  let app: FynixApplication;

  beforeAll(async () => {
    app = await FynixFactory.create(TestModule);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /users should return users", async () => {
    const response = await request(app.getHttpServer())
      .get("/users")
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
  });
});
```

---

## 💾 Database Best Practices

### Use Transactions for Multiple Operations

```typescript
// ✅ Good
async transferFunds(fromId: number, toId: number, amount: number) {
  const conn = await this.db.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, fromId]);
    await conn.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, toId]);

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  }
}
```

### Use Indexes

```typescript
// ✅ Good
@Entity("users")
export class User extends BaseEntity {
  @Column()
  @Index()
  email: string;

  @Column()
  @Index("idx_lastname")
  lastName: string;
}
```

### Avoid SELECT \*

```typescript
// ✅ Good
const users = await this.userRepo.query().select("id", "email", "name").get();

// ❌ Bad
const users = await this.userRepo.findAll(); // SELECT *
```

---

## 🎨 API Design

### RESTful Routes

```typescript
// ✅ Good
GET    /users           // List users
GET    /users/:id       // Get user
POST   /users           // Create user
PUT    /users/:id       // Update user
DELETE /users/:id       // Delete user

// ❌ Bad
GET    /getAllUsers
POST   /createUser
POST   /updateUser
POST   /deleteUser/:id
```

### Consistent Response Format

```typescript
// ✅ Good
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

@Get()
async findAll(): Promise<ApiResponse<User[]>> {
  const users = await this.userService.findAll();
  return {
    success: true,
    data: users
  };
}
```

### Use HTTP Status Codes Correctly

```typescript
// ✅ Good
@Post()
async create(@Body() dto: CreateUserDto) {
  const user = await this.userService.create(dto);
  return {
    statusCode: 201, // Created
    data: user
  };
}

@Get('/:id')
async findOne(@Param('id') id: string) {
  const user = await this.userService.findById(Number(id));
  if (!user) {
    throw new NotFoundException(); // 404
  }
  return user;
}
```

---

## ❌ Common Anti-Patterns

### 1. Fat Controllers

```typescript
// ❌ Bad
@Controller("/users")
export class UserController {
  @Post()
  async create(@Body() body: any) {
    // Business logic in controller
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await db.query("INSERT INTO users...");
    await sendEmail(user.email);
    return user;
  }
}

// ✅ Good
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }
}
```

### 2. Magic Numbers

```typescript
// ❌ Bad
if (user.age > 18) {
  // ...
}

// ✅ Good
const LEGAL_AGE = 18;
if (user.age > LEGAL_AGE) {
  // ...
}
```

### 3. Callback Hell

```typescript
// ❌ Bad
function getData(callback) {
  getUser(id, (user) => {
    getPosts(user.id, (posts) => {
      getComments(posts[0].id, (comments) => {
        callback(comments);
      });
    });
  });
}

// ✅ Good
async function getData() {
  const user = await getUser(id);
  const posts = await getPosts(user.id);
  const comments = await getComments(posts[0].id);
  return comments;
}
```

### 4. Ignoring Errors

```typescript
// ❌ Bad
async function fetchData() {
  try {
    await someAsyncOperation();
  } catch (error) {
    // Silently ignore
  }
}

// ✅ Good
async function fetchData() {
  try {
    await someAsyncOperation();
  } catch (error) {
    this.logger.error("Failed to fetch data", error);
    throw new InternalServerErrorException("Failed to fetch data");
  }
}
```

---

## ✅ Code Review Checklist

### General

- [ ] Code follows naming conventions
- [ ] No hardcoded values (use config)
- [ ] No console.log (use logger)
- [ ] No commented-out code
- [ ] Functions are small and focused

### Security

- [ ] Input validated
- [ ] Passwords hashed
- [ ] No sensitive data exposed
- [ ] Rate limiting on auth endpoints
- [ ] SQL injection prevented

### Performance

- [ ] Pagination implemented
- [ ] Indexes on database queries
- [ ] No N+1 queries
- [ ] Caching used where appropriate
- [ ] SELECT only needed fields

### Error Handling

- [ ] Try-catch blocks present
- [ ] Specific exceptions used
- [ ] Errors logged
- [ ] User-friendly error messages
- [ ] Rollback on transaction failure

### Testing

- [ ] Unit tests written
- [ ] Edge cases covered
- [ ] Mocks used appropriately
- [ ] Integration tests for critical paths

---

## 💡 Key Takeaways

✅ Organize by feature, not by type  
✅ Use clear, descriptive naming  
✅ Handle errors consistently  
✅ Validate and sanitize all input  
✅ Optimize database queries  
✅ Write comprehensive tests  
✅ Follow RESTful conventions  
✅ Keep controllers thin  
✅ Use TypeScript features fully  
✅ Document complex logic

---

**Follow these best practices** to build maintainable, scalable FynixJS applications!
