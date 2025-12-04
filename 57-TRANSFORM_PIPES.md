# Transform Pipes Documentation

## Overview

The Transform Pipes provide automatic type conversion and transformation for request parameters in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Built-in Pipes](#built-in-pipes)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  ParseIntPipe,
  ParseFloatPipe,
  ParseBoolPipe,
  ParseArrayPipe,
} from "./builtin/transform.pipes";
```

---

## Built-in Pipes

### ParseIntPipe

Convert string to integer.

```typescript
@Get('/:id')
async getUser(@Param('id', new ParseIntPipe()) id: number) {
  return await this.userService.findById(id);
}
```

### ParseFloatPipe

Convert string to float.

```typescript
@Get('/products')
async getProducts(@Query('price', new ParseFloatPipe()) price: number) {
  return await this.productService.findByPrice(price);
}
```

### ParseBoolPipe

Convert string to boolean.

```typescript
@Get('/users')
async getUsers(@Query('active', new ParseBoolPipe()) active: boolean) {
  return await this.userService.findByActive(active);
}
```

### ParseArrayPipe

Convert string to array.

```typescript
@Get('/products')
async getProducts(@Query('tags', new ParseArrayPipe()) tags: string[]) {
  return await this.productService.findByTags(tags);
}
```

---

## API Reference

### ParseIntPipe

```typescript
new ParseIntPipe({ min: 1, max: 100 });
```

### ParseFloatPipe

```typescript
new ParseFloatPipe({ min: 0, max: 1000 });
```

### ParseArrayPipe

```typescript
new ParseArrayPipe({ separator: ",", items: "number" });
```

---

## Examples

### Complete Usage

```typescript
@Controller("/products")
export class ProductController {
  @Get("/:id")
  async getProduct(@Param("id", new ParseIntPipe({ min: 1 })) id: number) {
    return await this.productService.findById(id);
  }

  @Get()
  async getProducts(
    @Query("minPrice", new ParseFloatPipe({ min: 0 })) minPrice: number,
    @Query("maxPrice", new ParseFloatPipe({ max: 10000 })) maxPrice: number,
    @Query("inStock", new ParseBoolPipe()) inStock: boolean,
    @Query("categories", new ParseArrayPipe()) categories: string[]
  ) {
    return await this.productService.find({
      minPrice,
      maxPrice,
      inStock,
      categories,
    });
  }
}
```

---

## Related Documentation

- [Validation Pipe](./VALIDATION_PIPE.md)
- [Sanitization Pipes](./SANITIZATION_PIPES.md)
- [Params Decorator](./PARAMS_DECORATOR.md)

---

**Last Updated**: December 4, 2025
