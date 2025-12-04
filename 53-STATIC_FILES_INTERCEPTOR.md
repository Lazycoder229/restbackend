# Static Files Interceptor Documentation

## Overview

The StaticFilesInterceptor serves static files (images, CSS, JavaScript, etc.) with proper MIME types, caching headers, and directory listing support in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { StaticFilesInterceptor } from "./builtin/static-files.interceptor";
```

---

## Configuration

```typescript
const staticFiles = new StaticFilesInterceptor({
  rootDir: "public",
  prefix: "/static",
  maxAge: 86400, // 1 day
  enableDirectoryListing: false,
  index: "index.html",
  etag: true,
  dotfiles: false,
});

app.useGlobalInterceptors(staticFiles);
```

---

## Examples

### Serve Static Files

```typescript
const app = await FynixFactory.create(AppModule);

app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    rootDir: "public",
    prefix: "/static",
    maxAge: 3600,
  })
);

await app.listen(3000);

// Files accessible at:
// http://localhost:3000/static/logo.png
// http://localhost:3000/static/css/styles.css
```

### Multiple Static Directories

```typescript
// Serve uploads
app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    rootDir: "uploads",
    prefix: "/uploads",
  })
);

// Serve public assets
app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    rootDir: "public",
    prefix: "/assets",
  })
);
```

---

## Related Documentation

- [File Upload Interceptor](./FILE_UPLOAD_INTERCEPTOR.md)
- [Compression Interceptor](./COMPRESSION_INTERCEPTOR.md)

---

**Last Updated**: December 4, 2025
