# Security Guide

RestJS comes with **built-in security features** that require zero installation. This guide shows you how to secure your API.

## Table of Contents

1. [JWT Authentication](#jwt-authentication)
2. [Password Security](#password-security)
3. [Route Protection](#route-protection)
4. [CORS Configuration](#cors-configuration)
5. [Security Headers](#security-headers)
6. [Rate Limiting](#rate-limiting)
7. [Input Validation](#input-validation)
8. [Best Practices](#best-practices)

---

## JWT Authentication

RestJS has built-in JWT support with `SecurityService`.

### Step 1: Configure Security Service

```typescript
// main.ts
import "reflect-metadata";
import { RestFactory, Module, SecurityService, DatabaseService } from "./index";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  providers: [SecurityService, DatabaseService],
})
class AppModule {}

async function bootstrap() {
  const app = await RestFactory.create(AppModule);
  await app.init();

  // Configure JWT
  const security = app.get<SecurityService>(SecurityService);
  security.configure({
    jwtSecret: process.env.JWT_SECRET || "your-super-secret-key",
    jwtExpiration: "24h", // Token expires in 24 hours
  });

  await app.listen(3000);
  console.log("🚀 Server running on http://localhost:3000");
}

bootstrap();
```

### Step 2: Create Auth Service

```typescript
// auth.service.ts
import {
  Injectable,
  SecurityService,
  UnauthorizedException,
  BadRequestException,
} from "./index";
import { UsersRepository } from "./users.repository";

@Injectable()
export class AuthService {
  constructor(
    private security: SecurityService,
    private usersRepo: UsersRepository
  ) {}

  async register(email: string, password: string, name: string) {
    // Validate email format
    if (!this.security.isValidEmail(email)) {
      throw new BadRequestException("Invalid email format");
    }

    // Validate password strength
    if (!this.security.isStrongPassword(password)) {
      throw new BadRequestException(
        "Password must be at least 8 characters with uppercase, lowercase, and number"
      );
    }

    // Check if user exists
    const existing = await this.usersRepo.findByEmail(email);
    if (existing) {
      throw new BadRequestException("Email already registered");
    }

    // Hash password
    const hashedPassword = await this.security.hashPassword(password);

    // Create user
    const user = await this.usersRepo.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = this.security.generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.usersRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isValid = await this.security.comparePassword(
      password,
      user.password
    );
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate token
    const token = this.security.generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    };
  }

  async verifyToken(token: string) {
    return this.security.verifyToken(token);
  }
}
```

### Step 3: Create Auth Controller

```typescript
// auth.controller.ts
import { Controller, Post, Body } from "./index";
import { AuthService } from "./auth.service";

@Controller("/auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("/register")
  async register(
    @Body() body: { email: string; password: string; name: string }
  ) {
    return await this.authService.register(
      body.email,
      body.password,
      body.name
    );
  }

  @Post("/login")
  async login(@Body() body: { email: string; password: string }) {
    return await this.authService.login(body.email, body.password);
  }
}
```

---

## Password Security

RestJS uses `bcrypt` for secure password hashing.

### Hashing Passwords

```typescript
import { SecurityService } from "./index";

const security = new SecurityService();

// Hash password (auto-generates salt)
const hashed = await security.hashPassword("myPassword123");
// Result: $2b$10$...
```

### Comparing Passwords

```typescript
// Compare plain text password with hash
const isValid = await security.comparePassword("myPassword123", hashed);
// Result: true
```

### Password Validation

```typescript
// Check password strength
const isStrong = security.isStrongPassword("Weak");
// Result: false (too short)

const isStrong = security.isStrongPassword("MySecure123");
// Result: true
```

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

## Route Protection

Use `JwtAuthGuard` to protect routes.

### Step 1: Apply Guard to Routes

```typescript
// users.controller.ts
import { Controller, Get, UseGuards, JwtAuthGuard, Req } from "./index";

@Controller("/users")
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class UsersController {
  @Get("/profile")
  getProfile(@Req() req: any) {
    // req.user contains decoded JWT payload
    return {
      user: req.user,
      message: "This is a protected route",
    };
  }

  @Get("/public")
  @UseGuards() // Override: make this route public
  getPublicData() {
    return { message: "This route is public" };
  }
}
```

### Step 2: Protect Specific Routes

```typescript
@Controller("/posts")
export class PostsController {
  @Get() // Public route
  getAllPosts() {
    return { posts: [] };
  }

  @Post()
  @UseGuards(JwtAuthGuard) // Only this route is protected
  createPost(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;
    return { message: "Post created", userId };
  }
}
```

### How to Send JWT Token

**Authorization Header:**

```bash
curl http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example:**

```javascript
fetch("http://localhost:3000/users/profile", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## CORS Configuration

Enable Cross-Origin Resource Sharing for your API.

```typescript
// main.ts
import { RestFactory, Module, CorsInterceptor } from "./index";

@Module({
  // ... your modules
})
class AppModule {}

async function bootstrap() {
  const app = await RestFactory.create(AppModule);

  // Configure CORS
  const corsInterceptor = new CorsInterceptor();
  corsInterceptor.configure({
    origin: "https://yourfrontend.com", // or "*" for all origins
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  app.useGlobalInterceptors(corsInterceptor);

  await app.listen(3000);
}

bootstrap();
```

**CORS Options:**

- `origin`: Allowed origins (`"*"` or specific domain)
- `methods`: Allowed HTTP methods
- `allowedHeaders`: Allowed request headers
- `credentials`: Allow cookies/credentials

---

## Security Headers

Add security headers automatically.

```typescript
// main.ts
import { RestFactory, Module, SecurityHeadersInterceptor } from "./index";

@Module({
  // ... your modules
})
class AppModule {}

async function bootstrap() {
  const app = await RestFactory.create(AppModule);

  // Add security headers
  app.useGlobalInterceptors(new SecurityHeadersInterceptor());

  await app.listen(3000);
}

bootstrap();
```

**Headers Added:**

- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-XSS-Protection: 1; mode=block` - Enable XSS filter
- `Strict-Transport-Security` - Force HTTPS
- `Content-Security-Policy` - Restrict resource loading
- `Referrer-Policy: no-referrer` - Hide referrer

---

## Rate Limiting

Prevent abuse with built-in rate limiting.

```typescript
// main.ts
import { RestFactory, Module, RateLimitInterceptor } from "./index";

@Module({
  // ... your modules
})
class AppModule {}

async function bootstrap() {
  const app = await RestFactory.create(AppModule);

  // Configure rate limiting
  const rateLimiter = new RateLimitInterceptor();
  rateLimiter.configure({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
  });

  app.useGlobalInterceptors(rateLimiter);

  await app.listen(3000);
}

bootstrap();
```

**Configuration:**

- `windowMs`: Time window in milliseconds
- `maxRequests`: Maximum requests per IP per window

When limit is exceeded, returns:

```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later"
}
```

---

## Input Validation

### Sanitize User Input

```typescript
import { SecurityService } from "./index";

const security = new SecurityService();

// Remove dangerous characters
const clean = security.sanitizeInput("<script>alert('xss')</script>");
// Result: "scriptalert('xss')/script"
```

### Email Validation

```typescript
const isValid = security.isValidEmail("test@example.com");
// Result: true

const isValid = security.isValidEmail("invalid-email");
// Result: false
```

### Create Validation Pipe

```typescript
// validation.pipe.ts
import { PipeTransform, BadRequestException } from "./index";

export class EmailValidationPipe implements PipeTransform {
  transform(value: any) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new BadRequestException("Invalid email format");
    }
    return value;
  }
}

// Usage in controller
@Post("/send-email")
sendEmail(@Body('email', EmailValidationPipe) email: string) {
  return { message: `Email sent to ${email}` };
}
```

---

## Best Practices

### 1. Environment Variables

Store secrets in `.env` file:

```bash
# .env
JWT_SECRET=your-super-secret-key-change-this-in-production
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=myapp
```

Load in application:

```typescript
import "dotenv/config";

security.configure({
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiration: "24h",
});
```

### 2. Never Store Plain Text Passwords

❌ **Bad:**

```typescript
await usersRepo.create({
  email: "user@example.com",
  password: "plaintext123", // DON'T DO THIS!
});
```

✅ **Good:**

```typescript
const hashedPassword = await security.hashPassword("plaintext123");
await usersRepo.create({
  email: "user@example.com",
  password: hashedPassword,
});
```

### 3. Validate All Input

```typescript
@Post("/register")
async register(@Body() body: any) {
  // Sanitize input
  const email = this.security.sanitizeInput(body.email);
  const name = this.security.sanitizeInput(body.name);

  // Validate
  if (!this.security.isValidEmail(email)) {
    throw new BadRequestException("Invalid email");
  }

  if (!this.security.isStrongPassword(body.password)) {
    throw new BadRequestException("Weak password");
  }

  // ... proceed
}
```

### 4. Use HTTPS in Production

```typescript
// production.ts
import * as https from "https";
import * as fs from "fs";

const httpsOptions = {
  key: fs.readFileSync("./ssl/private-key.pem"),
  cert: fs.readFileSync("./ssl/certificate.pem"),
};

const server = https.createServer(httpsOptions, app.getHttpAdapter());
server.listen(443);
```

### 5. Limit JWT Token Lifetime

```typescript
security.configure({
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiration: "1h", // Short lifetime
});

// Implement refresh tokens for longer sessions
```

### 6. Hide Sensitive Error Details

❌ **Bad:**

```typescript
throw new Error(`Database query failed: ${sql}`);
// Exposes internal implementation
```

✅ **Good:**

```typescript
throw new InternalServerErrorException("Failed to process request");
// Generic message for users
```

### 7. Global Security Setup

```typescript
// main.ts - Complete security setup
async function bootstrap() {
  const app = await RestFactory.create(AppModule);
  await app.init();

  // 1. Configure JWT
  const security = app.get<SecurityService>(SecurityService);
  security.configure({
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiration: "24h",
  });

  // 2. Enable CORS
  const cors = new CorsInterceptor();
  cors.configure({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  });

  // 3. Add security headers
  const securityHeaders = new SecurityHeadersInterceptor();

  // 4. Rate limiting
  const rateLimiter = new RateLimitInterceptor();
  rateLimiter.configure({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  });

  app.useGlobalInterceptors(cors, securityHeaders, rateLimiter);

  await app.listen(3000);
}
```

---

## Security Checklist

- ✅ Use environment variables for secrets
- ✅ Hash passwords with bcrypt
- ✅ Validate password strength
- ✅ Protect routes with JWT guards
- ✅ Enable CORS properly
- ✅ Add security headers
- ✅ Implement rate limiting
- ✅ Sanitize user input
- ✅ Validate email format
- ✅ Use HTTPS in production
- ✅ Short JWT token lifetime
- ✅ Hide error details from users

---

## Next Steps

- **[ORM Guide](./ORM_GUIDE.md)** - Learn database security
- **[Deployment Guide](./DEPLOYMENT.md)** - Secure production deployment
- **[API Reference](./API_REFERENCE.md)** - Full security API reference

Your API is now secure! 🔒
