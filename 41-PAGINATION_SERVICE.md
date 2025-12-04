# Pagination Service Documentation

## Overview

The PaginationService provides comprehensive pagination functionality for database queries, API responses, and in-memory array pagination in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Pagination Options](#pagination-options)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { PaginationService, Paginate } from "./builtin/pagination.service";
```

---

## Basic Usage

### Simple Pagination

```typescript
const options = {
  page: 1,
  limit: 10,
};

const result = await PaginationService.paginate(users, 100, options);
// {
//   data: [...],
//   meta: {
//     page: 1,
//     limit: 10,
//     total: 100,
//     totalPages: 10,
//     hasNext: true,
//     hasPrev: false
//   }
// }
```

### With Query Builder

```typescript
const { limit, offset } = PaginationService.getSqlPagination({
  page: 2,
  limit: 20,
});

const users = await db.query(`SELECT * FROM users LIMIT ? OFFSET ?`, [
  limit,
  offset,
]);
```

---

## API Reference

### PaginationService

#### `paginate<T>(data: T[], total: number, options: PaginationOptions): PaginationResult<T>`

Create paginated response from data array.

```typescript
const result = PaginationService.paginate(items, totalCount, {
  page: 1,
  limit: 10,
});
```

#### `paginateArray<T>(items: T[], options: PaginationOptions): PaginationResult<T>`

Paginate in-memory array.

```typescript
const result = PaginationService.paginateArray(allItems, {
  page: 2,
  limit: 15,
  sortBy: "createdAt",
  sortOrder: "DESC",
});
```

#### `getSqlPagination(options: PaginationOptions): { limit: number; offset: number }`

Get SQL LIMIT and OFFSET values.

```typescript
const { limit, offset } = PaginationService.getSqlPagination({
  page: 3,
  limit: 20,
});
// { limit: 20, offset: 40 }
```

#### `getSqlOrderBy(options: PaginationOptions): string`

Get SQL ORDER BY clause.

```typescript
const orderBy = PaginationService.getSqlOrderBy({
  sortBy: "createdAt",
  sortOrder: "DESC",
});
// "ORDER BY createdAt DESC"
```

#### `parsePaginationQuery(query: any): PaginationOptions`

Parse query parameters into pagination options.

```typescript
const options = PaginationService.parsePaginationQuery({
  page: "2",
  limit: "20",
  sortBy: "name",
  order: "asc",
});
```

---

## Pagination Options

```typescript
interface PaginationOptions {
  page?: number; // Page number (default: 1)
  limit?: number; // Items per page (default: 10)
  sortBy?: string; // Field to sort by
  sortOrder?: "ASC" | "DESC"; // Sort direction
}
```

### PaginationResult

```typescript
interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## Best Practices

### 1. Set Reasonable Limits

```typescript
// Good - reasonable limits
const MAX_LIMIT = 100;
const limit = Math.min(query.limit || 10, MAX_LIMIT);

// Bad - unlimited
const limit = query.limit; // Could be 100000
```

### 2. Always Include Pagination Meta

```typescript
// Good - complete pagination info
return {
  data: items,
  meta: {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  },
};

// Bad - incomplete info
return {
  data: items,
  total: total,
};
```

### 3. Use Pagination Decorator

```typescript
// Good - automatic pagination parsing
@Get()
async getUsers(@Paginate() pagination: PaginationOptions) {
  return await this.userService.findAll(pagination);
}
```

### 4. Validate Page Numbers

```typescript
// Good - validate input
const page = Math.max(1, query.page || 1);
const limit = Math.max(1, Math.min(query.limit || 10, 100));

// Bad - no validation
const page = query.page;
const limit = query.limit;
```

---

## Examples

### Repository with Pagination

```typescript
@Injectable()
export class UserRepository extends Repository<User> {
  protected tableName = "users";

  async findAllPaginated(
    options: PaginationOptions
  ): Promise<PaginationResult<User>> {
    const { limit, offset } = PaginationService.getSqlPagination(options);
    const orderBy = PaginationService.getSqlOrderBy(options);

    // Get total count
    const [countResult] = await this.db.query(
      `SELECT COUNT(*) as total FROM ${this.tableName}`
    );
    const total = countResult[0].total;

    // Get paginated data
    const users = await this.db.query(
      `SELECT * FROM ${this.tableName} ${orderBy} LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return PaginationService.paginate(users, total, options);
  }
}
```

### Controller with Pagination

```typescript
@Controller("/api/products")
export class ProductController {
  @Get()
  async getProducts(@Paginate() pagination: PaginationOptions) {
    return await this.productService.findAll(pagination);
  }

  @Get("/search")
  async searchProducts(
    @Query("q") query: string,
    @Paginate() pagination: PaginationOptions
  ) {
    return await this.productService.search(query, pagination);
  }
}
```

### Service with Complete Pagination

```typescript
@Injectable()
export class ProductService {
  constructor(private productRepo: ProductRepository) {}

  async findAll(
    options: PaginationOptions
  ): Promise<PaginationResult<Product>> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 10, 100);
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "DESC";

    // Build query
    const { limit: sqlLimit, offset } = PaginationService.getSqlPagination({
      page,
      limit,
    });

    const orderBy = PaginationService.getSqlOrderBy({
      sortBy,
      sortOrder,
    });

    // Get total count
    const total = await this.productRepo.count();

    // Get data
    const products = await this.productRepo
      .query()
      .orderBy(sortBy, sortOrder)
      .limit(sqlLimit)
      .offset(offset)
      .get();

    return PaginationService.paginate(products, total, {
      page,
      limit,
    });
  }

  async search(
    searchTerm: string,
    options: PaginationOptions
  ): Promise<PaginationResult<Product>> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 10, 100);

    // Count matching results
    const total = await this.productRepo
      .query()
      .where("name", "LIKE", `%${searchTerm}%`)
      .count();

    // Get paginated results
    const products = await this.productRepo
      .query()
      .where("name", "LIKE", `%${searchTerm}%`)
      .paginate(page, limit);

    return PaginationService.paginate(products.data, total, {
      page,
      limit,
    });
  }
}
```

### In-Memory Array Pagination

```typescript
@Injectable()
export class ReportService {
  async generateReport(filters: any): Promise<PaginationResult<Report>> {
    // Get all data
    const allData = await this.fetchReportData(filters);

    // Paginate in memory
    return PaginationService.paginateArray(allData, {
      page: filters.page || 1,
      limit: filters.limit || 20,
      sortBy: "date",
      sortOrder: "DESC",
    });
  }
}
```

### API Response Example

```typescript
GET /api/users?page=2&limit=20&sortBy=createdAt&order=desc

Response:
{
  "data": [
    { "id": 21, "name": "User 21", ... },
    { "id": 22, "name": "User 22", ... },
    ...
  ],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## Related Documentation

- [Query Builder](./QUERY_BUILDER.md)
- [Repository Pattern](./REPOSITORY.md)
- [Controllers](./CONTROLLER_DECORATOR.md)
- [Params Decorator](./PARAMS_DECORATOR.md)

---

**Last Updated**: December 4, 2025
