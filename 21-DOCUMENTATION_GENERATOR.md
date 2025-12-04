# Documentation Generator Documentation

## Overview

The DocumentationGenerator automatically generates comprehensive API documentation from code annotations, decorators, and metadata in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { DocumentationGenerator } from "./builtin/documentation.generator";
```

---

## Configuration

```typescript
const docGen = new DocumentationGenerator({
  outputDir: "docs",
  format: "markdown", // or 'html', 'json'
  includePrivate: false,
  includeExamples: true,
  theme: "default",
});
```

---

## API Reference

### `generate(app): Promise<void>`

Generate documentation from application.

### `generateMarkdown(): Promise<string>`

Generate Markdown documentation.

### `generateHTML(): Promise<string>`

Generate HTML documentation.

### `generateJSON(): Promise<object>`

Generate JSON documentation.

---

## Examples

### Generate Documentation

```typescript
import { DocumentationGenerator } from "./builtin/documentation.generator";

const app = await FynixFactory.create(AppModule);

const docGen = new DocumentationGenerator({
  outputDir: "docs",
  format: "markdown",
});

await docGen.generate(app);

console.log("Documentation generated in ./docs");
```

### Custom Documentation

```typescript
@Controller("/users")
@ApiTags("Users")
@ApiDescription("User management endpoints")
export class UsersController {
  @Get("/:id")
  @ApiOperation({
    summary: "Get user by ID",
    description: "Retrieves a single user by their unique identifier",
    tags: ["users"],
  })
  @ApiResponse({
    status: 200,
    description: "User found",
    example: { id: 1, name: "John", email: "john@example.com" },
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async getUser(@Param("id") id: string) {
    return await User.findById(id);
  }
}

// Generate documentation
await docGen.generate(app);
```

### Generate Multiple Formats

```typescript
const docGen = new DocumentationGenerator({
  outputDir: "docs",
});

// Markdown
await docGen.generateMarkdown();

// HTML
await docGen.generateHTML();

// JSON
const json = await docGen.generateJSON();
console.log(json);
```

---

## Related Documentation

- [OpenAPI Service](./OPENAPI_SERVICE.md)
- [CLI](./CLI.md)
- [Controllers](./CONTROLLER_DECORATOR.md)

---

**Last Updated**: December 4, 2025
