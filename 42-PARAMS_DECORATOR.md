# Parameter Decorators Documentation

## Overview

Parameter Decorators in the Fynix framework enable extraction of data from HTTP requests directly into controller method parameters. They provide a clean, declarative way to access request data such as route parameters, query strings, request bodies, headers, and more.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Available Decorators](#available-decorators)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)
- [Type Safety](#type-safety)
- [Troubleshooting](#troubleshooting)

---

## Installation & Setup

```typescript
import "reflect-metadata";
import {
  Param,
  Query,
  Body,
  Headers,
  Req,
  Res,
} from "./decorators/params.decorator";
```

---

## Available Decorators

| Decorator  | Purpose                         | Example                     |
| ---------- | ------------------------------- | --------------------------- |
| `@Param`   | Extract route parameters        | `@Param('id')`              |
| `@Query`   | Extract query string parameters | `@Query('page')`            |
| `@Body`    | Extract request body            | `@Body()`                   |
| `@Headers` | Extract request headers         | `@Headers('authorization')` |
| `@Req`     | Access full request object      | `@Req()`                    |
| `@Res`     | Access response object          | `@Res()`                    |

---

## API Reference

### @Param

Extracts route parameters from the URL path.

**Signature:**

```typescript
@Param(data?: string): ParameterDecorator
```

**Parameters:**

- `data` (optional): Specific parameter name to extract

**Example:**

```typescript
@Get('/:id')
getUser(@Param('id') id: string) {
  return { id };
}

@Get('/:userId/posts/:postId')
getPost(
  @Param('userId') userId: string,
  @Param('postId') postId: string
) {
  return { userId, postId };
}

@Get('/:id')
getUserWithAllParams(@Param() params: any) {
  return { id: params.id };
}
```

### @Query

Extracts query string parameters.

**Signature:**

```typescript
@Query(data?: string): ParameterDecorator
```

**Parameters:**

- `data` (optional): Specific query parameter name to extract

**Example:**

```typescript
@Get('/search')
search(@Query('q') query: string) {
  return { query };
}

@Get('/products')
listProducts(
  @Query('page') page: number,
  @Query('limit') limit: number,
  @Query('category') category?: string
) {
  return { page, limit, category };
}

@Get('/filter')
filter(@Query() queryParams: any) {
  return { filters: queryParams };
}
```

### @Body

Extracts the request body (for POST, PUT, PATCH requests).

**Signature:**

```typescript
@Body(data?: string): ParameterDecorator
```

**Parameters:**

- `data` (optional): Specific property from body to extract

**Example:**

```typescript
@Post('/users')
createUser(@Body() userData: any) {
  return { created: true, user: userData };
}

@Post('/login')
login(
  @Body('email') email: string,
  @Body('password') password: string
) {
  return { email, password };
}

@Patch('/:id')
updateUser(
  @Param('id') id: string,
  @Body() updates: any
) {
  return { id, updates };
}
```

### @Headers

Extracts request headers.

**Signature:**

```typescript
@Headers(data?: string): ParameterDecorator
```

**Parameters:**

- `data` (optional): Specific header name to extract

**Example:**

```typescript
@Get('/data')
getData(@Headers('authorization') token: string) {
  return { token };
}

@Post('/webhook')
handleWebhook(
  @Headers('x-signature') signature: string,
  @Body() payload: any
) {
  return { signature, payload };
}

@Get('/info')
getInfo(@Headers() headers: any) {
  return { headers };
}
```

### @Req

Provides access to the full request object.

**Signature:**

```typescript
@Req(): ParameterDecorator
```

**Example:**

```typescript
@Get('/info')
getRequestInfo(@Req() request: any) {
  return {
    method: request.method,
    url: request.url,
    headers: request.headers,
    ip: request.ip
  };
}

@Post('/upload')
uploadFile(@Req() req: any, @Body() metadata: any) {
  return {
    contentType: req.headers['content-type'],
    metadata
  };
}
```

### @Res

Provides access to the response object.

**Signature:**

```typescript
@Res(): ParameterDecorator
```

**Example:**

```typescript
@Get('/download')
downloadFile(@Res() res: any) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="file.pdf"');
  res.send(Buffer.from('PDF content'));
}

@Get('/redirect')
redirect(@Res() res: any) {
  res.redirect('/new-location');
}
```

---

## Usage Examples

### Route Parameters

```typescript
@Controller("/api/users")
export class UserController {
  @Get("/:id")
  getUser(@Param("id") id: string) {
    return { user: { id, name: "John Doe" } };
  }

  @Get("/:userId/posts/:postId")
  getUserPost(
    @Param("userId") userId: string,
    @Param("postId") postId: string
  ) {
    return { userId, postId, post: {} };
  }

  @Delete("/:id")
  deleteUser(@Param("id") id: string) {
    return { deleted: true, id };
  }
}
```

### Query Parameters

```typescript
@Controller("/api/products")
export class ProductController {
  @Get("/")
  listProducts(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("search") search?: string,
    @Query("category") category?: string
  ) {
    return {
      products: [],
      pagination: { page, limit },
      filters: { search, category },
    };
  }

  @Get("/search")
  searchProducts(
    @Query("q") query: string,
    @Query("minPrice") minPrice?: number,
    @Query("maxPrice") maxPrice?: number
  ) {
    return { query, priceRange: { min: minPrice, max: maxPrice } };
  }
}
```

### Request Body

```typescript
@Controller("/api/posts")
export class PostController {
  @Post("/")
  createPost(@Body() postData: any) {
    return {
      created: true,
      post: {
        id: "123",
        ...postData,
      },
    };
  }

  @Put("/:id")
  updatePost(@Param("id") id: string, @Body() postData: any) {
    return {
      updated: true,
      post: { id, ...postData },
    };
  }

  @Patch("/:id")
  partialUpdate(
    @Param("id") id: string,
    @Body("title") title?: string,
    @Body("content") content?: string
  ) {
    return {
      updated: true,
      changes: { title, content },
    };
  }
}
```

### Headers

```typescript
@Controller("/api/secure")
export class SecureController {
  @Get("/data")
  getData(
    @Headers("authorization") authToken: string,
    @Headers("x-api-key") apiKey: string
  ) {
    // Verify token and api key
    return { data: [], authToken, apiKey };
  }

  @Post("/webhook")
  handleWebhook(
    @Headers("x-webhook-signature") signature: string,
    @Body() payload: any
  ) {
    // Verify signature
    return { received: true, signature };
  }

  @Get("/client-info")
  getClientInfo(
    @Headers("user-agent") userAgent: string,
    @Headers("accept-language") language: string,
    @Req() req: any
  ) {
    return {
      userAgent,
      language,
      ip: req.ip,
    };
  }
}
```

### Combining Multiple Decorators

```typescript
@Controller("/api/orders")
export class OrderController {
  @Post("/")
  createOrder(
    @Headers("authorization") token: string,
    @Body() orderData: any,
    @Query("coupon") couponCode?: string
  ) {
    return {
      created: true,
      order: orderData,
      couponApplied: !!couponCode,
      authenticatedUser: token,
    };
  }

  @Get("/:id")
  getOrder(
    @Param("id") id: string,
    @Query("include") include?: string,
    @Headers("authorization") token: string
  ) {
    return {
      order: { id },
      includes: include?.split(","),
      user: token,
    };
  }

  @Put("/:id/status")
  updateOrderStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @Body("notes") notes?: string,
    @Req() req: any
  ) {
    return {
      orderId: id,
      newStatus: status,
      notes,
      updatedBy: req.user?.id,
    };
  }
}
```

### File Upload

```typescript
@Controller("/api/files")
export class FileController {
  @Post("/upload")
  uploadFile(
    @Body("filename") filename: string,
    @Body("data") fileData: any,
    @Headers("content-type") contentType: string,
    @Req() req: any
  ) {
    return {
      uploaded: true,
      filename,
      size: fileData.length,
      contentType,
      uploadedBy: req.user?.id,
    };
  }

  @Get("/download/:id")
  downloadFile(@Param("id") id: string, @Res() res: any) {
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${id}.txt"`);
    res.send("File content here");
  }
}
```

---

## Advanced Patterns

### Custom Parameter Decorator

```typescript
export function User(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    // Store metadata that extracts user from request
    const params: ParameterMetadata[] =
      Reflect.getMetadata(
        PARAM_METADATA,
        target.constructor,
        propertyKey as string
      ) || [];

    params.push({
      index: parameterIndex,
      type: "custom",
      data: "user",
      extractor: (req: any) => req.user,
    });

    Reflect.defineMetadata(
      PARAM_METADATA,
      params,
      target.constructor,
      propertyKey as string
    );
  };
}

// Usage
@Controller("/api/profile")
export class ProfileController {
  @Get("/")
  getProfile(@User() user: any) {
    return { profile: user };
  }
}
```

### Type Conversion

```typescript
export function ParseInt(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    // Metadata to parse string to int
  };
}

// Usage
@Get('/page/:number')
getPage(@Param('number') @ParseInt() pageNumber: number) {
  return { page: pageNumber };
}
```

### Validation Decorator

```typescript
export function Validate(schema: any): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    // Store validation schema
  };
}

// Usage
@Post('/users')
createUser(@Body() @Validate(userSchema) userData: any) {
  return { created: true, user: userData };
}
```

### Default Values

```typescript
@Controller("/api/search")
export class SearchController {
  @Get("/products")
  search(
    @Query("q") query: string = "",
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("sort") sort: string = "createdAt",
    @Query("order") order: "asc" | "desc" = "desc"
  ) {
    return {
      query: query || "all",
      pagination: { page, limit },
      sorting: { field: sort, order },
    };
  }
}
```

### Optional Parameters

```typescript
@Controller("/api/users")
export class UserController {
  @Get("/")
  listUsers(
    @Query("filter") filter?: string,
    @Query("fields") fields?: string,
    @Query("expand") expand?: string
  ) {
    return {
      users: [],
      appliedFilter: filter || "none",
      selectedFields: fields?.split(",") || ["all"],
      expanded: expand?.split(",") || [],
    };
  }
}
```

---

## Best Practices

### 1. Be Explicit with Parameter Names

```typescript
// Good
@Get('/:userId/posts/:postId')
getPost(
  @Param('userId') userId: string,
  @Param('postId') postId: string
) {
  return { userId, postId };
}

// Avoid - unclear parameter names
@Get('/:id1/posts/:id2')
getPost(
  @Param('id1') id1: string,
  @Param('id2') id2: string
) {
  return { id1, id2 };
}
```

### 2. Use Appropriate Decorators

```typescript
// Good - right decorator for the job
@Get('/search')
search(@Query('q') query: string) { }

@Get('/:id')
getById(@Param('id') id: string) { }

@Post('/')
create(@Body() data: any) { }

// Avoid - using wrong decorator
@Get('/:id')
getById(@Query('id') id: string) { }  // Should use @Param
```

### 3. Provide Default Values

```typescript
// Good
@Get('/products')
listProducts(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10
) {
  return { page, limit };
}

// Avoid - no defaults, might be undefined
@Get('/products')
listProducts(
  @Query('page') page: number,
  @Query('limit') limit: number
) {
  return { page, limit };
}
```

### 4. Use Type Annotations

```typescript
// Good - explicit types
@Get('/:id')
getUser(
  @Param('id') id: string,
  @Query('include') include: string[]
) {
  return { id, include };
}

// Avoid - any type
@Get('/:id')
getUser(
  @Param('id') id: any,
  @Query('include') include: any
) {
  return { id, include };
}
```

### 5. Extract Specific Body Fields When Needed

```typescript
// Good - extract specific fields
@Post('/login')
login(
  @Body('email') email: string,
  @Body('password') password: string
) {
  return { email };
}

// Also good - full body when needed
@Post('/users')
createUser(@Body() userData: CreateUserDto) {
  return userData;
}
```

### 6. Document Parameter Purpose

```typescript
/**
 * Get user posts with pagination
 *
 * @param userId - The ID of the user
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 */
@Get('/:userId/posts')
getUserPosts(
  @Param('userId') userId: string,
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10
) {
  return { userId, page, limit, posts: [] };
}
```

---

## Type Safety

### Using DTOs (Data Transfer Objects)

```typescript
// Define DTO
interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  bio?: string;
}

// Use in controller
@Controller("/api/users")
export class UserController {
  @Post("/")
  createUser(@Body() userData: CreateUserDto) {
    return { created: true, user: userData };
  }

  @Patch("/:id")
  updateUser(@Param("id") id: string, @Body() updates: UpdateUserDto) {
    return { updated: true, id, updates };
  }
}
```

### Query Parameter Types

```typescript
interface SearchParams {
  q: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

@Controller("/api/search")
export class SearchController {
  @Get("/products")
  search(@Query() params: SearchParams) {
    return {
      query: params.q,
      filters: {
        category: params.category,
        priceRange: {
          min: params.minPrice,
          max: params.maxPrice,
        },
      },
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
      },
    };
  }
}
```

---

## Troubleshooting

### Parameter is Undefined

**Problem:** Decorated parameter is undefined

**Solution:** Ensure parameter name matches route/query:

```typescript
// Route: /users/:userId
@Get('/:userId')
getUser(@Param('userId') userId: string) {  // Must match :userId
  return { userId };
}
```

### Wrong Decorator Used

**Problem:** Not getting expected data

**Solution:** Use correct decorator:

- Route params → `@Param`
- Query strings → `@Query`
- Request body → `@Body`
- Headers → `@Headers`

### Type Conversion Issues

**Problem:** Numbers coming as strings

**Solution:** Parse in handler or use validation pipes:

```typescript
@Get('/page/:number')
getPage(@Param('number') number: string) {
  const pageNum = parseInt(number, 10);
  return { page: pageNum };
}
```

---

## Related Documentation

- [HTTP Methods](./HTTP_METHODS_DECORATOR.md)
- [Controller](./CONTROLLER_DECORATOR.md)
- [Pipes](./PIPES_DECORATOR.md)
- [Validation](./DOCSMED/08-VALIDATION_PIPES.md)

---

**Last Updated**: December 4, 2025
