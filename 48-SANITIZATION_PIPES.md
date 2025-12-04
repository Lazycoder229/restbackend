# Sanitization Pipes Documentation

## Overview

The Sanitization Pipes provide input sanitization to prevent XSS attacks, SQL injection, and other security vulnerabilities in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Built-in Pipes](#built-in-pipes)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  SanitizeHtmlPipe,
  SqlSanitizePipe,
  Sanitize,
} from "./builtin/sanitization.pipes";
```

---

## Built-in Pipes

### SanitizeHtmlPipe

Sanitizes HTML to prevent XSS attacks.

```typescript
@Post('/posts')
async createPost(@Body(new SanitizeHtmlPipe()) data: CreatePostDto) {
  return await this.postService.create(data);
}
```

### SqlSanitizePipe

Escapes SQL special characters.

```typescript
@Get('/search')
async search(@Query('q', new SqlSanitizePipe()) query: string) {
  return await this.service.search(query);
}
```

---

## API Reference

### @Sanitize Decorator

```typescript
class CreatePostDto {
  @Sanitize()
  title: string;

  @Sanitize()
  content: string;
}
```

### SanitizationService

#### `stripHtml(input: string): string`

Remove all HTML tags.

```typescript
const clean = SanitizationService.stripHtml("<p>Hello</p>");
// "Hello"
```

---

## Examples

### Controller with Sanitization

```typescript
@Controller("/posts")
export class PostController {
  @Post()
  async create(@Body(new SanitizeHtmlPipe()) data: CreatePostDto) {
    return await this.postService.create(data);
  }

  @Get("/search")
  async search(@Query("q", new SqlSanitizePipe()) query: string) {
    return await this.postService.search(query);
  }
}
```

---

## Related Documentation

- [Validation Pipe](./VALIDATION_PIPE.md)
- [Transform Pipes](./TRANSFORM_PIPES.md)
- [Security Service](./SECURITY_SERVICE.md)

---

**Last Updated**: December 4, 2025
