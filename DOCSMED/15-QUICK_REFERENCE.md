# 15 - Quick Reference

## 🚀 Cheat Sheet for Experienced Developers

Fast lookup for all FynixJS decorators, APIs, and common patterns.

---

## 📦 Module Decorators

### @Module()

```typescript
@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
  imports: [DatabaseModule, AuthModule],
  exports: [UserService],
})
export class UserModule {}
```

**Options:**
- `controllers`: Array of controller classes
- `providers`: Array of injectable services
- `imports`: Array of modules to import
- `exports`: Array of providers to make available to other modules

---

## 🎮 Controller Decorators

### @Controller(prefix)

```typescript
@Controller("/api/users")
export class UserController {}
```

### HTTP Methods

```typescript
@Get(path?)              // GET request
@Post(path?)             // POST request
@Put(path?)              // PUT request
@Delete(path?)           // DELETE request
@Patch(path?)            // PATCH request
@Options(path?)          // OPTIONS request
@Head(path?)             // HEAD request
```

**Example:**
```typescript
@Controller("/users")
export class UserController {
  @Get()                    // GET /users
  @Get("/:id")             // GET /users/:id
  @Post()                   // POST /users
  @Put("/:id")             // PUT /users/:id
  @Delete("/:id")          // DELETE /users/:id
  @Patch("/:id/status")    // PATCH /users/:id/status
}
```

---

## 📥 Parameter Decorators

### Request Data Extraction

```typescript
@Param(key?)            // Route parameters
@Query(key?)            // Query string parameters
@Body(key?)             // Request body
@Headers(key?)          // Request headers
@Req()                  // Full request object
@Res()                  // Full response object
```

**Examples:**
```typescript
@Get("/:id")
findOne(@Param("id") id: string) {}

@Get()
search(@Query("term") term: string) {}

@Post()
create(@Body() dto: CreateUserDto) {}

@Get()
getUser(@Headers("authorization") auth: string) {}

@Post()
custom(@Req() req: any, @Res() res: any) {}
```

---

## 💉 Injectable Decorator

### @Injectable()

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly config: ConfigService
  ) {}
}
```

---

## 🛡️ Guard Decorators

### @UseGuards(...guards)

```typescript
// Single guard
@UseGuards(JwtAuthGuard)
@Get("/profile")
getProfile() {}

// Multiple guards
@UseGuards(JwtAuthGuard, RolesGuard)
@Get("/admin")
getAdmin() {}

// Controller-level
@Controller("/admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {}
```

### Creating Custom Guards

```typescript
@Injectable()
export class CustomGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Validation logic
    return true;
  }
}
```

---

## 🔄 Interceptor Decorators

### @UseInterceptors(...interceptors)

```typescript
// Single interceptor
@UseInterceptors(LoggingInterceptor)
@Get()
findAll() {}

// Multiple interceptors
@UseInterceptors(CacheInterceptor, TransformInterceptor)
@Get()
getData() {}

// Controller-level
@Controller("/api")
@UseInterceptors(LoggingInterceptor)
export class ApiController {}
```

### Creating Custom Interceptors

```typescript
@Injectable()
export class CustomInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    // Before handler
    const result = await next.handle();
    // After handler
    return result;
  }
}
```

---

## 🔍 Validation Decorators

### @UsePipes(pipe)

```typescript
@Post()
@UsePipes(ValidationPipe)
create(@Body() dto: CreateUserDto) {}
```

### Built-in Validation Decorators

```typescript
import {
  IsString,
  IsNumber,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  Matches,
  IsDate,
  IsUrl,
} from "@fynixjs/fynix";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/)
  password: string;

  @IsNumber()
  @Min(18)
  @Max(120)
  @IsOptional()
  age?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsEnum(["admin", "user", "guest"])
  role: string;

  @IsUrl()
  @IsOptional()
  website?: string;
}
```

---

## 🗄️ Database Decorators

### Entity Decorators

```typescript
@Entity(tableName)                    // Define entity
@PrimaryGeneratedColumn()             // Auto-increment ID
@Column(options?)                     // Define column
@ForeignKey({ table, column })        // Foreign key
@Unique()                             // Unique constraint
@Index()                              // Create index
```

**Example:**
```typescript
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Unique()
  email: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "int", nullable: true })
  age?: number;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column()
  @ForeignKey({ table: "roles", column: "id" })
  roleId: number;
}
```

### Column Types

```typescript
@Column({ type: "varchar", length: 255 })
@Column({ type: "text" })
@Column({ type: "int" })
@Column({ type: "bigint" })
@Column({ type: "decimal", precision: 10, scale: 2 })
@Column({ type: "boolean" })
@Column({ type: "datetime" })
@Column({ type: "date" })
@Column({ type: "time" })
@Column({ type: "json" })
@Column({ type: "enum", enum: ["a", "b", "c"] })
```

---

## 🔑 Common Patterns

### Basic CRUD Controller

```typescript
@Controller("/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@Query() query: any) {
    return await this.userService.findAll(query);
  }

  @Get("/:id")
  async findOne(@Param("id") id: string) {
    return await this.userService.findById(+id);
  }

  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }

  @Put("/:id")
  @UsePipes(ValidationPipe)
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return await this.userService.update(+id, dto);
  }

  @Delete("/:id")
  async remove(@Param("id") id: string) {
    return await this.userService.remove(+id);
  }
}
```

### Service with Repository

```typescript
@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll() {
    return await this.userRepository.find();
  }

  async findById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async create(dto: CreateUserDto) {
    const user = this.userRepository.create(dto);
    return await this.userRepository.save(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findById(id); // Check exists
    await this.userRepository.update({ id }, dto);
    return await this.findById(id);
  }

  async remove(id: number) {
    await this.findById(id); // Check exists
    await this.userRepository.delete({ id });
    return { message: "User deleted" };
  }
}
```

### Protected Routes

```typescript
@Controller("/api")
export class ApiController {
  // Public route
  @Get("/public")
  getPublic() {
    return { message: "Public data" };
  }

  // Protected route
  @Get("/protected")
  @UseGuards(JwtAuthGuard)
  getProtected(@Req() req: any) {
    return { user: req.user, message: "Protected data" };
  }

  // Admin only
  @Get("/admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  getAdmin() {
    return { message: "Admin data" };
  }
}
```

---

## 🚀 Application Bootstrap

### Basic Setup

```typescript
import { FynixFactory } from "@fynixjs/fynix";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();
  await app.listen(3000);
}

bootstrap();
```

### With Database

```typescript
import { FynixFactory, DatabaseService } from "@fynixjs/fynix";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();

  const db = app.get(DatabaseService);
  await db.connect({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "mydb",
  });

  await app.listen(3000);
}
```

### Global Middleware

```typescript
const app = await FynixFactory.create(AppModule);
await app.init();

// Global pipes
app.useGlobalPipes(new ValidationPipe());

// Global guards
app.useGlobalGuards(new RateLimitGuard());

// Global interceptors
app.useGlobalInterceptors(new LoggingInterceptor());

await app.listen(3000);
```

---

## 🗄️ Database Operations

### Using BaseEntity (Active Record)

```typescript
// Create
const user = new User();
user.name = "John";
user.email = "john@example.com";
await user.save();

// Find
const users = await User.find();
const user = await User.findOne({ where: { id: 1 } });
const user = await User.findById(1);

// Update
user.name = "Jane";
await user.save();

// Delete
await user.remove();
await User.delete({ id: 1 });
```

### Using Repository

```typescript
@Injectable()
export class UserRepository extends Repository<User> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string) {
    return await this.findOne({ where: { email } });
  }

  async findActive() {
    return await this.find({ where: { isActive: true } });
  }
}
```

### Query Builder

```typescript
const users = await User.createQueryBuilder()
  .select(["id", "name", "email"])
  .where("age > ?", [18])
  .andWhere("isActive = ?", [true])
  .orderBy("createdAt", "DESC")
  .limit(10)
  .offset(0)
  .execute();
```

---

## 🔐 Authentication Patterns

### JWT Auth Guard

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) return false;

    try {
      const payload = await this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch {
      return false;
    }
  }

  private extractToken(request: any): string | null {
    const auth = request.headers["authorization"];
    return auth?.startsWith("Bearer ") ? auth.substring(7) : null;
  }
}
```

### Login Endpoint

```typescript
@Controller("/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/login")
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return await this.authService.login(user);
  }

  @Get("/profile")
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return req.user;
  }
}
```

---

## 📊 HTTP Status Codes

```typescript
import { 
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException
} from "@fynixjs/fynix";

// Throw exceptions
throw new NotFoundException("User not found");
throw new BadRequestException("Invalid input");
throw new UnauthorizedException("Invalid token");
throw new ForbiddenException("Insufficient permissions");
throw new ConflictException("Email already exists");
throw new InternalServerErrorException("Server error");

// Custom status
@Get()
@HttpStatus(201)
create() {}
```

---

## ⚡ Performance Tips

```typescript
// 1. Use caching
@UseInterceptors(CacheInterceptor)
@Get("/expensive")
expensiveOperation() {}

// 2. Use pagination
@Get()
async findAll(@Query() query: PaginationDto) {
  return await this.service.paginate(query.page, query.limit);
}

// 3. Select specific columns
const users = await User.createQueryBuilder()
  .select(["id", "name", "email"]) // Don't select unnecessary data
  .execute();

// 4. Use indexes
@Entity("users")
export class User {
  @Column()
  @Index()
  email: string;
}

// 5. Use transactions for multiple operations
await this.db.transaction(async (manager) => {
  await manager.save(user);
  await manager.save(profile);
});
```

---

## 🔗 Useful Links

- [Getting Started](./00-GETTING_STARTED.md) - First steps
- [Migration Guide](./17-MIGRATION_GUIDE.md) - From Express/NestJS
- [Troubleshooting](./16-TROUBLESHOOTING.md) - Common issues
- [Best Practices](./13-BEST_PRACTICES.md) - Production patterns
- [Real-World Examples](./14-REAL_WORLD_EXAMPLES.md) - Complete apps

---

**Print this page for quick reference! 🖨️**
