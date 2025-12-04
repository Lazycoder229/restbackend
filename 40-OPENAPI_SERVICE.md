# OpenAPI Service Documentation

## Overview

The OpenApiService automatically generates OpenAPI 3.0 (Swagger) documentation from your Fynix application's decorators and metadata.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { OpenApiService } from "./builtin/openapi.service";
```

---

## Configuration

```typescript
const openapi = new OpenApiService({
  title: "My API",
  version: "1.0.0",
  description: "API documentation",
  basePath: "/api",
  servers: [
    { url: "http://localhost:3000", description: "Development" },
    { url: "https://api.example.com", description: "Production" },
  ],
  security: [{ bearerAuth: [] }],
});
```

---

## API Reference

### `generateSpec(app): OpenAPIObject`

Generate OpenAPI specification from application.

### `setupSwaggerUI(app, path): void`

Setup Swagger UI at specified path.

---

## Examples

### Enable Swagger Documentation

```typescript
const app = await FynixFactory.create(AppModule);

const openapi = new OpenApiService({
  title: "Fynix API",
  version: "1.0.0",
  description: "REST API documentation",
});

openapi.setupSwaggerUI(app, "/docs");

await app.listen(3000);

// Access documentation at: http://localhost:3000/docs
```

### Annotate Controllers

```typescript
@Controller("/users")
@ApiTags("users")
export class UsersController {
  @Get("/:id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User found" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUser(@Param("id") id: string) {
    return await User.findById(id);
  }

  @Post()
  @ApiOperation({ summary: "Create new user" })
  @ApiBody({ type: CreateUserDto })
  async createUser(@Body() data: CreateUserDto) {
    return await User.create(data);
  }
}
```

---

## Related Documentation

- [Controllers](./CONTROLLER_DECORATOR.md)
- [Documentation Generator](./DOCUMENTATION_GENERATOR.md)

---

**Last Updated**: December 4, 2025
