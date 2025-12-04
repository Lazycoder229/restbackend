# 06 - Security & Authentication

## 📋 Table of Contents

- [Security Overview](#security-overview)
- [JWT Authentication](#jwt-authentication)
- [Password Hashing](#password-hashing)
- [Security Headers](#security-headers)
- [CSRF Protection](#csrf-protection)
- [XSS Prevention](#xss-prevention)
- [Rate Limiting](#rate-limiting)
- [API Key Authentication](#api-key-authentication)
- [Role-Based Access Control](#role-based-access-control)
- [OAuth Integration](#oauth-integration)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)

---

## 🔐 Security Overview

FynixJS includes built-in security features:

- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ Security headers (Helmet-like)
- ✅ CSRF protection
- ✅ XSS prevention
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection prevention

---

## 🎫 JWT Authentication

### Setup JWT

```typescript
import { SecurityService, JwtAuthGuard } from "@fynixjs/fynix";

@Injectable()
export class AuthService {
  constructor(private security: SecurityService) {}

  async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await this.security.comparePassword(
      password,
      user.password
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate JWT token
    const token = this.security.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { token, user: { id: user.id, email: user.email } };
  }

  async register(email: string, password: string, name: string) {
    // Hash password
    const hashedPassword = await this.security.hashPassword(password);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    const token = this.security.generateToken({
      id: user.id,
      email: user.email,
    });

    return { token, user };
  }
}
```

### Protecting Routes

```typescript
@Controller("/api/users")
export class UserController {
  constructor(private userService: UserService) {}

  // Public route
  @Post("/login")
  async login(@Body() body: LoginDto) {
    return await this.userService.login(body.email, body.password);
  }

  // Protected route
  @Get("/profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    // req.user contains decoded JWT payload
    const userId = req.user.id;
    return await this.userService.findById(userId);
  }

  // Protected route with role check
  @Get("/admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async adminPanel() {
    return { message: "Admin access granted" };
  }
}
```

### Custom JWT Guard

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private security: SecurityService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const decoded = this.security.verifyToken(token);
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
```

---

## 🔒 Password Hashing

### Hash and Compare

```typescript
import { SecurityService } from "@fynixjs/fynix";

@Injectable()
export class UserService {
  constructor(private security: SecurityService) {}

  async createUser(email: string, password: string) {
    // Hash password with bcrypt
    const hashedPassword = await this.security.hashPassword(password);

    return await User.create({
      email,
      password: hashedPassword,
    });
  }

  async validatePassword(plainPassword: string, hashedPassword: string) {
    return await this.security.comparePassword(plainPassword, hashedPassword);
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException();

    // Verify old password
    const isValid = await this.security.comparePassword(
      oldPassword,
      user.password
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid old password");
    }

    // Hash and save new password
    user.password = await this.security.hashPassword(newPassword);
    await user.save();

    return { message: "Password changed successfully" };
  }
}
```

### Password Validation

```typescript
export class PasswordValidator {
  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain number');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Usage
@Post('/register')
async register(@Body() body: RegisterDto) {
  const validation = PasswordValidator.validate(body.password);

  if (!validation.valid) {
    throw new BadRequestException(validation.errors.join(', '));
  }

  return await this.authService.register(body);
}
```

---

## 🛡️ Security Headers

### Using SecurityHeadersInterceptor

```typescript
import { SecurityHeadersInterceptor } from "@fynixjs/fynix";

// Global security headers
async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();

  app.useGlobalInterceptors(new SecurityHeadersInterceptor());

  await app.listen(3000);
}

// Or on specific routes
@Controller("/api")
@UseInterceptors(new SecurityHeadersInterceptor())
export class ApiController {}
```

### Custom Security Headers

```typescript
@Injectable()
export class CustomSecurityInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const response = context.switchToHttp().getResponse();

    // Security headers
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("X-XSS-Protection", "1; mode=block");
    response.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    response.setHeader("Content-Security-Policy", "default-src 'self'");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Permissions-Policy", "geolocation=(), microphone=()");

    return await next.handle();
  }
}
```

---

## 🔐 CSRF Protection

### CSRF Token Generation

```typescript
import { CsrfInterceptor } from "@fynixjs/fynix";

@Controller("/api")
@UseInterceptors(new CsrfInterceptor())
export class ApiController {
  @Get("/csrf-token")
  getCsrfToken(@Req() req: any) {
    return { csrfToken: req.csrfToken };
  }

  @Post("/sensitive-action")
  async sensitiveAction(
    @Body() body: any,
    @Headers("x-csrf-token") csrfToken: string
  ) {
    // CSRF token validated by interceptor
    return { message: "Action completed" };
  }
}
```

---

## 🚫 XSS Prevention

### Input Sanitization

```typescript
import { SanitizationPipe } from "@fynixjs/fynix";

export class CreatePostDto {
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value))
  title: string;

  @IsString()
  @Transform(({ value }) => sanitizeHtml(value))
  content: string;
}

@Controller("/posts")
export class PostController {
  @Post()
  @UsePipes(new SanitizationPipe())
  async create(@Body() dto: CreatePostDto) {
    // Input is sanitized
    return await this.postService.create(dto);
  }
}
```

### Custom Sanitization

```typescript
export class XssSanitizer {
  static sanitize(input: string): string {
    return input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  static sanitizeObject(obj: any): any {
    if (typeof obj === "string") {
      return this.sanitize(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (typeof obj === "object" && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      }
      return sanitized;
    }

    return obj;
  }
}
```

---

## ⏱️ Rate Limiting

### Basic Rate Limiting

```typescript
import { RateLimitInterceptor } from "@fynixjs/fynix";

// Global rate limiting
app.useGlobalInterceptors(
  new RateLimitInterceptor({
    maxRequests: 100,
    windowMs: 60000, // 100 requests per minute
  })
);

// Route-specific rate limiting
@Controller("/auth")
export class AuthController {
  @Post("/login")
  @UseInterceptors(
    new RateLimitInterceptor({
      maxRequests: 5,
      windowMs: 60000, // 5 attempts per minute
    })
  )
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body);
  }
}
```

### Advanced Rate Limiting

```typescript
@Injectable()
export class AdvancedRateLimitInterceptor implements FynixInterceptor {
  private requests = new Map<string, { count: number; resetAt: number }>();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Use IP or user ID as key
    const key = request.user?.id || request.ip;
    const now = Date.now();

    let record = this.requests.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + 60000 };
      this.requests.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    response.setHeader("X-RateLimit-Limit", "100");
    response.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, 100 - record.count)
    );
    response.setHeader("X-RateLimit-Reset", record.resetAt);

    if (record.count > 100) {
      throw new TooManyRequestsException("Rate limit exceeded");
    }

    return await next.handle();
  }
}
```

---

## 🔑 API Key Authentication

### API Key Guard

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private validApiKeys = new Set(["sk_live_123456789", "sk_test_987654321"]);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];

    if (!apiKey) {
      throw new UnauthorizedException("API key required");
    }

    if (!this.validApiKeys.has(apiKey)) {
      throw new UnauthorizedException("Invalid API key");
    }

    return true;
  }
}

// Usage
@Controller("/api/external")
@UseGuards(ApiKeyGuard)
export class ExternalApiController {
  @Get("/data")
  getData() {
    return { data: "Protected data" };
  }
}
```

### Database-Backed API Keys

```typescript
@Entity("api_keys")
export class ApiKey extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  userId: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "datetime", nullable: true })
  expiresAt: Date;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeyRepo: ApiKeyRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];

    if (!apiKey) {
      throw new UnauthorizedException("API key required");
    }

    const key = await this.apiKeyRepo.findOne({ where: { key: apiKey } });

    if (!key || !key.isActive) {
      throw new UnauthorizedException("Invalid API key");
    }

    if (key.expiresAt && new Date() > key.expiresAt) {
      throw new UnauthorizedException("API key expired");
    }

    request.apiKey = key;
    return true;
  }
}
```

---

## 👥 Role-Based Access Control

### Role Guard

```typescript
export class RolesGuard implements CanActivate {
  constructor(private allowedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("User not authenticated");
    }

    if (!this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}

// Usage
@Controller("/admin")
export class AdminController {
  @Get("/users")
  @UseGuards(JwtAuthGuard, new RolesGuard(["admin"]))
  getAllUsers() {
    return { users: [] };
  }

  @Get("/dashboard")
  @UseGuards(JwtAuthGuard, new RolesGuard(["admin", "moderator"]))
  getDashboard() {
    return { stats: {} };
  }
}
```

### Permission-Based Access

```typescript
@Entity("permissions")
export class Permission extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g., 'posts:create', 'users:delete'
}

@Entity("role_permissions")
export class RolePermission extends BaseEntity {
  @Column()
  roleId: number;

  @Column()
  permissionId: number;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private required: string[]) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    const userPermissions = await this.getUserPermissions(user.id);
    const hasPermission = this.required.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }

  private async getUserPermissions(userId: number): Promise<string[]> {
    // Query user's permissions from database
    return [];
  }
}

// Usage
@Controller("/posts")
export class PostController {
  @Post()
  @UseGuards(JwtAuthGuard, new PermissionGuard(["posts:create"]))
  async create(@Body() dto: CreatePostDto) {
    return await this.postService.create(dto);
  }

  @Delete("/:id")
  @UseGuards(JwtAuthGuard, new PermissionGuard(["posts:delete"]))
  async delete(@Param("id") id: string) {
    return await this.postService.delete(Number(id));
  }
}
```

---

## 🔗 OAuth Integration

### OAuth Service

```typescript
@Injectable()
export class OAuthService {
  async googleAuth(code: string) {
    // Exchange code for token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const { access_token } = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const googleUser = await userResponse.json();

    // Find or create user
    let user = await User.findOne({ where: { email: googleUser.email } });

    if (!user) {
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        provider: "google",
        providerId: googleUser.id,
      });
    }

    // Generate JWT
    const token = this.security.generateToken({
      id: user.id,
      email: user.email,
    });

    return { token, user };
  }
}

@Controller("/auth")
export class AuthController {
  constructor(private oauthService: OAuthService) {}

  @Get("/google")
  googleLogin() {
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&` +
      `response_type=code&` +
      `scope=email profile`;

    return { url };
  }

  @Get("/google/callback")
  async googleCallback(@Query("code") code: string) {
    return await this.oauthService.googleAuth(code);
  }
}
```

---

## ✅ Best Practices

### 1. Never Store Plain Passwords

```typescript
// ✅ Good
const hashedPassword = await this.security.hashPassword(password);
await User.create({ email, password: hashedPassword });

// ❌ Bad
await User.create({ email, password }); // Plain text!
```

### 2. Use HTTPS in Production

```typescript
// config/app.config.ts
export const config = {
  ssl: process.env.NODE_ENV === "production",
  forceHttps: true,
  secureHeaders: true,
};
```

### 3. Implement Token Refresh

```typescript
@Injectable()
export class AuthService {
  generateTokens(user: User) {
    const accessToken = this.security.generateToken(
      { id: user.id },
      { expiresIn: "15m" }
    );

    const refreshToken = this.security.generateToken(
      { id: user.id, type: "refresh" },
      { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.security.verifyToken(refreshToken);

      if (decoded.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const user = await User.findById(decoded.id);
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
}
```

### 4. Log Security Events

```typescript
@Injectable()
export class SecurityLogger {
  logLoginAttempt(email: string, success: boolean, ip: string) {
    console.log(
      `Login attempt: ${email} from ${ip} - ${success ? "SUCCESS" : "FAILED"}`
    );
  }

  logTokenRefresh(userId: number) {
    console.log(`Token refreshed for user ${userId}`);
  }

  logPasswordChange(userId: number) {
    console.log(`Password changed for user ${userId}`);
  }
}
```

### 5. Rate Limit Sensitive Endpoints

```typescript
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

  @Post("/forgot-password")
  @UseInterceptors(
    new RateLimitInterceptor({ maxRequests: 3, windowMs: 3600000 })
  )
  async forgotPassword() {}
}
```

---

## 🎯 Real-World Examples

### Complete Authentication System

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private security: SecurityService,
    private userRepo: UserRepository,
    private logger: SecurityLogger
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException("Email already registered");
    }

    const hashedPassword = await this.security.hashPassword(dto.password);

    const user = await this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: "user",
    });

    const { accessToken, refreshToken } = this.generateTokens(user);

    this.logger.logRegistration(user.email);

    return { accessToken, refreshToken, user };
  }

  async login(dto: LoginDto, ip: string) {
    const user = await this.userRepo.findByEmail(dto.email);

    if (!user) {
      this.logger.logLoginAttempt(dto.email, false, ip);
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await this.security.comparePassword(
      dto.password,
      user.password
    );

    if (!isValid) {
      this.logger.logLoginAttempt(dto.email, false, ip);
      throw new UnauthorizedException("Invalid credentials");
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    this.logger.logLoginAttempt(dto.email, true, ip);

    return { accessToken, refreshToken, user };
  }

  private generateTokens(user: User) {
    const accessToken = this.security.generateToken(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: "15m" }
    );

    const refreshToken = this.security.generateToken(
      { id: user.id, type: "refresh" },
      { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
  }
}

// auth.controller.ts
@Controller("/auth")
@UseInterceptors(new RateLimitInterceptor({ maxRequests: 10, windowMs: 60000 }))
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("/register")
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Post("/login")
  async login(@Body() dto: LoginDto, @Req() req: any) {
    return await this.authService.login(dto, req.ip);
  }

  @Post("/refresh")
  async refresh(@Body("refreshToken") refreshToken: string) {
    return await this.authService.refresh(refreshToken);
  }

  @Get("/me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return await this.authService.getProfile(req.user.id);
  }

  @Put("/change-password")
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return await this.authService.changePassword(
      req.user.id,
      dto.oldPassword,
      dto.newPassword
    );
  }
}
```

---

## 📚 Next Steps

- **[07-GUARDS_INTERCEPTORS_DEEP.md](./07-GUARDS_INTERCEPTORS_DEEP.md)** - Advanced guard patterns
- **[08-VALIDATION_PIPES.md](./08-VALIDATION_PIPES.md)** - Input validation
- **[09-ERROR_HANDLING.md](./09-ERROR_HANDLING.md)** - Security error handling

---

## 💡 Key Takeaways

✅ Use JWT for stateless authentication  
✅ Always hash passwords with bcrypt  
✅ Implement rate limiting on sensitive endpoints  
✅ Use security headers to prevent common attacks  
✅ Validate and sanitize all user input  
✅ Implement RBAC for authorization  
✅ Log security events for auditing  
✅ Use HTTPS in production  
✅ Implement token refresh mechanism  
✅ Follow principle of least privilege

---

**Secure your FynixJS application** with these battle-tested patterns!
