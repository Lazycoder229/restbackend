# Metadata Documentation

## Overview

The metadata module defines all metadata keys, interfaces, and types used by Fynix's decorator system for reflection and dependency injection.

## Table of Contents

- [Metadata Keys](#metadata-keys)
- [Type Definitions](#type-definitions)
- [Interfaces](#interfaces)
- [Examples](#examples)

---

## Metadata Keys

### Core Metadata Keys

```typescript
export const CONTROLLER_METADATA = "controller:path";
export const ROUTE_METADATA = "route:metadata";
export const INJECTABLE_METADATA = "injectable:metadata";
export const MODULE_METADATA = "module:metadata";
export const PARAM_METADATA = "param:metadata";
export const GUARDS_METADATA = "guards:metadata";
export const INTERCEPTORS_METADATA = "interceptors:metadata";
export const PIPES_METADATA = "pipes:metadata";
export const ENTITY_METADATA = "entity:metadata";
```

---

## Type Definitions

### HTTP Methods

```typescript
type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";
```

### Provider Scope

```typescript
enum Scope {
  DEFAULT = "DEFAULT", // Singleton
  TRANSIENT = "TRANSIENT", // New instance per injection
  REQUEST = "REQUEST", // New instance per request
}
```

---

## Interfaces

### RouteMetadata

```typescript
interface RouteMetadata {
  path: string;
  method: HttpMethod;
  methodName: string;
}
```

### ParameterMetadata

```typescript
interface ParameterMetadata {
  index: number;
  type: "param" | "query" | "body" | "headers" | "req" | "res";
  data?: string;
}
```

### ModuleMetadata

```typescript
interface ModuleMetadata {
  imports?: any[];
  controllers?: any[];
  providers?: any[];
  exports?: any[];
}
```

### ProviderMetadata

```typescript
interface ProviderMetadata {
  scope?: Scope;
}
```

---

## Examples

### Reading Metadata

```typescript
import "reflect-metadata";
import { CONTROLLER_METADATA, ROUTE_METADATA } from "./core/metadata";

// Get controller path
const controllerPath = Reflect.getMetadata(CONTROLLER_METADATA, UserController);

// Get routes
const routes: RouteMetadata[] =
  Reflect.getMetadata(ROUTE_METADATA, UserController) || [];

console.log("Controller Path:", controllerPath);
console.log("Routes:", routes);
```

### Setting Metadata

```typescript
import { INJECTABLE_METADATA, Scope } from "./core/metadata";

// Set injectable metadata
Reflect.defineMetadata(
  INJECTABLE_METADATA,
  { scope: Scope.TRANSIENT },
  MyService
);
```

### Custom Decorator with Metadata

```typescript
import { ROUTE_METADATA, RouteMetadata } from "./core/metadata";

export function CustomRoute(path: string, method: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const routes: RouteMetadata[] =
      Reflect.getMetadata(ROUTE_METADATA, target.constructor) || [];

    routes.push({
      path,
      method: method as any,
      methodName: propertyKey,
    });

    Reflect.defineMetadata(ROUTE_METADATA, routes, target.constructor);
  };
}
```

### Working with Scopes

```typescript
import { Injectable } from "./decorators/injectable.decorator";
import { Scope } from "./core/metadata";

// Singleton (default)
@Injectable()
class SingletonService {}

// Transient
@Injectable({ scope: Scope.TRANSIENT })
class TransientService {}

// Request-scoped
@Injectable({ scope: Scope.REQUEST })
class RequestScopedService {}
```

### Checking Metadata Existence

```typescript
function hasMetadata(target: any, key: string): boolean {
  return Reflect.hasMetadata(key, target);
}

// Check if class is a controller
const isController = hasMetadata(UserController, CONTROLLER_METADATA);

// Check if class is injectable
const isInjectable = hasMetadata(UserService, INJECTABLE_METADATA);
```

---

## Related Documentation

- [Injectable Decorator](./INJECTABLE_DECORATOR.md)
- [Controller Decorator](./CONTROLLER_DECORATOR.md)
- [Module Decorator](./MODULE_DECORATOR.md)
- [Container](./CONTAINER.md)

---

**Last Updated**: December 4, 2025
