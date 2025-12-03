# Static Files

Learn how to serve static files (HTML, CSS, JavaScript, images, etc.) in FynixJS using the built-in `StaticFilesInterceptor`.

---

## 📦 Overview

The `StaticFilesInterceptor` provides a simple way to serve static assets with:

- ✅ **Automatic MIME type detection** for common file types
- ✅ **Caching support** with ETag and Cache-Control headers
- ✅ **Directory listing** (optional)
- ✅ **Index file support** (e.g., `index.html`)
- ✅ **Security features** (path traversal protection, dotfiles blocking)
- ✅ **Custom 404 pages**
- ✅ **High performance** with file streaming

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { FynixFactory, StaticFilesInterceptor } from "@fynixjs/fynix";

const app = await FynixFactory.create(AppModule);

// Serve files from 'public' directory at '/static' URL prefix
app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    rootDir: "public",
    prefix: "/static",
  })
);

await app.listen(3000);
```

**Directory Structure:**

```
project/
├── public/
│   ├── images/
│   │   └── logo.png
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
└── src/
    └── main.ts
```

**Access files:**

- `http://localhost:3000/static/images/logo.png`
- `http://localhost:3000/static/css/style.css`
- `http://localhost:3000/static/js/app.js`

---

## ⚙️ Configuration Options

### `StaticFilesOptions`

| Option                   | Type      | Default        | Description                                      |
| ------------------------ | --------- | -------------- | ------------------------------------------------ |
| `rootDir`                | `string`  | `'public'`     | Root directory to serve files from               |
| `prefix`                 | `string`  | `'/static'`    | URL prefix for serving static files              |
| `maxAge`                 | `number`  | `86400`        | Cache max-age in seconds (0 to disable caching)  |
| `enableDirectoryListing` | `boolean` | `false`        | Enable directory listing                         |
| `index`                  | `string`  | `'index.html'` | Default file to serve for directories            |
| `etag`                   | `boolean` | `true`         | Enable ETag headers for caching                  |
| `notFoundPage`           | `string`  | `null`         | Custom 404 page path (relative to rootDir)       |
| `dotfiles`               | `boolean` | `false`        | Allow serving dotfiles (files starting with `.`) |

---

## 📝 Examples

### Example 1: Serve Frontend Assets

```typescript
import { FynixFactory, Module, StaticFilesInterceptor } from "@fynixjs/fynix";
import { AppController } from "./app.controller";

@Module({
  controllers: [AppController],
})
export class AppModule {}

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  // Serve static files
  app.useGlobalInterceptors(
    new StaticFilesInterceptor({
      rootDir: "public",
      prefix: "/static",
      maxAge: 86400, // 1 day
    })
  );

  await app.listen(3000);
}

bootstrap();
```

**Create `public/index.html`:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>FynixJS App</title>
    <link rel="stylesheet" href="/static/css/style.css" />
  </head>
  <body>
    <h1>Welcome to FynixJS!</h1>
    <img src="/static/images/logo.png" alt="Logo" />
    <script src="/static/js/app.js"></script>
  </body>
</html>
```

**Access:** `http://localhost:3000/static/index.html`

---

### Example 2: Enable Directory Listing

```typescript
app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    rootDir: "public",
    prefix: "/files",
    enableDirectoryListing: true,
    dotfiles: false,
  })
);
```

**Visit:** `http://localhost:3000/files/` to see directory contents.

---

### Example 3: Custom 404 Page

```typescript
app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    rootDir: "public",
    prefix: "/static",
    notFoundPage: "404.html", // relative to 'public' directory
  })
);
```

**Create `public/404.html`:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>404 - Not Found</title>
    <style>
      body {
        font-family: sans-serif;
        text-align: center;
        padding: 50px;
      }
      h1 {
        color: #dc3545;
      }
    </style>
  </head>
  <body>
    <h1>404</h1>
    <p>The file you're looking for doesn't exist.</p>
    <a href="/">Go Home</a>
  </body>
</html>
```

---

### Example 4: Multiple Static Directories

You can serve multiple directories with different prefixes:

```typescript
app.useGlobalInterceptors(
  // Public assets
  new StaticFilesInterceptor({
    rootDir: "public",
    prefix: "/static",
    maxAge: 86400,
  }),

  // User uploads
  new StaticFilesInterceptor({
    rootDir: "uploads",
    prefix: "/uploads",
    maxAge: 0, // No caching for uploads
    enableDirectoryListing: false,
  }),

  // Documentation
  new StaticFilesInterceptor({
    rootDir: "docs",
    prefix: "/docs",
    enableDirectoryListing: true,
    index: "README.html",
  })
);
```

**Access:**

- `http://localhost:3000/static/css/style.css`
- `http://localhost:3000/uploads/profile.jpg`
- `http://localhost:3000/docs/`

---

### Example 5: Serve SPA (Single Page Application)

For frameworks like React, Vue, or Angular:

```typescript
import { Controller, Get, Res, StaticFilesInterceptor } from "@fynixjs/fynix";
import * as path from "path";
import * as fs from "fs";

@Controller()
export class AppController {
  // Serve index.html for all non-API routes (SPA fallback)
  @Get("*")
  serveSPA(@Res() res: any) {
    const indexPath = path.join(process.cwd(), "public", "index.html");
    const html = fs.readFileSync(indexPath, "utf-8");
    res.setHeader("Content-Type", "text/html");
    res.end(html);
  }
}

@Module({
  controllers: [AppController],
})
export class AppModule {}

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  // Serve static assets (JS, CSS, images)
  app.useGlobalInterceptors(
    new StaticFilesInterceptor({
      rootDir: "public",
      prefix: "/static",
      maxAge: 31536000, // 1 year for production
    })
  );

  // Set API prefix to avoid conflicts
  app.setGlobalPrefix("/api");

  await app.listen(3000);
}

bootstrap();
```

---

### Example 6: Disable Caching for Development

```typescript
app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    rootDir: "public",
    prefix: "/static",
    maxAge: 0, // Disable caching
    etag: false, // Disable ETag
  })
);
```

---

## 🎨 Supported MIME Types

The interceptor automatically detects MIME types for common file extensions:

### Text

- `.html` → `text/html`
- `.css` → `text/css`
- `.js` → `text/javascript`
- `.json` → `application/json`
- `.xml` → `application/xml`
- `.txt` → `text/plain`
- `.csv` → `text/csv`

### Images

- `.jpg`, `.jpeg` → `image/jpeg`
- `.png` → `image/png`
- `.gif` → `image/gif`
- `.svg` → `image/svg+xml`
- `.ico` → `image/x-icon`
- `.webp` → `image/webp`
- `.bmp` → `image/bmp`

### Fonts

- `.woff` → `font/woff`
- `.woff2` → `font/woff2`
- `.ttf` → `font/ttf`
- `.otf` → `font/otf`
- `.eot` → `application/vnd.ms-fontobject`

### Media

- `.mp3` → `audio/mpeg`
- `.mp4` → `video/mp4`
- `.webm` → `video/webm`
- `.ogg` → `audio/ogg`
- `.wav` → `audio/wav`

### Documents

- `.pdf` → `application/pdf`
- `.doc` → `application/msword`
- `.docx` → `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `.zip` → `application/zip`
- `.tar` → `application/x-tar`
- `.gz` → `application/gzip`

**Unknown extensions** default to `application/octet-stream` (binary download).

---

## 🔒 Security Features

### 1. Path Traversal Protection

The interceptor automatically blocks malicious requests trying to access files outside the root directory:

```
❌ /static/../../../etc/passwd
❌ /static/..%2F..%2F..%2Fetc%2Fpasswd
✅ /static/images/logo.png
```

### 2. Dotfiles Protection

By default, files starting with `.` are blocked:

```typescript
// Default: dotfiles blocked
app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    dotfiles: false, // ❌ blocks .env, .git, etc.
  })
);

// Allow dotfiles (use with caution)
app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    dotfiles: true, // ✅ allows .well-known/acme-challenge
  })
);
```

### 3. Directory Listing Control

Disable directory listing to prevent exposing file structure:

```typescript
app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    enableDirectoryListing: false, // Default
  })
);
```

---

## 🚀 Performance Tips

### 1. Enable Caching for Production

```typescript
app.useGlobalInterceptors(
  new StaticFilesInterceptor({
    maxAge: 31536000, // 1 year (31536000 seconds)
    etag: true,
  })
);
```

### 2. Use a CDN for Production

For high-traffic applications, serve static files from a CDN (Cloudflare, AWS CloudFront, etc.) instead of the Node.js server.

### 3. Compress Assets

Use gzip compression for text files:

```bash
# Create compressed versions
gzip -k public/css/style.css
gzip -k public/js/app.js
```

Browsers will automatically request `.gz` versions when available.

---

## 🛠️ Advanced Usage

### Programmatic File Serving

For dynamic file serving, use a controller instead:

```typescript
import { Controller, Get, Param, Res } from "@fynixjs/fynix";
import * as fs from "fs";
import * as path from "path";

@Controller("/downloads")
export class DownloadsController {
  @Get("/:filename")
  downloadFile(@Param("filename") filename: string, @Res() res: any) {
    const filePath = path.join(process.cwd(), "private", filename);

    // Security check
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end("File not found");
      return;
    }

    // Set download headers
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Stream file
    fs.createReadStream(filePath).pipe(res);
  }
}
```

---

## 📚 Related Topics

- [Controllers & Routing](./03-CONTROLLERS.md)
- [Guards & Interceptors](./07-GUARDS_INTERCEPTORS.md)
- [Security](./06-SECURITY.md)

---

## 🎯 Summary

The `StaticFilesInterceptor` provides a robust solution for serving static files with:

✅ Easy configuration  
✅ Automatic MIME type detection  
✅ Built-in security features  
✅ Caching and performance optimizations  
✅ Directory listing support  
✅ Custom 404 pages

Perfect for serving frontend assets, user uploads, documentation, and more!
