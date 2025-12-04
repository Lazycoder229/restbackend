# JWT Authentication Guard Documentation

## Overview

The JwtAuthGuard provides JWT (JSON Web Token) based authentication for protecting routes in Fynix applications. It verifies tokens, extracts user information, and attaches it to requests.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Token Generation](#token-generation)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { JwtAuthGuard } from "./builtin/jwt-auth.guard";
import { UseGuards } from "./decorators/guards.decorator";
```

---

## Basic Usage

### Protecting Routes

```typescript
@Controller("/api/users")
export class UserController {
  @Get("/profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    // req.user contains decoded JWT payload
    return req.user;
  }

  @Put("/profile")
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: Request, @Body() data: UpdateProfileDto) {
    return await this.userService.update(req.user.id, data);
  }
}
```

### Accessing User Information

```typescript
@Get('/dashboard')
@UseGuards(JwtAuthGuard)
async getDashboard(@Req() req: Request) {
  const userId = req.user.id;
  const userEmail = req.user.email;

  return await this.dashboardService.getData(userId);
}
```

---

## API Reference

### JwtAuthGuard

#### Configuration

```typescript
const guard = new JwtAuthGuard({
  secret: process.env.JWT_SECRET,
  expiresIn: "1h",
  algorithms: ["HS256"],
});
```

#### Options

| Option       | Type     | Default   | Description                   |
| ------------ | -------- | --------- | ----------------------------- |
| `secret`     | string   | required  | Secret key for signing tokens |
| `expiresIn`  | string   | '1h'      | Token expiration time         |
| `algorithms` | string[] | ['HS256'] | Allowed algorithms            |
| `issuer`     | string   | undefined | Token issuer                  |
| `audience`   | string   | undefined | Token audience                |

---

## Token Generation

### Login Endpoint

```typescript
@Controller("/auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private securityService: SecurityService
  ) {}

  @Post("/login")
  async login(@Body() credentials: LoginDto) {
    const user = await this.authService.validateUser(
      credentials.email,
      credentials.password
    );

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate JWT token
    const token = this.securityService.generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      "1h"
    );

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  @Post("/refresh")
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req: Request) {
    const newToken = this.securityService.generateToken(
      {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
      "1h"
    );

    return { access_token: newToken };
  }
}
```

---

## Best Practices

### 1. Use Environment Variables for Secrets

```typescript
// Good
const jwtSecret = process.env.JWT_SECRET;

// Bad
const jwtSecret = "hardcoded-secret";
```

### 2. Set Appropriate Expiration Times

```typescript
// Good - reasonable expiration
const accessToken = generateToken(payload, "15m"); // 15 minutes
const refreshToken = generateToken(payload, "7d"); // 7 days

// Bad - too long
const token = generateToken(payload, "365d"); // 1 year
```

### 3. Include Minimal Claims

```typescript
// Good - minimal claims
const token = generateToken({
  id: user.id,
  email: user.email,
  role: user.role,
});

// Bad - too much data
const token = generateToken({
  ...user, // Entire user object
  password: user.password, // Never include passwords!
});
```

### 4. Handle Token Expiration

```typescript
@UseGuards(JwtAuthGuard)
async getProtectedResource(@Req() req: Request) {
  try {
    // Access protected resource
    return await this.service.getData(req.user.id);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token expired');
    }
    throw error;
  }
}
```

### 5. Implement Token Refresh

```typescript
@Post('/refresh')
@UseGuards(RefreshTokenGuard)
async refresh(@Req() req: Request) {
  const newAccessToken = this.securityService.generateToken({
    id: req.user.id,
    email: req.user.email
  }, '15m');

  return { access_token: newAccessToken };
}
```

---

## Examples

### Complete Authentication Flow

```typescript
@Controller("/auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private securityService: SecurityService
  ) {}

  @Post("/register")
  async register(@Body() data: RegisterDto) {
    const user = await this.authService.register(data);

    const token = this.securityService.generateToken(
      {
        id: user.id,
        email: user.email,
      },
      "1h"
    );

    return { access_token: token, user };
  }

  @Post("/login")
  async login(@Body() credentials: LoginDto) {
    const user = await this.authService.validateUser(
      credentials.email,
      credentials.password
    );

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const accessToken = this.securityService.generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      "15m"
    );

    const refreshToken = this.securityService.generateToken(
      {
        id: user.id,
        type: "refresh",
      },
      "7d"
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  @Post("/logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request) {
    // Invalidate token (implement token blacklist)
    await this.authService.invalidateToken(req.headers.authorization);
    return { message: "Logged out successfully" };
  }

  @Get("/me")
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: Request) {
    return await this.authService.getUserById(req.user.id);
  }
}
```

### Protected Resource Access

```typescript
@Controller("/api/orders")
export class OrderController {
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserOrders(@Req() req: Request) {
    return await this.orderService.findByUserId(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(@Req() req: Request, @Body() data: CreateOrderDto) {
    return await this.orderService.create({
      ...data,
      userId: req.user.id,
    });
  }

  @Get("/:id")
  @UseGuards(JwtAuthGuard)
  async getOrder(@Req() req: Request, @Param("id") id: number) {
    const order = await this.orderService.findById(id);

    // Ensure user can only access their own orders
    if (order.userId !== req.user.id) {
      throw new ForbiddenException("Access denied");
    }

    return order;
  }
}
```

### Role-Based Access Control

```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private allowedRoles: string[]) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();

    if (!request.user) {
      throw new UnauthorizedException("User not authenticated");
    }

    if (!this.allowedRoles.includes(request.user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}

// Usage
@Controller("/admin")
export class AdminController {
  @Get("/users")
  @UseGuards(JwtAuthGuard, new RoleGuard(["admin"]))
  async getAllUsers() {
    return await this.userService.findAll();
  }

  @Delete("/users/:id")
  @UseGuards(JwtAuthGuard, new RoleGuard(["admin"]))
  async deleteUser(@Param("id") id: number) {
    return await this.userService.delete(id);
  }
}
```

---

## Related Documentation

- [Guards Decorator](./GUARDS_DECORATOR.md)
- [Security Service](./SECURITY_SERVICE.md)
- [API Key Guard](./API_KEY_GUARD.md)
- [OAuth Service](./OAUTH_SERVICE.md)

---

**Last Updated**: December 4, 2025
