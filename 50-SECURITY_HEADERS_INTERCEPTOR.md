# Security Headers Interceptor Documentation

## Overview

The SecurityHeadersInterceptor automatically adds security headers to HTTP responses to protect against common web vulnerabilities in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Security Headers](#security-headers)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { SecurityHeadersInterceptor } from "./builtin/security-headers.interceptor";
```

---

## Security Headers

The interceptor sets the following headers:

- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - Forces HTTPS
- `Content-Security-Policy` - CSP protection
- `Referrer-Policy: no-referrer` - Referrer control
- `Permissions-Policy` - Feature permissions

---

## Examples

### Global Application

```typescript
const app = await FynixFactory.create(AppModule);

app.useGlobalInterceptors(new SecurityHeadersInterceptor());

await app.listen(3000);
```

---

## Related Documentation

- [CORS Interceptor](./CORS_INTERCEPTOR.md)
- [CSRF Interceptor](./CSRF_INTERCEPTOR.md)
- [Security Service](./SECURITY_SERVICE.md)

---

**Last Updated**: December 4, 2025
