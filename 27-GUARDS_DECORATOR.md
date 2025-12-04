# Guards Decorator Documentation

## Overview

The Guards Decorator provides route protection and authorization functionality in the Fynix framework. Guards are executed before route handlers and can allow or deny access based on custom logic such as authentication status, user roles, permissions, or any other business rules.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Creating Guards](#creating-guards)
- [Usage Examples](#usage-examples)
- [Guard Execution Order](#guard-execution-order)
- [Best Practices](#best-practices)
- [Common Use Cases](#common-use-cases)
- [Advanced Patterns](#advanced-patterns)
- [Troubleshooting](#troubleshooting)

---

## Installation & Setup

```typescript
import "reflect-metadata";
import { UseGuards } from "./decorators/guards.decorator";
```

---

## Basic Usage

Apply guards at the method or class level:

```typescript
@Controller("/api/admin")
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  @Get("/users")
  listUsers() {
    return { users: [] };
  }

  @Get("/settings")
  @UseGuards(SuperAdminGuard) // Additional guard for this route
  getSettings() {
    return { settings: {} };
  }
}
```

---

## API Reference

### @UseGuards

**Signature:**

```typescript
@UseGuards(...guards: any[]): MethodDecorator & ClassDecorator
```

**Parameters:**

- `...guards` - One or more guard classes to apply

**Returns:** Combined method and class decorator

**Metadata Key:** `GUARDS_METADATA`

**Scope:**

- **Class-level**: Applies to all routes in the controller
- **Method-level**: Applies only to the specific route

**Example:**

```typescript
@UseGuards(AuthGuard)
@UseGuards(RoleGuard, PermissionGuard)
```

---

## Creating Guards

Guards must implement a `canActivate` method that returns a boolean or Promise<boolean>:

```typescript
import { Injectable } from "./decorators/injectable.decorator";

@Injectable()
export class AuthGuard {
  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const token = request.headers["authorization"];

    if (!token) {
      return false;
    }

    // Verify token
    const isValid = await this.verifyToken(token);
    return isValid;
  }

  private async verifyToken(token: string): Promise<boolean> {
    // Token verification logic
    return true;
  }
}
```

---

## Usage Examples

### Authentication Guard

```typescript
@Injectable()
export class AuthGuard {
  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const token = request.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      throw new Error("No token provided");
    }

    try {
      const decoded = await this.jwtService.verify(token);
      request.user = decoded;
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Usage
@Controller("/api/profile")
@UseGuards(AuthGuard)
export class ProfileController {
  @Get("/")
  getProfile() {
    return { profile: {} };
  }
}
```

### Role-Based Guard

```typescript
@Injectable()
export class RoleGuard {
  constructor(private requiredRoles: string[]) {}

  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const user = request.user;

    if (!user) {
      return false;
    }

    return this.requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Usage
@Controller("/api/admin")
@UseGuards(AuthGuard, RoleGuard)
export class AdminController {
  @Get("/dashboard")
  getDashboard() {
    return { stats: {} };
  }
}
```

### Permission Guard

```typescript
@Injectable()
export class PermissionGuard {
  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const user = request.user;
    const requiredPermission = context.permission;

    if (!user || !user.permissions) {
      return false;
    }

    return user.permissions.includes(requiredPermission);
  }
}

// Usage
@Controller("/api/posts")
export class PostController {
  @Post("/")
  @UseGuards(AuthGuard, PermissionGuard)
  createPost() {
    return { created: true };
  }

  @Delete("/:id")
  @UseGuards(AuthGuard, PermissionGuard)
  deletePost() {
    return { deleted: true };
  }
}
```

### IP Whitelist Guard

```typescript
@Injectable()
export class IpWhitelistGuard {
  private allowedIps = ["127.0.0.1", "192.168.1.100"];

  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const clientIp = request.ip || request.connection.remoteAddress;

    return this.allowedIps.includes(clientIp);
  }
}

// Usage
@Controller("/api/internal")
@UseGuards(IpWhitelistGuard)
export class InternalController {
  @Get("/metrics")
  getMetrics() {
    return { metrics: {} };
  }
}
```

### Rate Limiting Guard

```typescript
@Injectable()
export class RateLimitGuard {
  private requests = new Map<string, number[]>();
  private readonly limit = 100;
  private readonly windowMs = 60000; // 1 minute

  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const key = request.ip || request.user?.id || "anonymous";
    const now = Date.now();

    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(
      (time) => now - time < this.windowMs
    );

    if (recentRequests.length >= this.limit) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }
}

// Usage
@Controller("/api/public")
@UseGuards(RateLimitGuard)
export class PublicController {
  @Get("/data")
  getData() {
    return { data: [] };
  }
}
```

### API Key Guard

```typescript
@Injectable()
export class ApiKeyGuard {
  private validKeys = ["key1", "key2", "key3"];

  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const apiKey = request.headers["x-api-key"];

    if (!apiKey) {
      throw new Error("API key required");
    }

    return this.validKeys.includes(apiKey);
  }
}

// Usage
@Controller("/api/external")
@UseGuards(ApiKeyGuard)
export class ExternalApiController {
  @Post("/webhook")
  handleWebhook() {
    return { received: true };
  }
}
```

### Ownership Guard

```typescript
@Injectable()
export class OwnershipGuard {
  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const user = request.user;
    const resourceId = request.params.id;

    if (!user) {
      return false;
    }

    // Check if user owns the resource
    const resource = await this.resourceService.findById(resourceId);
    return resource.userId === user.id;
  }
}

// Usage
@Controller("/api/posts")
export class PostController {
  @Put("/:id")
  @UseGuards(AuthGuard, OwnershipGuard)
  updatePost(@Param("id") id: string) {
    return { updated: true };
  }

  @Delete("/:id")
  @UseGuards(AuthGuard, OwnershipGuard)
  deletePost(@Param("id") id: string) {
    return { deleted: true };
  }
}
```

---

## Guard Execution Order

### Class-Level and Method-Level Guards

```typescript
@Controller("/api/users")
@UseGuards(Guard1, Guard2) // Executed first
export class UserController {
  @Get("/:id")
  @UseGuards(Guard3, Guard4) // Executed second
  getUser() {
    return { user: {} };
  }
}
```

**Execution Order:** Guard1 → Guard2 → Guard3 → Guard4

### Multiple UseGuards Decorators

```typescript
@Controller("/api/admin")
@UseGuards(AuthGuard)
@UseGuards(AdminGuard)
export class AdminController {
  @Get("/settings")
  @UseGuards(PermissionGuard)
  @UseGuards(OwnershipGuard)
  getSettings() {
    return { settings: {} };
  }
}
```

**Execution Order:** AuthGuard → AdminGuard → PermissionGuard → OwnershipGuard

---

## Best Practices

### 1. Keep Guards Focused

```typescript
// Good - single responsibility
@Injectable()
export class AuthGuard {
  async canActivate(context: any): Promise<boolean> {
    // Only handles authentication
    return this.verifyToken(context.request);
  }
}

@Injectable()
export class RoleGuard {
  async canActivate(context: any): Promise<boolean> {
    // Only handles role checking
    return this.checkRoles(context.request);
  }
}

// Avoid - multiple responsibilities
@Injectable()
export class AuthAndRoleGuard {
  async canActivate(context: any): Promise<boolean> {
    // Doing too much
    const authenticated = await this.verifyToken(context.request);
    const authorized = await this.checkRoles(context.request);
    return authenticated && authorized;
  }
}
```

### 2. Use Dependency Injection

```typescript
@Injectable()
export class AuthGuard {
  constructor(
    private jwtService: JwtService,
    private userService: UserService
  ) {}

  async canActivate(context: any): Promise<boolean> {
    const token = context.request.headers["authorization"];
    const decoded = await this.jwtService.verify(token);
    const user = await this.userService.findById(decoded.userId);

    context.request.user = user;
    return true;
  }
}
```

### 3. Provide Meaningful Error Messages

```typescript
@Injectable()
export class AuthGuard {
  async canActivate(context: any): Promise<boolean> {
    const token = context.request.headers["authorization"];

    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      await this.verifyToken(token);
      return true;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }
}
```

### 4. Apply Guards at the Appropriate Level

```typescript
// Good - authentication for entire controller
@Controller("/api/profile")
@UseGuards(AuthGuard)
export class ProfileController {
  @Get("/")
  getProfile() {}

  @Put("/")
  updateProfile() {}
}

// Good - additional guard for specific route
@Controller("/api/posts")
@UseGuards(AuthGuard)
export class PostController {
  @Get("/")
  listPosts() {} // Only needs auth

  @Delete("/:id")
  @UseGuards(AdminGuard) // Needs admin role
  deletePost() {}
}
```

### 5. Cache Guard Results When Appropriate

```typescript
@Injectable()
export class CachedAuthGuard {
  private cache = new Map<string, { valid: boolean; expires: number }>();

  async canActivate(context: any): Promise<boolean> {
    const token = context.request.headers["authorization"];
    const cached = this.cache.get(token);

    if (cached && cached.expires > Date.now()) {
      return cached.valid;
    }

    const valid = await this.verifyToken(token);
    this.cache.set(token, {
      valid,
      expires: Date.now() + 60000, // 1 minute
    });

    return valid;
  }
}
```

### 6. Test Guards Thoroughly

```typescript
describe("AuthGuard", () => {
  it("should deny access without token", async () => {
    const guard = new AuthGuard();
    const context = { request: { headers: {} } };

    const result = await guard.canActivate(context);
    expect(result).toBe(false);
  });

  it("should allow access with valid token", async () => {
    const guard = new AuthGuard();
    const context = {
      request: { headers: { authorization: "valid-token" } },
    };

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
```

---

## Common Use Cases

### Protecting Admin Routes

```typescript
@Controller("/api/admin")
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  @Get("/users")
  listAllUsers() {
    return { users: [] };
  }

  @Delete("/users/:id")
  deleteUser(@Param("id") id: string) {
    return { deleted: true, id };
  }

  @Get("/settings")
  @UseGuards(SuperAdminGuard)
  getSystemSettings() {
    return { settings: {} };
  }
}
```

### Protecting Resource Ownership

```typescript
@Controller("/api/documents")
@UseGuards(AuthGuard)
export class DocumentController {
  @Get("/")
  listMyDocuments() {
    // Returns current user's documents
    return { documents: [] };
  }

  @Get("/:id")
  @UseGuards(OwnershipGuard)
  getDocument(@Param("id") id: string) {
    return { document: {} };
  }

  @Put("/:id")
  @UseGuards(OwnershipGuard)
  updateDocument(@Param("id") id: string) {
    return { updated: true };
  }

  @Delete("/:id")
  @UseGuards(OwnershipGuard)
  deleteDocument(@Param("id") id: string) {
    return { deleted: true };
  }
}
```

### Public and Protected Routes

```typescript
@Controller("/api/posts")
export class PostController {
  @Get("/")
  // Public - no guards
  listPublicPosts() {
    return { posts: [] };
  }

  @Get("/:id")
  // Public - no guards
  getPublicPost(@Param("id") id: string) {
    return { post: {} };
  }

  @Post("/")
  @UseGuards(AuthGuard)
  createPost() {
    return { created: true };
  }

  @Put("/:id")
  @UseGuards(AuthGuard, OwnershipGuard)
  updatePost(@Param("id") id: string) {
    return { updated: true };
  }

  @Delete("/:id")
  @UseGuards(AuthGuard, OwnershipGuard)
  deletePost(@Param("id") id: string) {
    return { deleted: true };
  }
}
```

---

## Advanced Patterns

### Parameterized Guards

```typescript
export function Roles(...roles: string[]) {
  return UseGuards(
    class RoleGuard {
      async canActivate(context: any): Promise<boolean> {
        const user = context.request.user;
        return roles.some((role) => user.roles?.includes(role));
      }
    }
  );
}

// Usage
@Controller("/api/admin")
export class AdminController {
  @Get("/dashboard")
  @Roles("admin", "moderator")
  getDashboard() {
    return { dashboard: {} };
  }

  @Delete("/users/:id")
  @Roles("admin")
  deleteUser() {
    return { deleted: true };
  }
}
```

### Composite Guards

```typescript
export class CompositeGuard {
  constructor(private guards: any[]) {}

  async canActivate(context: any): Promise<boolean> {
    for (const GuardClass of this.guards) {
      const guard = new GuardClass();
      const result = await guard.canActivate(context);

      if (!result) {
        return false;
      }
    }

    return true;
  }
}

// Usage
const AdminAccessGuard = new CompositeGuard([
  AuthGuard,
  RoleGuard,
  PermissionGuard,
]);

@Controller("/api/admin")
@UseGuards(AdminAccessGuard)
export class AdminController {
  // All routes protected by composite guard
}
```

### Conditional Guards

```typescript
@Injectable()
export class ConditionalGuard {
  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const method = request.method;

    // Only protect write operations
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      return this.authGuard.canActivate(context);
    }

    // Allow all read operations
    return true;
  }
}
```

### Guard with Metadata

```typescript
export const RequirePermission = (permission: string) => {
  return (target: any, propertyKey?: string) => {
    if (propertyKey) {
      Reflect.defineMetadata("permission", permission, target, propertyKey);
    }
  };
};

@Injectable()
export class PermissionGuard {
  async canActivate(context: any): Promise<boolean> {
    const permission = Reflect.getMetadata(
      "permission",
      context.target,
      context.handler
    );

    const user = context.request.user;
    return user.permissions?.includes(permission);
  }
}

// Usage
@Controller("/api/posts")
export class PostController {
  @Post("/")
  @RequirePermission("posts:create")
  @UseGuards(AuthGuard, PermissionGuard)
  createPost() {
    return { created: true };
  }
}
```

---

## Troubleshooting

### Guard Not Executing

**Problem:** Guard doesn't seem to run

**Solution:** Ensure guard is properly registered and decorated:

```typescript
@Injectable()
export class AuthGuard {
  async canActivate(context: any): Promise<boolean> {
    // Implementation
    return true;
  }
}
```

### Request User Not Available

**Problem:** `request.user` is undefined in guards

**Solution:** Ensure authentication guard sets it:

```typescript
@Injectable()
export class AuthGuard {
  async canActivate(context: any): Promise<boolean> {
    const token = context.request.headers["authorization"];
    const decoded = await this.verifyToken(token);

    // Set user on request
    context.request.user = decoded;

    return true;
  }
}
```

### Guards Execute in Wrong Order

**Problem:** Guards don't execute in expected sequence

**Solution:** Remember class-level guards execute before method-level:

```typescript
@Controller("/api/users")
@UseGuards(Guard1) // First
export class UserController {
  @Get("/:id")
  @UseGuards(Guard2) // Second
  getUser() {}
}
```

### Guard Throws Instead of Returning False

**Problem:** Guard throws errors instead of denying access

**Solution:** Handle errors appropriately:

```typescript
@Injectable()
export class AuthGuard {
  async canActivate(context: any): Promise<boolean> {
    try {
      const token = context.request.headers["authorization"];
      await this.verifyToken(token);
      return true;
    } catch (error) {
      // Return false or throw meaningful error
      throw new Error("Authentication failed");
    }
  }
}
```

---

## Related Documentation

- [Controller Decorator](./CONTROLLER_DECORATOR.md) - Define controllers
- [HTTP Methods](./HTTP_METHODS_DECORATOR.md) - Route handlers
- [Interceptors](./INTERCEPTORS_DECORATOR.md) - Request/response transformation
- [Pipes](./PIPES_DECORATOR.md) - Data validation and transformation
- [Injectable](./INJECTABLE_DECORATOR.md) - Dependency injection

---

## Metadata Key Reference

```typescript
// From core/metadata.ts
export const GUARDS_METADATA = "guards:metadata";
```

---

## License

This documentation is part of the Fynix Framework.

---

**Last Updated**: December 4, 2025
