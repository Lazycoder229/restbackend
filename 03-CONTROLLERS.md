# Controllers & Routing

Controllers are responsible for handling incoming HTTP requests and returning responses.

---

## 📋 Table of Contents

- [Controller Basics](#controller-basics)
- [HTTP Method Decorators](#http-method-decorators)
- [Route Parameters](#route-parameters)
- [Request Body & Query](#request-body--query)
- [Response Handling](#response-handling)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## 🎯 Controller Basics

### Creating a Controller

```typescript
import { Controller, Get } from "@fynixjs/fynix";

@Controller("/users")
export class UserController {
  @Get()
  findAll() {
    return { users: [] };
  }
}
```

### Controller Path

The `@Controller()` decorator accepts a base path:

```typescript
@Controller("/api/v1/users")
export class UserController {
  // All routes will be prefixed with /api/v1/users
}
```

### Registering Controllers

Controllers must be registered in a module:

```typescript
@Module({
  controllers: [UserController],
})
export class AppModule {}
```

---

## 🔄 HTTP Method Decorators

FynixJS supports all standard HTTP methods:

### GET Requests

```typescript
@Controller("/users")
export class UserController {
  @Get()
  findAll() {
    return { users: [] };
  }

  @Get("/active")
  findActive() {
    return { users: [], filter: "active" };
  }
}
```

### POST Requests

```typescript
@Post()
create(@Body() body: any) {
  return { message: "User created", data: body };
}

@Post("/bulk")
createMany(@Body() users: any[]) {
  return { message: `${users.length} users created` };
}
```

### PUT Requests

```typescript
@Put("/:id")
update(@Param("id") id: string, @Body() body: any) {
  return { message: `User ${id} updated`, data: body };
}
```

### DELETE Requests

```typescript
@Delete("/:id")
remove(@Param("id") id: string) {
  return { message: `User ${id} deleted` };
}
```

### PATCH Requests

```typescript
@Patch("/:id")
partialUpdate(@Param("id") id: string, @Body() body: any) {
  return { message: `User ${id} partially updated` };
}
```

### Other Methods

```typescript
@Options()
getOptions() {
  return { methods: ["GET", "POST", "PUT", "DELETE"] };
}

@Head()
checkExists() {
  // Return headers only
}
```

---

## 🔗 Route Parameters

### Path Parameters

```typescript
@Get("/:id")
findOne(@Param("id") id: string) {
  return { userId: id };
}

@Get("/:userId/posts/:postId")
findPost(
  @Param("userId") userId: string,
  @Param("postId") postId: string
) {
  return { userId, postId };
}
```

### Multiple Parameters

```typescript
@Get("/:category/:subcategory/:id")
findProduct(
  @Param("category") category: string,
  @Param("subcategory") subcategory: string,
  @Param("id") id: string
) {
  return { category, subcategory, id };
}
```

### All Parameters Object

```typescript
@Get("/:id")
findOne(@Param() params: any) {
  console.log(params); // { id: "123" }
  return { userId: params.id };
}
```

---

## 🔍 Request Body & Query

### Query Parameters

```typescript
@Get()
findAll(@Query("page") page: string, @Query("limit") limit: string) {
  return {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10
  };
}

// All query params
@Get()
findAll(@Query() query: any) {
  console.log(query); // { page: "1", limit: "10", search: "john" }
  return query;
}
```

### Request Body

```typescript
@Post()
create(@Body() body: any) {
  return { created: body };
}

// Destructure specific fields
@Post()
create(@Body() { name, email }: { name: string; email: string }) {
  return { name, email };
}
```

### Headers

```typescript
@Get()
findAll(@Headers("authorization") auth: string) {
  console.log(auth); // "Bearer token..."
  return { authenticated: !!auth };
}

// All headers
@Get()
findAll(@Headers() headers: any) {
  return { headers };
}
```

### Request & Response Objects

```typescript
@Get()
findAll(@Req() request: any, @Res() response: any) {
  console.log(request.url);
  console.log(request.method);

  // Manual response
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ message: "Custom response" }));
}
```

---

## 📤 Response Handling

### Automatic JSON Response

By default, return values are serialized to JSON:

```typescript
@Get()
findAll() {
  return { users: [], count: 0 }; // Automatically becomes JSON
}
```

### Status Codes

```typescript
import { HttpException } from "@fynixjs/fynix";

@Get("/:id")
findOne(@Param("id") id: string) {
  if (id === "0") {
    throw new HttpException("User not found", 404);
  }
  return { id, name: "John" };
}
```

### Custom Response

```typescript
@Get()
customResponse(@Res() response: any) {
  response.writeHead(201, {
    "Content-Type": "application/json",
    "X-Custom-Header": "value"
  });
  response.end(JSON.stringify({ message: "Created" }));
}
```

---

## ⚠️ Error Handling

### HTTP Exceptions

```typescript
import {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException
} from "@fynixjs/fynix";

@Get("/:id")
findOne(@Param("id") id: string) {
  if (!id) {
    throw new BadRequestException("ID is required");
  }

  const user = this.userService.findById(id);
  if (!user) {
    throw new NotFoundException(`User ${id} not found`);
  }

  return user;
}
```

### Built-in Exception Classes

```typescript
// 400 Bad Request
throw new BadRequestException("Invalid input");

// 401 Unauthorized
throw new UnauthorizedException("Please login");

// 403 Forbidden
throw new ForbiddenException("Access denied");

// 404 Not Found
throw new NotFoundException("Resource not found");

// 500 Internal Server Error
throw new InternalServerErrorException("Server error");

// Custom status code
throw new HttpException("Custom error", 418);
```

### Try-Catch Pattern

```typescript
@Post()
async create(@Body() body: any) {
  try {
    const user = await this.userService.create(body);
    return { success: true, user };
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}
```

---

## 🎨 Advanced Patterns

### Async/Await

```typescript
@Get()
async findAll() {
  const users = await this.userService.findAll();
  return { users };
}

@Post()
async create(@Body() body: any) {
  const user = await this.userService.create(body);
  return { user };
}
```

### Dependency Injection in Controllers

```typescript
@Controller("/users")
export class UserController {
  constructor(
    private userService: UserService,
    private emailService: EmailService,
    private loggerService: LoggerService
  ) {}

  @Post()
  async create(@Body() body: any) {
    const user = await this.userService.create(body);
    await this.emailService.sendWelcome(user.email);
    this.loggerService.log(`User created: ${user.id}`);
    return user;
  }
}
```

### Route Organization

```typescript
@Controller("/api/v1/users")
export class UserController {
  // GET /api/v1/users
  @Get()
  findAll() {}

  // GET /api/v1/users/:id
  @Get("/:id")
  findOne() {}

  // POST /api/v1/users
  @Post()
  create() {}

  // PUT /api/v1/users/:id
  @Put("/:id")
  update() {}

  // DELETE /api/v1/users/:id
  @Delete("/:id")
  remove() {}
}
```

---

## ✅ Best Practices

### 1. Keep Controllers Thin

Controllers should delegate business logic to services:

```typescript
// ❌ Bad - logic in controller
@Controller("/users")
export class UserController {
  @Get()
  findAll() {
    // Database query, validation, transformation...
    return { users: [] };
  }
}

// ✅ Good - delegate to service
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }
}
```

### 2. Use Descriptive Route Names

```typescript
// ❌ Bad
@Get("/g")
get() {}

// ✅ Good
@Get("/active-users")
getActiveUsers() {}
```

### 3. Validate Input

```typescript
@Post()
create(@Body() body: any) {
  if (!body.name || !body.email) {
    throw new BadRequestException("Name and email are required");
  }
  return this.userService.create(body);
}
```

### 4. Use Proper HTTP Status Codes

```typescript
@Post()
async create(@Body() body: any) {
  const user = await this.userService.create(body);
  return { statusCode: 201, user }; // Created
}

@Delete("/:id")
async remove(@Param("id") id: string) {
  await this.userService.remove(id);
  return { statusCode: 204 }; // No Content
}
```

### 5. Document Your Routes

```typescript
/**
 * Get all users with pagination
 * @route GET /users
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 */
@Get()
findAll(@Query("page") page: string, @Query("limit") limit: string) {
  return this.userService.findAll(page, limit);
}
```

---

## 📚 Next Steps

- [Modules](./04-MODULES.md)
- [Guards & Interceptors](./07-GUARDS_INTERCEPTORS.md)
- [Examples](./10-EXAMPLES.md)

---

**Master controllers and routing to build powerful REST APIs with FynixJS!**
