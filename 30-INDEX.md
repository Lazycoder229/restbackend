# Index (Main Exports) Documentation

## Overview

The main index file exports all public APIs, decorators, services, and utilities from the Fynix framework for easy import and use.

## Table of Contents

- [Core Exports](#core-exports)
- [Decorators](#decorators)
- [Services](#services)
- [Utilities](#utilities)

---

## Core Exports

### Application Factory

```typescript
import { FynixFactory, FynixApplication } from "fynix";

const app = await FynixFactory.create(AppModule);
await app.listen(3000);
```

### Module System

```typescript
import { Module, Injectable } from "fynix";

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

---

## Decorators

### Entity & Column Decorators

```typescript
import { Entity, Column } from "fynix";

@Entity("users")
export class User {
  @Column({ type: "int", primaryKey: true })
  id: number;

  @Column({ type: "varchar", length: 100 })
  name: string;
}
```

### Controller Decorators

```typescript
import { Controller, Get, Post, Put, Delete } from "fynix";

@Controller("/users")
export class UsersController {
  @Get()
  getAll() {}

  @Post()
  create() {}
}
```

### Dependency Injection

```typescript
import { Injectable, Inject } from "fynix";

@Injectable()
export class UserService {
  constructor(@Inject(DatabaseService) private db: DatabaseService) {}
}
```

### Guards, Interceptors, Pipes

```typescript
import { UseGuards, UseInterceptors, UsePipes } from "fynix";

@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
@UsePipes(ValidationPipe)
@Controller("/api")
export class ApiController {}
```

---

## Services

### Database Services

```typescript
import {
  DatabaseService,
  Repository,
  BaseEntity,
  QueryBuilder,
  TransactionService,
} from "fynix";
```

### Authentication & Security

```typescript
import {
  JwtAuthGuard,
  ApiKeyGuard,
  SecurityService,
  OAuthService,
} from "fynix";
```

### Utilities

```typescript
import {
  Logger,
  ConfigService,
  CacheService,
  ValidationPipe,
  PaginationService,
  PerformanceService,
} from "fynix";
```

### Background Processing

```typescript
import { JobsService, WebSocketService } from "fynix";
```

### Testing

```typescript
import {
  TestingModule,
  createTestingModule,
  expect,
  useTransactionalTests,
  loadFixtures,
} from "fynix/testing";
```

---

## Utilities

### Exception Handling

```typescript
import {
  HttpException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from "fynix";

throw new NotFoundException("User not found");
```

### Parameter Decorators

```typescript
import {
  Param,
  Query,
  Body,
  Headers,
  Req,
  Res
} from 'fynix';

@Get('/:id')
getUser(@Param('id') id: string) {}

@Get()
search(@Query('q') query: string) {}

@Post()
create(@Body() data: CreateDto) {}
```

---

## Complete Import Example

```typescript
// Core
import {
  FynixFactory,
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
} from "fynix";

// Database
import { Entity, Column, Repository, BaseEntity, DatabaseService } from "fynix";

// Guards & Interceptors
import {
  UseGuards,
  UseInterceptors,
  UsePipes,
  JwtAuthGuard,
  ValidationPipe,
} from "fynix";

// Services
import { Logger, ConfigService, CacheService, SecurityService } from "fynix";

// Testing
import { createTestingModule, useTransactionalTests } from "fynix/testing";
```

---

## Related Documentation

- [Getting Started](./DOCSMED/00-GETTING_STARTED.md)
- [Framework Overview](./DOCSMED/01-FRAMEWORK_OVERVIEW.md)
- [Quick Reference](./DOCSMED/15-QUICK_REFERENCE.md)

---

**Last Updated**: December 4, 2025
