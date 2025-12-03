# Security

FynixJS includes built-in security features: JWT authentication, password hashing, guards, and protection against common vulnerabilities.

---

## 📋 Table of Contents

- [Security Service](#security-service)
- [Password Hashing](#password-hashing)
- [JWT Authentication](#jwt-authentication)
- [Guards](#guards)
- [Security Best Practices](#security-best-practices)

---

## 🔐 Security Service

FynixJS includes a built-in `SecurityService` for common security operations.

### Setup

```typescript
import { SecurityService } from "@fynixjs/fynix";

@Injectable()
export class AuthService {
  constructor(private security: SecurityService) {
    // Configure security settings
    this.security.configure({
      jwtSecret: process.env.JWT_SECRET || "your-secret-key",
      saltRounds: 10,
    });
  }
}
```

---

## 🔒 Password Hashing

Use bcrypt for secure password hashing.

### Hash a Password

```typescript
import { Injectable, SecurityService } from "@fynixjs/fynix";

@Injectable()
export class AuthService {
  constructor(private security: SecurityService) {}

  async register(email: string, password: string) {
    // Hash the password
    const hashedPassword = await this.security.hashPassword(password);

    // Store in database
    await User.create({
      email,
      password: hashedPassword,
    });

    return { message: "User registered successfully" };
  }
}
```

### Verify a Password

```typescript
async login(email: string, password: string) {
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthorizedException("Invalid credentials");
  }

  // Compare password
  const isValid = await this.security.comparePassword(
    password,
    user.password
  );

  if (!isValid) {
    throw new UnauthorizedException("Invalid credentials");
  }

  // Generate JWT token
  const token = this.security.generateToken({
    userId: user.id,
    email: user.email
  });

  return { token };
}
```

---

## 🎫 JWT Authentication

### Generate JWT Tokens

```typescript
// Generate token with payload
const token = this.security.generateToken(
  { userId: user.id, email: user.email },
  "1h" // expires in 1 hour
);

// Different expiration times
const shortToken = this.security.generateToken({ userId: 1 }, "15m");
const longToken = this.security.generateToken({ userId: 1 }, "7d");
```

### Verify JWT Tokens

```typescript
try {
  const decoded = this.security.verifyToken(token);
  console.log(decoded); // { userId: 1, email: "...", iat: ..., exp: ... }
} catch (error) {
  throw new UnauthorizedException("Invalid token");
}
```

### Decode Without Verification

```typescript
// Decode without verifying signature (use carefully!)
const decoded = this.security.decodeToken(token);
```

---

## 🛡️ Guards

Guards determine whether a request should be handled.

### Built-in JWT Auth Guard

```typescript
import { Controller, Get, UseGuards, JwtAuthGuard } from "@fynixjs/fynix";

@Controller("/profile")
export class ProfileController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    // req.user is populated by JwtAuthGuard
    return {
      user: req.user,
    };
  }
}
```

### How JwtAuthGuard Works

```typescript
// Internal implementation
export class JwtAuthGuard implements CanActivate {
  constructor(private security: SecurityService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("No token provided");
    }

    const token = authHeader.substring(7);

    try {
      const decoded = this.security.verifyToken(token);
      request.user = decoded; // Attach user to request
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
```

### Custom Guards

Create your own guards:

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@fynixjs/fynix";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== "admin") {
      throw new ForbiddenException("Admin access required");
    }

    return true;
  }
}

// Usage
@Controller("/admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  @Get("/users")
  getAllUsers() {
    return { users: [] };
  }
}
```

### Role-Based Guard

```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private allowedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}

// Usage
@Get("/sensitive-data")
@UseGuards(new RoleGuard(["admin", "moderator"]))
getSensitiveData() {
  return { data: "secret" };
}
```

---

## 🔍 Input Validation & Sanitization

### Validate Email

```typescript
if (!this.security.isValidEmail(email)) {
  throw new BadRequestException("Invalid email format");
}
```

### Validate Strong Password

```typescript
const validation = this.security.isStrongPassword(password);
if (!validation.valid) {
  throw new BadRequestException(validation.message);
}
```

### Sanitize Input (XSS Prevention)

```typescript
const cleanInput = this.security.sanitizeInput(userInput);
```

---

## 🔐 Complete Authentication Example

### Auth Service

```typescript
import {
  Injectable,
  SecurityService,
  UnauthorizedException,
  BadRequestException,
} from "@fynixjs/fynix";
import { User } from "./user.entity";

@Injectable()
export class AuthService {
  constructor(private security: SecurityService) {
    this.security.configure({
      jwtSecret: process.env.JWT_SECRET,
      saltRounds: 10,
    });
  }

  async register(email: string, password: string, name: string) {
    // Validate email
    if (!this.security.isValidEmail(email)) {
      throw new BadRequestException("Invalid email format");
    }

    // Validate password strength
    const passwordCheck = this.security.isStrongPassword(password);
    if (!passwordCheck.valid) {
      throw new BadRequestException(passwordCheck.message);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestException("User already exists");
    }

    // Hash password
    const hashedPassword = await this.security.hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    // Generate token
    const token = this.security.generateToken({
      userId: user.id,
      email: user.email,
    });

    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await User.findOne({ email });
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
      role: user.role,
    });

    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async verifyToken(token: string) {
    try {
      return this.security.verifyToken(token);
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
```

### Auth Controller

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  JwtAuthGuard,
  Req,
} from "@fynixjs/fynix";
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

  @Get("/me")
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return { user: req.user };
  }
}
```

### Protected Routes

```typescript
@Controller("/api/users")
@UseGuards(JwtAuthGuard) // All routes require authentication
export class UserController {
  @Get()
  async findAll() {
    return await User.findAll();
  }

  @Get("/:id")
  async findOne(@Param("id") id: string) {
    return await User.findById(parseInt(id));
  }

  @Delete("/:id")
  @UseGuards(AdminGuard) // Additional admin guard
  async remove(@Param("id") id: string) {
    await User.remove({ id: parseInt(id) });
    return { message: "User deleted" };
  }
}
```

---

## ✅ Security Best Practices

### 1. Always Hash Passwords

```typescript
// ✅ Good
const hashedPassword = await this.security.hashPassword(password);

// ❌ Bad - never store plain text passwords
await User.create({ email, password });
```

### 2. Use Environment Variables for Secrets

```typescript
// ✅ Good
this.security.configure({
  jwtSecret: process.env.JWT_SECRET,
});

// ❌ Bad - hardcoded secrets
this.security.configure({
  jwtSecret: "my-secret-key",
});
```

### 3. Validate All Input

```typescript
// ✅ Good
if (!this.security.isValidEmail(email)) {
  throw new BadRequestException("Invalid email");
}

// ❌ Bad - no validation
await User.create({ email });
```

### 4. Use HTTPS in Production

```typescript
// Always use HTTPS for JWT tokens
// Set secure cookies
// Enable CORS properly
```

### 5. Implement Rate Limiting

```typescript
import { UseInterceptors, RateLimitInterceptor } from "@fynixjs/fynix";

@Controller("/auth")
@UseInterceptors(new RateLimitInterceptor({ maxRequests: 5, windowMs: 60000 }))
export class AuthController {
  // Limited to 5 requests per minute
}
```

### 6. Set Token Expiration

```typescript
// ✅ Good - short-lived tokens
const token = this.security.generateToken(payload, "1h");

// ❌ Bad - tokens that never expire
const token = this.security.generateToken(payload);
```

### 7. Don't Expose Sensitive Data

```typescript
// ✅ Good
return { id: user.id, email: user.email, name: user.name };

// ❌ Bad
return user; // Includes password hash!
```

---

## 📚 Next Steps

- [Guards & Interceptors](./07-GUARDS_INTERCEPTORS.md)
- [Examples](./10-EXAMPLES.md)
- [API Reference](./09-API_REFERENCE.md)

---

**Build secure applications with FynixJS built-in security features!**
