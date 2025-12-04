# Controller Decorator Documentation

## Overview

The Controller Decorator is a fundamental building block of the Fynix framework that marks a class as an HTTP controller and defines the base routing path for all route handlers within that class. It leverages TypeScript's reflection metadata to store routing information that the framework uses to register endpoints.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Routing Patterns](#routing-patterns)
- [Best Practices](#best-practices)
- [Integration with Other Decorators](#integration-with-other-decorators)
- [Advanced Patterns](#advanced-patterns)
- [Troubleshooting](#troubleshooting)

---

## Installation & Setup

The controller decorator is part of the Fynix framework core. Import it along with reflect-metadata:

```typescript
import "reflect-metadata";
import { Controller } from "./decorators/controller.decorator";
import { Get, Post, Put, Delete } from "./decorators/http-methods.decorator";
```

---

## Basic Usage

The `@Controller` decorator is applied at the class level to designate a class as a controller:

```typescript
@Controller("/api/users")
export class UserController {
  @Get("/")
  getAllUsers() {
    return { users: [] };
  }

  @Get("/:id")
  getUserById() {
    return { user: {} };
  }
}
```

**Result**: Creates routes at:

- `GET /api/users/`
- `GET /api/users/:id`

---

## API Reference

### @Controller

**Signature:**

```typescript
@Controller(path?: string): ClassDecorator
```

**Parameters:**

- `path` (optional): Base path for all routes in the controller. Default: `""`

**Returns:** `ClassDecorator` - A class decorator function

**Metadata Key:** `CONTROLLER_METADATA`

**Example:**

```typescript
@Controller("/api/products")
export class ProductController {
  // Route handlers...
}
```

---

## Usage Examples

### Root-Level Controller

```typescript
@Controller("/")
export class HomeController {
  @Get("/")
  home() {
    return { message: "Welcome to the API" };
  }

  @Get("/health")
  health() {
    return { status: "ok" };
  }
}
```

**Routes:**

- `GET /`
- `GET /health`

### API Versioned Controller

```typescript
@Controller("/api/v1/users")
export class UserV1Controller {
  @Get("/")
  listUsers() {
    return { users: [] };
  }

  @Post("/")
  createUser() {
    return { created: true };
  }
}

@Controller("/api/v2/users")
export class UserV2Controller {
  @Get("/")
  listUsers() {
    // V2 implementation
    return { users: [], pagination: {} };
  }
}
```

**Routes:**

- `GET /api/v1/users/`
- `POST /api/v1/users/`
- `GET /api/v2/users/`

### Resource-Based Controller

```typescript
@Controller("/api/products")
export class ProductController {
  @Get("/")
  list() {
    return { products: [] };
  }

  @Get("/:id")
  getById(@Param("id") id: string) {
    return { product: { id } };
  }

  @Post("/")
  create(@Body() data: any) {
    return { created: true, product: data };
  }

  @Put("/:id")
  update(@Param("id") id: string, @Body() data: any) {
    return { updated: true, product: { id, ...data } };
  }

  @Delete("/:id")
  delete(@Param("id") id: string) {
    return { deleted: true, id };
  }
}
```

**Routes:**

- `GET /api/products/`
- `GET /api/products/:id`
- `POST /api/products/`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Nested Resource Controller

```typescript
@Controller("/api/posts/:postId/comments")
export class CommentController {
  @Get("/")
  getCommentsForPost(@Param("postId") postId: string) {
    return { comments: [], postId };
  }

  @Post("/")
  addComment(@Param("postId") postId: string, @Body() comment: any) {
    return { created: true, postId, comment };
  }

  @Delete("/:commentId")
  deleteComment(
    @Param("postId") postId: string,
    @Param("commentId") commentId: string
  ) {
    return { deleted: true, postId, commentId };
  }
}
```

**Routes:**

- `GET /api/posts/:postId/comments/`
- `POST /api/posts/:postId/comments/`
- `DELETE /api/posts/:postId/comments/:commentId`

### Admin Controller

```typescript
@Controller("/admin")
export class AdminController {
  @Get("/dashboard")
  dashboard() {
    return { stats: {} };
  }

  @Get("/users")
  manageUsers() {
    return { users: [] };
  }

  @Post("/settings")
  updateSettings(@Body() settings: any) {
    return { updated: true, settings };
  }
}
```

**Routes:**

- `GET /admin/dashboard`
- `GET /admin/users`
- `POST /admin/settings`

### Empty Path Controller

```typescript
@Controller()
export class DefaultController {
  @Get("/ping")
  ping() {
    return { pong: true };
  }

  @Get("/status")
  status() {
    return { status: "operational" };
  }
}
```

**Routes:**

- `GET /ping`
- `GET /status`

---

## Routing Patterns

### Path Structure

Controller paths combine with method decorator paths:

```
Final Route = Controller Path + Method Path
```

**Examples:**

| Controller Path | Method Path    | Final Route              |
| --------------- | -------------- | ------------------------ |
| `/api/users`    | `/`            | `/api/users/`            |
| `/api/users`    | `/:id`         | `/api/users/:id`         |
| `/api/users`    | `/:id/profile` | `/api/users/:id/profile` |
| `/`             | `/health`      | `/health`                |
| `` (empty)      | `/status`      | `/status`                |

### Path Parameters

```typescript
@Controller("/api/organizations/:orgId")
export class OrganizationController {
  @Get("/members")
  getMembers(@Param("orgId") orgId: string) {
    return { orgId, members: [] };
  }

  @Get("/projects/:projectId")
  getProject(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string
  ) {
    return { orgId, projectId, project: {} };
  }
}
```

**Routes:**

- `GET /api/organizations/:orgId/members`
- `GET /api/organizations/:orgId/projects/:projectId`

### Query Parameters

Controllers handle query parameters through method decorators:

```typescript
@Controller("/api/search")
export class SearchController {
  @Get("/products")
  search(@Query("q") query: string, @Query("page") page: number) {
    return { query, page, results: [] };
  }
}
```

**Route:** `GET /api/search/products?q=laptop&page=1`

---

## Best Practices

### 1. Use Consistent Path Conventions

```typescript
// Good - consistent API prefix
@Controller('/api/users')
@Controller('/api/products')
@Controller('/api/orders')

// Good - versioned APIs
@Controller('/api/v1/users')
@Controller('/api/v2/users')

// Avoid mixing conventions
@Controller('/users')  // Missing /api prefix
@Controller('/api/products')
```

### 2. Organize by Resource

```typescript
// Good - one resource per controller
@Controller('/api/users')
export class UserController { }

@Controller('/api/posts')
export class PostController { }

// Avoid - multiple resources in one controller
@Controller('/api')
export class ApiController {
  @Get('/users')
  @Get('/posts')
  @Get('/comments')
}
```

### 3. Use Semantic Naming

```typescript
// Good - clear, descriptive names
@Controller("/api/authentication")
export class AuthenticationController {}

@Controller("/api/user-profiles")
export class UserProfileController {}

// Avoid - vague names
@Controller("/api/stuff")
export class StuffController {}
```

### 4. Group Related Functionality

```typescript
// Good - related endpoints together
@Controller("/api/auth")
export class AuthController {
  @Post("/login")
  login() {}

  @Post("/logout")
  logout() {}

  @Post("/refresh")
  refreshToken() {}
}
```

### 5. Use Proper REST Conventions

```typescript
@Controller("/api/articles")
export class ArticleController {
  @Get("/") // List all
  list() {}

  @Get("/:id") // Get one
  getById() {}

  @Post("/") // Create
  create() {}

  @Put("/:id") // Update/Replace
  update() {}

  @Patch("/:id") // Partial update
  partialUpdate() {}

  @Delete("/:id") // Delete
  delete() {}
}
```

### 6. Handle Path Trailing Slashes Consistently

```typescript
// Be consistent with trailing slashes
@Controller('/api/users')  // No trailing slash
export class UserController {
  @Get('/')      // With trailing slash for list
  @Get('/:id')   // No trailing slash for specific resource
}
```

### 7. Use Descriptive Export Names

```typescript
// Good
export class UserController {}
export class ProductController {}
export class OrderController {}

// Avoid
export class UC {}
export class Controller1 {}
```

---

## Integration with Other Decorators

### With HTTP Method Decorators

```typescript
import { Controller } from "./decorators/controller.decorator";
import {
  Get,
  Post,
  Put,
  Delete,
  Patch,
} from "./decorators/http-methods.decorator";

@Controller("/api/tasks")
export class TaskController {
  @Get("/")
  listTasks() {}

  @Post("/")
  createTask() {}

  @Patch("/:id/complete")
  completeTask() {}
}
```

### With Parameter Decorators

```typescript
import { Controller } from "./decorators/controller.decorator";
import { Get, Post } from "./decorators/http-methods.decorator";
import { Param, Query, Body } from "./decorators/params.decorator";

@Controller("/api/users")
export class UserController {
  @Get("/:id")
  getUser(@Param("id") id: string) {
    return { id };
  }

  @Get("/")
  searchUsers(@Query("email") email: string) {
    return { email };
  }

  @Post("/")
  createUser(@Body() userData: any) {
    return { created: true, user: userData };
  }
}
```

### With Guards

```typescript
import { Controller } from "./decorators/controller.decorator";
import { Get } from "./decorators/http-methods.decorator";
import { UseGuards } from "./decorators/guards.decorator";
import { AuthGuard } from "./guards/auth.guard";

@Controller("/api/protected")
@UseGuards(AuthGuard) // Apply to all routes
export class ProtectedController {
  @Get("/data")
  getData() {
    return { data: "sensitive" };
  }
}
```

### With Interceptors

```typescript
import { Controller } from "./decorators/controller.decorator";
import { Get } from "./decorators/http-methods.decorator";
import { UseInterceptors } from "./decorators/interceptors.decorator";
import { LoggingInterceptor } from "./interceptors/logging.interceptor";

@Controller("/api/analytics")
@UseInterceptors(LoggingInterceptor)
export class AnalyticsController {
  @Get("/stats")
  getStats() {
    return { stats: {} };
  }
}
```

### With Pipes

```typescript
import { Controller } from "./decorators/controller.decorator";
import { Post } from "./decorators/http-methods.decorator";
import { Body, UsePipes } from "./decorators/params.decorator";
import { ValidationPipe } from "./pipes/validation.pipe";

@Controller("/api/submissions")
export class SubmissionController {
  @Post("/")
  @UsePipes(ValidationPipe)
  submit(@Body() data: any) {
    return { submitted: true, data };
  }
}
```

---

## Advanced Patterns

### Multiple Controllers for Same Resource

```typescript
// Public API
@Controller("/api/public/products")
export class PublicProductController {
  @Get("/")
  listPublicProducts() {
    return { products: [] };
  }
}

// Admin API
@Controller("/api/admin/products")
@UseGuards(AdminGuard)
export class AdminProductController {
  @Get("/")
  listAllProducts() {
    return { products: [], includeHidden: true };
  }

  @Delete("/:id")
  deleteProduct(@Param("id") id: string) {
    return { deleted: true, id };
  }
}
```

### Controller Inheritance

```typescript
// Base controller
export abstract class BaseController {
  protected logRequest() {
    console.log("Request logged");
  }
}

// Concrete controllers
@Controller("/api/users")
export class UserController extends BaseController {
  @Get("/")
  list() {
    this.logRequest();
    return { users: [] };
  }
}

@Controller("/api/products")
export class ProductController extends BaseController {
  @Get("/")
  list() {
    this.logRequest();
    return { products: [] };
  }
}
```

### Metadata Retrieval

```typescript
import { CONTROLLER_METADATA } from "./core/metadata";

function getControllerPath(controllerClass: any): string {
  return Reflect.getMetadata(CONTROLLER_METADATA, controllerClass) || "";
}

// Usage
const path = getControllerPath(UserController);
console.log(path); // '/api/users'
```

### Dynamic Route Registration

```typescript
function registerController(controllerClass: any, app: any) {
  const basePath = Reflect.getMetadata(CONTROLLER_METADATA, controllerClass);
  const instance = new controllerClass();

  // Register all routes defined in the controller
  // (This is typically done by the framework)
  console.log(`Registering controller at: ${basePath}`);
}
```

### Controller Factory Pattern

```typescript
function createController(basePath: string, handlers: any) {
  @Controller(basePath)
  class DynamicController {
    // Add methods dynamically
  }

  Object.keys(handlers).forEach((key) => {
    DynamicController.prototype[key] = handlers[key];
  });

  return DynamicController;
}

// Usage
const UserCtrl = createController("/api/users", {
  list: function () {
    return { users: [] };
  },
  getById: function () {
    return { user: {} };
  },
});
```

---

## Complete Example

Here's a full-featured controller demonstrating best practices:

```typescript
import { Controller } from "./decorators/controller.decorator";
import { Get, Post, Put, Delete } from "./decorators/http-methods.decorator";
import { Param, Query, Body } from "./decorators/params.decorator";
import { UseGuards } from "./decorators/guards.decorator";
import { UseInterceptors } from "./decorators/interceptors.decorator";
import { UsePipes } from "./decorators/pipes.decorator";
import { AuthGuard } from "./guards/auth.guard";
import { LoggingInterceptor } from "./interceptors/logging.interceptor";
import { ValidationPipe } from "./pipes/validation.pipe";

/**
 * User management controller
 * Handles all user-related operations
 */
@Controller("/api/v1/users")
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
export class UserController {
  /**
   * Get all users with optional filtering
   * GET /api/v1/users?page=1&limit=10&search=john
   */
  @Get("/")
  async listUsers(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("search") search?: string
  ) {
    return {
      users: [],
      pagination: { page, limit },
      search,
    };
  }

  /**
   * Get single user by ID
   * GET /api/v1/users/:id
   */
  @Get("/:id")
  async getUserById(@Param("id") id: string) {
    return {
      user: { id, name: "John Doe" },
    };
  }

  /**
   * Create a new user
   * POST /api/v1/users
   */
  @Post("/")
  @UsePipes(ValidationPipe)
  async createUser(@Body() userData: any) {
    return {
      created: true,
      user: userData,
    };
  }

  /**
   * Update existing user
   * PUT /api/v1/users/:id
   */
  @Put("/:id")
  @UsePipes(ValidationPipe)
  async updateUser(@Param("id") id: string, @Body() userData: any) {
    return {
      updated: true,
      user: { id, ...userData },
    };
  }

  /**
   * Delete user
   * DELETE /api/v1/users/:id
   */
  @Delete("/:id")
  async deleteUser(@Param("id") id: string) {
    return {
      deleted: true,
      id,
    };
  }

  /**
   * Get user profile
   * GET /api/v1/users/:id/profile
   */
  @Get("/:id/profile")
  async getUserProfile(@Param("id") id: string) {
    return {
      profile: { userId: id },
    };
  }

  /**
   * Get user's posts
   * GET /api/v1/users/:id/posts
   */
  @Get("/:id/posts")
  async getUserPosts(@Param("id") id: string, @Query("page") page: number = 1) {
    return {
      userId: id,
      posts: [],
      page,
    };
  }
}
```

---

## Troubleshooting

### Controller Not Registered

**Problem:** Routes not working

**Solution:** Ensure the controller is imported in your module:

```typescript
@Module({
  controllers: [UserController, ProductController],
})
export class AppModule {}
```

### Path Not Resolving

**Problem:** Routes returning 404

**Solution:** Check path formatting:

```typescript
// Correct
@Controller('/api/users')

// May cause issues
@Controller('api/users')  // Missing leading slash
@Controller('/api/users/')  // Trailing slash
```

### Metadata Not Found

**Problem:** Framework can't find controller metadata

**Solution:** Ensure reflect-metadata is imported first:

```typescript
// At the very top of your entry file (index.ts or main.ts)
import "reflect-metadata";
```

### Conflicting Routes

**Problem:** Multiple controllers handling same route

**Solution:** Make controller paths unique:

```typescript
// Conflict
@Controller('/api/users')
@Controller('/api/users')

// Fixed
@Controller('/api/v1/users')
@Controller('/api/v2/users')
```

### Parameter Not Accessible

**Problem:** Can't access route parameters in controller

**Solution:** Use parameter decorators:

```typescript
@Controller("/api/users")
export class UserController {
  @Get("/:id")
  getUser(@Param("id") id: string) {
    // Use @Param decorator
    return { id };
  }
}
```

---

## Related Documentation

- [HTTP Methods Decorators](./HTTP_METHODS_DECORATOR.md) - Route handler decorators
- [Parameter Decorators](./PARAMS_DECORATOR.md) - Extracting request data
- [Guards](./GUARDS_DECORATOR.md) - Route protection
- [Interceptors](./INTERCEPTORS_DECORATOR.md) - Request/response transformation
- [Modules](./DOCSMED/03-MODULES_ARCHITECTURE.md) - Application structure

---

## Metadata Key Reference

```typescript
// From core/metadata.ts
export const CONTROLLER_METADATA = "controller:metadata";
```

This constant is used internally by the framework to store and retrieve controller path information.

---

## License

This documentation is part of the Fynix Framework.

---

**Last Updated**: December 4, 2025
