# HTTP Methods Decorator Documentation

## Overview

The HTTP Methods Decorators define route handlers for different HTTP methods (GET, POST, PUT, DELETE, etc.) in the Fynix framework. These decorators map class methods to HTTP endpoints and are essential for building RESTful APIs.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Available Decorators](#available-decorators)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Routing Patterns](#routing-patterns)
- [REST API Design](#rest-api-design)
- [Best Practices](#best-practices)
- [Advanced Patterns](#advanced-patterns)
- [Troubleshooting](#troubleshooting)

---

## Installation & Setup

```typescript
import "reflect-metadata";
import {
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Options,
  Head,
} from "./decorators/http-methods.decorator";
import { Controller } from "./decorators/controller.decorator";
```

---

## Available Decorators

| Decorator  | HTTP Method | Common Use               |
| ---------- | ----------- | ------------------------ |
| `@Get`     | GET         | Retrieve resources       |
| `@Post`    | POST        | Create resources         |
| `@Put`     | PUT         | Update/replace resources |
| `@Delete`  | DELETE      | Delete resources         |
| `@Patch`   | PATCH       | Partial updates          |
| `@Options` | OPTIONS     | CORS preflight           |
| `@Head`    | HEAD        | Get headers only         |

---

## API Reference

### Method Decorators

**Signature:**

```typescript
@Get(path?: string): MethodDecorator
@Post(path?: string): MethodDecorator
@Put(path?: string): MethodDecorator
@Delete(path?: string): MethodDecorator
@Patch(path?: string): MethodDecorator
@Options(path?: string): MethodDecorator
@Head(path?: string): MethodDecorator
```

**Parameters:**

- `path` (optional): Route path relative to controller path. Default: `""`

**Metadata Key:** `ROUTE_METADATA`

**Stored Data:**

```typescript
interface RouteMetadata {
  path: string;
  method: HttpMethod;
  methodName: string;
}
```

---

## Usage Examples

### Basic GET Routes

```typescript
@Controller("/api/users")
export class UserController {
  @Get("/")
  listUsers() {
    return { users: [] };
  }

  @Get("/:id")
  getUserById(@Param("id") id: string) {
    return { user: { id } };
  }

  @Get("/search")
  searchUsers(@Query("q") query: string) {
    return { results: [], query };
  }
}
```

**Routes:**

- `GET /api/users/`
- `GET /api/users/:id`
- `GET /api/users/search`

### POST Routes

```typescript
@Controller("/api/posts")
export class PostController {
  @Post("/")
  createPost(@Body() postData: any) {
    return { created: true, post: postData };
  }

  @Post("/:id/like")
  likePost(@Param("id") id: string) {
    return { liked: true, postId: id };
  }

  @Post("/bulk")
  createBulkPosts(@Body() posts: any[]) {
    return { created: posts.length };
  }
}
```

**Routes:**

- `POST /api/posts/`
- `POST /api/posts/:id/like`
- `POST /api/posts/bulk`

### PUT Routes

```typescript
@Controller("/api/products")
export class ProductController {
  @Put("/:id")
  updateProduct(@Param("id") id: string, @Body() productData: any) {
    return { updated: true, product: { id, ...productData } };
  }

  @Put("/:id/activate")
  activateProduct(@Param("id") id: string) {
    return { activated: true, id };
  }
}
```

**Routes:**

- `PUT /api/products/:id`
- `PUT /api/products/:id/activate`

### DELETE Routes

```typescript
@Controller("/api/comments")
export class CommentController {
  @Delete("/:id")
  deleteComment(@Param("id") id: string) {
    return { deleted: true, id };
  }

  @Delete("/bulk")
  deleteBulkComments(@Body() ids: string[]) {
    return { deleted: ids.length };
  }
}
```

**Routes:**

- `DELETE /api/comments/:id`
- `DELETE /api/comments/bulk`

### PATCH Routes

```typescript
@Controller("/api/users")
export class UserController {
  @Patch("/:id")
  partialUpdateUser(@Param("id") id: string, @Body() updates: any) {
    return { updated: true, changes: updates };
  }

  @Patch("/:id/status")
  updateUserStatus(@Param("id") id: string, @Body("status") status: string) {
    return { statusUpdated: true, status };
  }
}
```

**Routes:**

- `PATCH /api/users/:id`
- `PATCH /api/users/:id/status`

### OPTIONS and HEAD Routes

```typescript
@Controller("/api/resources")
export class ResourceController {
  @Options("/")
  getOptions() {
    return {
      allow: ["GET", "POST", "PUT", "DELETE"],
      "access-control-allow-origin": "*",
    };
  }

  @Head("/:id")
  checkResourceExists(@Param("id") id: string) {
    // Return headers only, no body
    return;
  }
}
```

---

## Routing Patterns

### RESTful Resource Routes

```typescript
@Controller("/api/articles")
export class ArticleController {
  @Get("/")
  list() {
    return { articles: [] };
  }

  @Get("/:id")
  getById(@Param("id") id: string) {
    return { article: { id } };
  }

  @Post("/")
  create(@Body() data: any) {
    return { created: true, article: data };
  }

  @Put("/:id")
  update(@Param("id") id: string, @Body() data: any) {
    return { updated: true, article: { id, ...data } };
  }

  @Patch("/:id")
  partialUpdate(@Param("id") id: string, @Body() data: any) {
    return { updated: true, changes: data };
  }

  @Delete("/:id")
  delete(@Param("id") id: string) {
    return { deleted: true, id };
  }
}
```

### Nested Resource Routes

```typescript
@Controller("/api/posts")
export class PostController {
  @Get("/:postId/comments")
  getComments(@Param("postId") postId: string) {
    return { comments: [], postId };
  }

  @Post("/:postId/comments")
  addComment(@Param("postId") postId: string, @Body() comment: any) {
    return { created: true, postId, comment };
  }

  @Delete("/:postId/comments/:commentId")
  deleteComment(
    @Param("postId") postId: string,
    @Param("commentId") commentId: string
  ) {
    return { deleted: true, postId, commentId };
  }
}
```

### Action Routes

```typescript
@Controller("/api/orders")
export class OrderController {
  @Post("/:id/cancel")
  cancelOrder(@Param("id") id: string) {
    return { cancelled: true, orderId: id };
  }

  @Post("/:id/ship")
  shipOrder(@Param("id") id: string, @Body() shippingInfo: any) {
    return { shipped: true, orderId: id, shippingInfo };
  }

  @Post("/:id/refund")
  refundOrder(@Param("id") id: string) {
    return { refunded: true, orderId: id };
  }

  @Get("/:id/track")
  trackOrder(@Param("id") id: string) {
    return { tracking: {}, orderId: id };
  }
}
```

### Query-Based Routes

```typescript
@Controller("/api/search")
export class SearchController {
  @Get("/products")
  searchProducts(
    @Query("q") query: string,
    @Query("category") category: string,
    @Query("minPrice") minPrice: number,
    @Query("maxPrice") maxPrice: number
  ) {
    return { results: [], query, filters: { category, minPrice, maxPrice } };
  }

  @Get("/users")
  searchUsers(@Query("name") name: string, @Query("email") email: string) {
    return { results: [], filters: { name, email } };
  }
}
```

---

## REST API Design

### Complete CRUD Example

```typescript
@Controller("/api/tasks")
export class TaskController {
  /**
   * List all tasks
   * GET /api/tasks?status=pending&page=1&limit=10
   */
  @Get("/")
  async listTasks(
    @Query("status") status?: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10
  ) {
    return {
      tasks: [],
      pagination: { page, limit, total: 0 },
      filters: { status },
    };
  }

  /**
   * Get single task
   * GET /api/tasks/:id
   */
  @Get("/:id")
  async getTask(@Param("id") id: string) {
    return {
      task: { id, title: "Sample Task" },
    };
  }

  /**
   * Create new task
   * POST /api/tasks
   */
  @Post("/")
  async createTask(@Body() taskData: any) {
    return {
      created: true,
      task: { id: "123", ...taskData },
    };
  }

  /**
   * Update entire task
   * PUT /api/tasks/:id
   */
  @Put("/:id")
  async updateTask(@Param("id") id: string, @Body() taskData: any) {
    return {
      updated: true,
      task: { id, ...taskData },
    };
  }

  /**
   * Partial update
   * PATCH /api/tasks/:id
   */
  @Patch("/:id")
  async partialUpdate(@Param("id") id: string, @Body() updates: any) {
    return {
      updated: true,
      changes: updates,
    };
  }

  /**
   * Delete task
   * DELETE /api/tasks/:id
   */
  @Delete("/:id")
  async deleteTask(@Param("id") id: string) {
    return {
      deleted: true,
      id,
    };
  }

  /**
   * Complete task (action)
   * POST /api/tasks/:id/complete
   */
  @Post("/:id/complete")
  async completeTask(@Param("id") id: string) {
    return {
      completed: true,
      taskId: id,
    };
  }
}
```

### API Versioning

```typescript
// Version 1
@Controller("/api/v1/users")
export class UserV1Controller {
  @Get("/")
  listUsers() {
    return { users: [], version: "v1" };
  }
}

// Version 2
@Controller("/api/v2/users")
export class UserV2Controller {
  @Get("/")
  listUsers() {
    return {
      users: [],
      version: "v2",
      pagination: { page: 1, total: 0 },
    };
  }
}
```

---

## Best Practices

### 1. Use Appropriate HTTP Methods

```typescript
// Good - correct HTTP methods
@Get('/users')          // Read/retrieve
@Post('/users')         // Create
@Put('/users/:id')      // Update/replace
@Patch('/users/:id')    // Partial update
@Delete('/users/:id')   // Delete

// Avoid - wrong methods
@Post('/getUsers')      // Should be @Get
@Get('/deleteUser')     // Should be @Delete
@Post('/updateUser')    // Should be @Put or @Patch
```

### 2. Use Meaningful Paths

```typescript
// Good - clear, descriptive paths
@Get('/users/:id/orders')
@Post('/products/:id/reviews')
@Delete('/comments/:id')

// Avoid - vague paths
@Get('/data')
@Post('/action')
@Delete('/remove')
```

### 3. Use Plural Nouns for Resources

```typescript
// Good - plural resources
@Controller('/api/users')
@Controller('/api/products')
@Controller('/api/orders')

// Avoid - singular or mixed
@Controller('/api/user')
@Controller('/api/product')
```

### 4. Keep Route Handlers Focused

```typescript
// Good - single responsibility
@Get('/users/:id')
getUser(@Param('id') id: string) {
  return this.userService.findById(id);
}

@Post('/users')
createUser(@Body() userData: any) {
  return this.userService.create(userData);
}

// Avoid - doing too much
@Post('/users')
createUserAndSendEmail(@Body() userData: any) {
  const user = this.userService.create(userData);
  this.emailService.sendWelcomeEmail(user);
  this.analyticsService.track('user_created');
  this.cacheService.invalidate('users');
  return user;
}
```

### 5. Use Query Parameters for Filtering

```typescript
// Good - filters in query params
@Get('/products')
searchProducts(
  @Query('category') category: string,
  @Query('minPrice') minPrice: number,
  @Query('maxPrice') maxPrice: number,
  @Query('inStock') inStock: boolean
) {
  return this.productService.search({ category, minPrice, maxPrice, inStock });
}

// Avoid - filters in path
@Get('/products/:category/:minPrice/:maxPrice')
searchProducts(
  @Param('category') category: string,
  @Param('minPrice') minPrice: number,
  @Param('maxPrice') maxPrice: number
) {
  // ...
}
```

### 6. Document Your Routes

```typescript
@Controller("/api/products")
export class ProductController {
  /**
   * Get all products with optional filtering
   *
   * @param category - Filter by category
   * @param search - Search term for product name
   * @param page - Page number for pagination
   * @param limit - Items per page
   *
   * @returns List of products with pagination info
   */
  @Get("/")
  async listProducts(
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20
  ) {
    return await this.productService.findAll({ category, search, page, limit });
  }
}
```

### 7. Use Proper Status Codes

```typescript
@Controller("/api/users")
export class UserController {
  @Post("/")
  async createUser(@Body() userData: any, @Res() res: any) {
    const user = await this.userService.create(userData);
    return res.status(201).json({ created: true, user });
  }

  @Delete("/:id")
  async deleteUser(@Param("id") id: string, @Res() res: any) {
    await this.userService.delete(id);
    return res.status(204).send();
  }
}
```

---

## Advanced Patterns

### Route Metadata

```typescript
export const Public = () => {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata("isPublic", true, target, propertyKey);
  };
};

@Controller("/api/posts")
export class PostController {
  @Get("/")
  @Public()
  listPublicPosts() {
    return { posts: [] };
  }

  @Post("/")
  @UseGuards(AuthGuard)
  createPost() {
    return { created: true };
  }
}
```

### Dynamic Route Registration

```typescript
function createCrudController(resource: string, service: any) {
  @Controller(`/api/${resource}`)
  class CrudController {
    @Get("/")
    list() {
      return service.findAll();
    }

    @Get("/:id")
    getById(@Param("id") id: string) {
      return service.findById(id);
    }

    @Post("/")
    create(@Body() data: any) {
      return service.create(data);
    }

    @Put("/:id")
    update(@Param("id") id: string, @Body() data: any) {
      return service.update(id, data);
    }

    @Delete("/:id")
    delete(@Param("id") id: string) {
      return service.delete(id);
    }
  }

  return CrudController;
}
```

### Content Negotiation

```typescript
@Controller("/api/data")
export class DataController {
  @Get("/export")
  exportData(@Headers("accept") accept: string) {
    if (accept.includes("application/json")) {
      return { data: [], format: "json" };
    } else if (accept.includes("text/csv")) {
      return "id,name,email\n1,John,john@example.com";
    } else {
      return { error: "Unsupported format" };
    }
  }
}
```

---

## Troubleshooting

### Route Not Found

**Problem:** 404 error for defined routes

**Solution:** Check path combination:

```typescript
@Controller("/api/users") // Base path
export class UserController {
  @Get("/profile") // Final: /api/users/profile
  getProfile() {}
}
```

### Route Conflicts

**Problem:** Multiple routes match same pattern

**Solution:** Order specific routes before generic ones:

```typescript
@Get('/search')     // Specific - first
@Get('/:id')        // Generic - second
```

### Parameters Not Extracted

**Problem:** Route params are undefined

**Solution:** Use parameter decorators:

```typescript
@Get('/:id')
getUser(@Param('id') id: string) {  // Use @Param
  return { id };
}
```

---

## Related Documentation

- [Controller Decorator](./CONTROLLER_DECORATOR.md)
- [Parameter Decorators](./PARAMS_DECORATOR.md)
- [Guards](./GUARDS_DECORATOR.md)
- [Interceptors](./INTERCEPTORS_DECORATOR.md)

---

**Last Updated**: December 4, 2025
