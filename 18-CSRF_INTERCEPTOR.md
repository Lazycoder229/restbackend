# CSRF Interceptor Documentation

## Overview

The CsrfInterceptor provides Cross-Site Request Forgery (CSRF) protection by validating tokens for state-changing requests in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { CsrfInterceptor } from "./builtin/csrf.interceptor";
```

---

## Configuration

```typescript
const csrf = new CsrfInterceptor({
  cookieName: "XSRF-TOKEN",
  headerName: "X-XSRF-TOKEN",
  ignoreMethods: ["GET", "HEAD", "OPTIONS"],
  tokenLength: 32,
});

app.useGlobalInterceptors(csrf);
```

---

## Usage

### Client-Side

```javascript
// Get token from cookie
const token = getCookie("XSRF-TOKEN");

// Send with request
fetch("/api/data", {
  method: "POST",
  headers: {
    "X-XSRF-TOKEN": token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});
```

---

## Examples

### Enable CSRF Protection

```typescript
const app = await FynixFactory.create(AppModule);

app.useGlobalInterceptors(
  new CsrfInterceptor({
    cookieName: "XSRF-TOKEN",
    headerName: "X-XSRF-TOKEN",
  })
);

await app.listen(3000);
```

---

## Related Documentation

- [Security Headers](./SECURITY_HEADERS_INTERCEPTOR.md)
- [CORS Interceptor](./CORS_INTERCEPTOR.md)
- [Security Service](./SECURITY_SERVICE.md)

---

**Last Updated**: December 4, 2025
