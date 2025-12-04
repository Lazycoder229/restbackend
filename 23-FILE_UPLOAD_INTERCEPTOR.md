# File Upload Interceptor Documentation

## Overview

The FileUploadService provides multipart/form-data parsing for file uploads with validation, size limits, and storage options in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  FileUploadService,
  UploadedFile,
} from "./builtin/file-upload.interceptor";
```

---

## Configuration

```typescript
const upload = new FileUploadService({
  dest: "uploads",
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif"],
  storage: "disk", // or 'memory'
});
```

---

## API Reference

### `parseMultipart(req): Promise<{ fields, files }>`

Parse multipart form data.

```typescript
const { fields, files } = await upload.parseMultipart(req);
```

---

## Examples

### File Upload Endpoint

```typescript
@Controller("/upload")
export class UploadController {
  constructor(private upload: FileUploadService) {}

  @Post("/image")
  async uploadImage(@Req() req: Request) {
    const { fields, files } = await this.upload.parseMultipart(req);

    const file = files[0];
    console.log("Uploaded:", file.filename);
    console.log("Size:", file.size);
    console.log("Path:", file.path);

    return {
      filename: file.filename,
      url: `/uploads/${file.filename}`,
    };
  }

  @Post("/multiple")
  async uploadMultiple(@Req() req: Request) {
    const { fields, files } = await this.upload.parseMultipart(req);

    return {
      count: files.length,
      files: files.map((f) => ({
        filename: f.filename,
        size: f.size,
      })),
    };
  }
}
```

---

## Related Documentation

- [Static Files Interceptor](./STATIC_FILES_INTERCEPTOR.md)
- [Controllers](./CONTROLLER_DECORATOR.md)

---

**Last Updated**: December 4, 2025
