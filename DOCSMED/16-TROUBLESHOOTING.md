# 16 - Troubleshooting

## 🆘 Common Issues & Solutions

This guide covers common errors, debugging techniques, and solutions for FynixJS development.

---

## 🔧 Installation & Setup Issues

### Issue: "experimentalDecorators" Error

**Error:**

```
Error: Cannot use decorators without enabling experimentalDecorators
```

**Solution:**

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Issue: Module Not Found

**Error:**

```
Error: Cannot find module '@fynixjs/fynix'
```

**Solutions:**

1. **Check installation:**

```bash
npm list @fynixjs/fynix
```

2. **Reinstall:**

```bash
npm uninstall @fynixjs/fynix
npm install @fynixjs/fynix
```

3. **Clear cache:**

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript Version Mismatch

**Error:**

```
Error: TypeScript version X.X.X is not compatible
```

**Solution:**

```bash
npm install -D typescript@^5.0.0
```

---

## 🎮 Controller & Routing Issues

### Issue: Routes Not Found (404)

**Problem:** API endpoint returns 404

**Checklist:**

1. **Controller registered in module?**

```typescript
@Module({
  controllers: [UserController], // ✅ Must be here
})
export class AppModule {}
```

2. **Correct path?**

```typescript
@Controller("/api") // Base path
export class ApiController {
  @Get("/users") // Full path: /api/users
  getUsers() {}
}
```

3. **Server running?**

```bash
# Check if server started
🚀 Server running on http://localhost:3000
```

### Issue: Route Parameter Not Working

**Problem:** `@Param()` returns undefined

**Wrong:**

```typescript
@Get("/users/:userId")
getUser(@Param("id") id: string) {} // ❌ Wrong parameter name
```

**Correct:**

```typescript
@Get("/users/:userId")
getUser(@Param("userId") id: string) {} // ✅ Matches route
```

### Issue: Body is Undefined

**Problem:** `@Body()` returns undefined

**Solutions:**

1. **Check Content-Type header:**

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'
```

2. **Use ValidationPipe:**

```typescript
@Post()
@UsePipes(ValidationPipe)
create(@Body() dto: CreateUserDto) {
  console.log(dto); // Should have data
}
```

---

## 💉 Dependency Injection Issues

### Issue: "No provider for X"

**Error:**

```
Error: No provider for UserService
```

**Solution:**

Register in module:

```typescript
@Module({
  providers: [UserService], // ✅ Add here
  controllers: [UserController],
})
export class UserModule {}
```

### Issue: Circular Dependency

**Error:**

```
Error: Circular dependency detected
```

**Problem:**

```typescript
// user.service.ts
@Injectable()
class UserService {
  constructor(private postService: PostService) {} // Depends on PostService
}

// post.service.ts
@Injectable()
class PostService {
  constructor(private userService: UserService) {} // Depends on UserService
}
```

**Solution:**

Use forwardRef or restructure:

```typescript
// Restructure: Extract shared logic to a third service
@Injectable()
class SharedService {
  // Shared logic here
}

@Injectable()
class UserService {
  constructor(private sharedService: SharedService) {}
}

@Injectable()
class PostService {
  constructor(private sharedService: SharedService) {}
}
```

### Issue: Injectable Decorator Missing

**Error:**

```
Error: Cannot inject UserService
```

**Wrong:**

```typescript
export class UserService {} // ❌ Missing decorator
```

**Correct:**

```typescript
@Injectable()
export class UserService {} // ✅ Has decorator
```

---

## 🗄️ Database Issues

### Issue: Database Connection Failed

**Error:**

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Checklist:**

1. **MySQL running?**

```bash
# Windows
net start MySQL80

# Linux/Mac
sudo systemctl start mysql
```

2. **Correct credentials?**

```typescript
await db.connect({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "your_password", // ✅ Check this
  database: "your_database", // ✅ Check this
});
```

3. **Database exists?**

```sql
CREATE DATABASE your_database;
```

### Issue: Table Doesn't Exist

**Error:**

```
Error: Table 'mydb.users' doesn't exist
```

**Solutions:**

1. **Enable auto-sync (development only):**

```typescript
await db.synchronize(); // Creates tables automatically
```

2. **Create table manually:**

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE
);
```

### Issue: Column Not Found

**Error:**

```
Error: Unknown column 'age' in 'field list'
```

**Solution:**

Update entity and re-sync:

```typescript
@Entity("users")
export class User extends BaseEntity {
  @Column()
  age: number; // ✅ Add new column
}

// Then run
await db.synchronize();
```

### Issue: Foreign Key Constraint Failed

**Error:**

```
Error: Cannot add or update a child row: a foreign key constraint fails
```

**Solution:**

Ensure parent record exists:

```typescript
// Wrong
const post = new Post();
post.authorId = 999; // ❌ User 999 doesn't exist
await post.save();

// Correct
const user = await User.findById(1);
if (!user) throw new Error("User not found");

const post = new Post();
post.authorId = user.id; // ✅ User exists
await post.save();
```

---

## 🔐 Authentication Issues

### Issue: JWT Token Invalid

**Error:**

```
Error: JsonWebTokenError: invalid token
```

**Solutions:**

1. **Check token format:**

```typescript
// Correct format
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. **Verify secret key:**

```typescript
const token = jwt.sign(payload, "same-secret-key");
const decoded = jwt.verify(token, "same-secret-key"); // ✅ Must match
```

3. **Check expiration:**

```typescript
const token = jwt.sign(payload, secret, { expiresIn: "1h" });
// Token expires after 1 hour
```

### Issue: Password Hash Not Working

**Problem:** bcrypt.compare() always returns false

**Solution:**

Hash password before saving:

```typescript
import * as bcrypt from "bcrypt";

// When creating user
const hashedPassword = await bcrypt.hash(password, 10);
user.password = hashedPassword;

// When verifying
const isValid = await bcrypt.compare(plainPassword, user.password);
```

---

## ✅ Validation Issues

### Issue: Validation Not Running

**Problem:** Invalid data passes through

**Solution:**

Use ValidationPipe:

```typescript
// Method-level
@Post()
@UsePipes(ValidationPipe)
create(@Body() dto: CreateUserDto) {}

// Or global
app.useGlobalPipes(new ValidationPipe());
```

### Issue: Validation Always Fails

**Problem:** All requests return 400

**Check:**

1. **DTO has decorators:**

```typescript
export class CreateUserDto {
  @IsString() // ✅ Has decorator
  @IsNotEmpty() // ✅ Has decorator
  name: string;
}
```

2. **Request body matches DTO:**

```json
{
  "name": "John" // ✅ Matches DTO property
}
```

---

## 🚀 Performance Issues

### Issue: Slow Response Times

**Solutions:**

1. **Add database indexes:**

```typescript
@Entity("users")
export class User {
  @Column()
  @Index() // ✅ Add index
  email: string;
}
```

2. **Use select to limit columns:**

```typescript
// Slow
const users = await User.find(); // Gets all columns

// Fast
const users = await User.createQueryBuilder()
  .select(["id", "name", "email"]) // Only needed columns
  .execute();
```

3. **Add caching:**

```typescript
@UseInterceptors(CacheInterceptor)
@Get()
expensiveOperation() {}
```

4. **Use pagination:**

```typescript
@Get()
async findAll(@Query("page") page: number, @Query("limit") limit: number) {
  return await this.service.paginate(page, limit);
}
```

### Issue: Memory Leak

**Problem:** Memory usage keeps growing

**Solutions:**

1. **Close database connections:**

```typescript
process.on("SIGINT", async () => {
  await db.close();
  process.exit(0);
});
```

2. **Don't store large objects in memory:**

```typescript
// Bad
const cache = {}; // ❌ Grows forever

// Good
const cache = new Map();
if (cache.size > 1000) {
  cache.clear(); // ✅ Clear periodically
}
```

---

## 🔥 Hot Reload Issues

### Issue: Changes Not Detected

**Problem:** Server doesn't restart on file changes

**Solution:**

1. **Use ts-node-dev:**

```bash
npm install -D ts-node-dev
```

2. **Update package.json:**

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/main.ts"
  }
}
```

3. **Check file watching:**

```bash
# Make sure no errors in console
npm run dev
```

---

## 🐛 Debugging Techniques

### Enable Debug Logging

```typescript
// main.ts
async function bootstrap() {
  const app = await FynixFactory.create(AppModule, {
    logger: true, // ✅ Enable logging
  });

  await app.init();
  await app.listen(3000);
}
```

### Add Request Logging

```typescript
@Injectable()
export class LoggingInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    console.log(`[${req.method}] ${req.url}`);
    console.log("Body:", req.body);
    console.log("Query:", req.query);

    const result = await next.handle();
    console.log("Response:", result);
    return result;
  }
}

// Use globally
app.useGlobalInterceptors(new LoggingInterceptor());
```

### Debug SQL Queries

```typescript
// Enable query logging
await db.connect({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "mydb",
  debug: true, // ✅ Logs all SQL queries
});
```

### VS Code Debugging

**`.vscode/launch.json`:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug FynixJS",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/main.ts"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

---

## 🌐 Port & Network Issues

### Issue: Port Already in Use

**Error:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. **Use different port:**

```typescript
await app.listen(4000); // Different port
```

2. **Kill process on port (Windows):**

```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

3. **Kill process on port (Linux/Mac):**

```bash
lsof -i :3000
kill -9 <PID>
```

### Issue: CORS Errors

**Error:**

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**

Enable CORS:

```typescript
@UseInterceptors(CorsInterceptor)
@Controller("/api")
export class ApiController {}

// Or custom CORS
@Injectable()
export class CustomCorsInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const response = context.switchToHttp().getResponse();
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization"
    );
    return await next.handle();
  }
}
```

---

## 📦 Production Issues

### Issue: Environment Variables Not Working

**Problem:** process.env.VAR is undefined

**Solution:**

1. **Create .env file:**

```env
DB_HOST=localhost
DB_PORT=3306
JWT_SECRET=your-secret-key
```

2. **Load environment variables:**

```bash
npm install dotenv
```

```typescript
// main.ts
import * as dotenv from "dotenv";
dotenv.config();

async function bootstrap() {
  console.log("DB_HOST:", process.env.DB_HOST); // Check loaded
  // ...
}
```

### Issue: Build Errors

**Error:**

```
Error: Cannot find module after build
```

**Solution:**

1. **Check tsconfig.json:**

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

2. **Build and run:**

```bash
npm run build
node dist/main.js
```

---

## ❓ Still Stuck?

### General Debugging Steps

1. **Check console for errors** - Read the full error message
2. **Verify imports** - Make sure all imports are correct
3. **Check decorators** - Ensure @Injectable(), @Controller(), etc. are present
4. **Restart server** - Sometimes a fresh start helps
5. **Clear cache** - `rm -rf node_modules && npm install`
6. **Check TypeScript** - Run `npx tsc --noEmit` to check for type errors

### Get Help

- **Read error message carefully** - It usually tells you what's wrong
- **Check documentation** - Review relevant docs sections
- **Search GitHub issues** - Someone may have had the same problem
- **Ask for help** - Open a GitHub issue with:
  - Error message
  - Code snippet
  - Steps to reproduce
  - Environment (Node version, OS, etc.)

---

## 🔗 Related Resources

- [Getting Started](./00-GETTING_STARTED.md) - Setup guide
- [Quick Reference](./15-QUICK_REFERENCE.md) - API cheat sheet
- [Best Practices](./13-BEST_PRACTICES.md) - Avoid common pitfalls
- [Real-World Examples](./14-REAL_WORLD_EXAMPLES.md) - Working code samples

---

**Remember: Most issues are configuration or syntax errors. Check the basics first! 🔍**
