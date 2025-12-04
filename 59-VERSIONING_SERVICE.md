# Versioning Service Documentation

## Overview

The VersioningService provides API versioning support with URL, header, and media-type based versioning strategies for Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Versioning Strategies](#versioning-strategies)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  VersioningService,
  VersioningType,
} from "./builtin/versioning.service";
```

---

## Versioning Strategies

### URL Versioning

```
/v1/users
/v2/users
```

### Header Versioning

```
X-API-Version: 1
X-API-Version: 2
```

### Media Type Versioning

```
Accept: application/vnd.myapp.v1+json
Accept: application/vnd.myapp.v2+json
```

---

## API Reference

### `enable(type, options): void`

Enable versioning with specified strategy.

### `getVersion(req): string`

Extract version from request.

---

## Examples

### URL Versioning

```typescript
const app = await FynixFactory.create(AppModule);

app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: "1",
});

@Controller("/users")
export class UsersController {
  @Get()
  @Version("1")
  getUsersV1() {
    return { version: 1, users: [] };
  }

  @Get()
  @Version("2")
  getUsersV2() {
    return { version: 2, users: [], metadata: {} };
  }
}
```

### Header Versioning

```typescript
app.enableVersioning({
  type: VersioningType.HEADER,
  header: "X-API-Version",
  defaultVersion: "1",
});

@Controller("/data")
export class DataController {
  @Get()
  @Version("1")
  getDataV1() {
    return { format: "v1" };
  }

  @Get()
  @Version("2")
  getDataV2() {
    return { format: "v2", enhanced: true };
  }
}
```

---

## Related Documentation

- [Controllers](./CONTROLLER_DECORATOR.md)
- [HTTP Methods](./HTTP_METHODS_DECORATOR.md)

---

**Last Updated**: December 4, 2025
