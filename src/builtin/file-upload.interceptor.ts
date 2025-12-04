/**
 * File Upload Middleware for handling multipart/form-data
 */

import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import {
  BadRequestException,
  PayloadTooLargeException,
} from "./exception.filter";

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

export interface FileUploadOptions {
  dest?: string;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  allowedMimeTypes?: string[];
  storage?: "disk" | "memory";
  fileFilter?: (file: Partial<UploadedFile>) => boolean;
  limits?: {
    fieldNameSize?: number;
    fieldSize?: number;
    fields?: number;
    fileSize?: number;
    files?: number;
  };
}

/**
 * Parse multipart/form-data requests
 */
export class FileUploadService {
  private options: Required<FileUploadOptions>;

  constructor(options: FileUploadOptions = {}) {
    this.options = {
      dest: options.dest || "uploads",
      maxFileSize: options.maxFileSize || 5 * 1024 * 1024, // 5MB default
      maxFiles: options.maxFiles || 10,
      allowedMimeTypes: options.allowedMimeTypes || [],
      storage: options.storage || "disk",
      fileFilter: options.fileFilter || (() => true),
      limits: {
        fieldNameSize: options.limits?.fieldNameSize || 100,
        fieldSize: options.limits?.fieldSize || 1024 * 1024, // 1MB
        fields: options.limits?.fields || 100,
        fileSize:
          options.limits?.fileSize ||
          this.options?.maxFileSize ||
          5 * 1024 * 1024,
        files: options.limits?.files || this.options?.maxFiles || 10,
      },
    };

    // Ensure upload directory exists
    if (this.options.storage === "disk" && !fs.existsSync(this.options.dest)) {
      fs.mkdirSync(this.options.dest, { recursive: true });
    }
  }

  /**
   * Parse multipart form data
   */
  async parseMultipart(req: http.IncomingMessage): Promise<{
    fields: Record<string, string>;
    files: UploadedFile[];
  }> {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("multipart/form-data")) {
      throw new BadRequestException("Content-Type must be multipart/form-data");
    }

    const boundary = this.getBoundary(contentType);
    if (!boundary) {
      throw new BadRequestException("Invalid multipart boundary");
    }

    const chunks: Buffer[] = [];
    let totalSize = 0;

    for await (const chunk of req) {
      totalSize += chunk.length;
      if (totalSize > this.options.maxFileSize * this.options.maxFiles) {
        throw new PayloadTooLargeException("Request entity too large");
      }
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    return this.parseBuffer(buffer, boundary);
  }

  /**
   * Extract boundary from content-type header
   */
  private getBoundary(contentType: string): string | null {
    const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    return match ? match[1] || match[2] : null;
  }

  /**
   * Parse multipart buffer
   */
  private parseBuffer(
    buffer: Buffer,
    boundary: string
  ): { fields: Record<string, string>; files: UploadedFile[] } {
    const fields: Record<string, string> = {};
    const files: UploadedFile[] = [];

    const parts = this.splitBuffer(buffer, `--${boundary}`);

    for (const part of parts) {
      if (part.length === 0 || part.toString().trim() === "--") continue;

      const { headers, body } = this.parsePart(part);

      if (headers["content-disposition"]) {
        const disposition = this.parseContentDisposition(
          headers["content-disposition"]
        );

        if (disposition.filename) {
          // It's a file
          const file = this.createFile(disposition, headers, body);

          // Validate file
          if (this.options.allowedMimeTypes.length > 0) {
            if (!this.options.allowedMimeTypes.includes(file.mimetype)) {
              throw new BadRequestException(
                `File type ${file.mimetype} is not allowed`
              );
            }
          }

          if (file.size > this.options.maxFileSize) {
            throw new PayloadTooLargeException(
              `File size exceeds maximum of ${this.options.maxFileSize} bytes`
            );
          }

          if (!this.options.fileFilter(file)) {
            throw new BadRequestException("File rejected by filter");
          }

          if (files.length >= this.options.maxFiles) {
            throw new BadRequestException(
              `Maximum number of files (${this.options.maxFiles}) exceeded`
            );
          }

          files.push(file);
        } else if (disposition.name) {
          // It's a field
          if (
            Object.keys(fields).length >= (this.options.limits.fields || 100)
          ) {
            throw new BadRequestException("Too many fields");
          }
          fields[disposition.name] = body.toString("utf-8");
        }
      }
    }

    return { fields, files };
  }

  /**
   * Split buffer by boundary
   */
  private splitBuffer(buffer: Buffer, boundary: string): Buffer[] {
    const parts: Buffer[] = [];
    const boundaryBuffer = Buffer.from(boundary);
    let start = 0;

    while (true) {
      const index = buffer.indexOf(boundaryBuffer, start);
      if (index === -1) break;

      if (start !== index) {
        parts.push(buffer.slice(start, index));
      }

      start = index + boundaryBuffer.length;
    }

    if (start < buffer.length) {
      parts.push(buffer.slice(start));
    }

    return parts;
  }

  /**
   * Parse a single part
   */
  private parsePart(part: Buffer): {
    headers: Record<string, string>;
    body: Buffer;
  } {
    const headerEndIndex = part.indexOf("\r\n\r\n");
    if (headerEndIndex === -1) {
      return { headers: {}, body: part };
    }

    const headerSection = part.slice(0, headerEndIndex).toString("utf-8");
    const body = part.slice(headerEndIndex + 4);

    const headers: Record<string, string> = {};
    const headerLines = headerSection.split("\r\n");

    for (const line of headerLines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex !== -1) {
        const key = line.slice(0, colonIndex).trim().toLowerCase();
        const value = line.slice(colonIndex + 1).trim();
        headers[key] = value;
      }
    }

    // Remove trailing \r\n from body
    let bodyEnd = body.length;
    if (body[bodyEnd - 2] === 13 && body[bodyEnd - 1] === 10) {
      bodyEnd -= 2;
    }

    return { headers, body: body.slice(0, bodyEnd) };
  }

  /**
   * Parse Content-Disposition header
   */
  private parseContentDisposition(header: string): {
    name?: string;
    filename?: string;
  } {
    const result: { name?: string; filename?: string } = {};

    const nameMatch = header.match(/name="([^"]+)"/);
    if (nameMatch) result.name = nameMatch[1];

    const filenameMatch = header.match(/filename="([^"]+)"/);
    if (filenameMatch) result.filename = filenameMatch[1];

    return result;
  }

  /**
   * Create file object
   */
  private createFile(
    disposition: { name?: string; filename?: string },
    headers: Record<string, string>,
    body: Buffer
  ): UploadedFile {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(disposition.filename || "");
    const filename = `${timestamp}-${randomStr}${ext}`;
    const filepath = path.join(this.options.dest, filename);

    const file: UploadedFile = {
      fieldname: disposition.name || "file",
      originalname: disposition.filename || "unknown",
      encoding: "7bit",
      mimetype: headers["content-type"] || "application/octet-stream",
      size: body.length,
      destination: this.options.dest,
      filename,
      path: filepath,
    };

    if (this.options.storage === "disk") {
      fs.writeFileSync(filepath, body);
    } else {
      file.buffer = body;
    }

    return file;
  }
}

/**
 * File Upload decorator parameter metadata
 */
const FILE_UPLOAD_METADATA = Symbol("file:upload");

/**
 * Mark parameter to receive uploaded file
 */
export function UploadedFile(fieldname?: string): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const metadata =
      Reflect.getMetadata(FILE_UPLOAD_METADATA, target, propertyKey) || [];
    metadata.push({ index: parameterIndex, type: "single", fieldname });
    Reflect.defineMetadata(FILE_UPLOAD_METADATA, metadata, target, propertyKey);
  };
}

/**
 * Mark parameter to receive all uploaded files
 */
export function UploadedFiles(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const metadata =
      Reflect.getMetadata(FILE_UPLOAD_METADATA, target, propertyKey) || [];
    metadata.push({ index: parameterIndex, type: "multiple" });
    Reflect.defineMetadata(FILE_UPLOAD_METADATA, metadata, target, propertyKey);
  };
}

/**
 * Get file upload metadata
 */
export function getFileUploadMetadata(
  target: any,
  propertyKey: string | symbol
): any[] {
  return Reflect.getMetadata(FILE_UPLOAD_METADATA, target, propertyKey) || [];
}

/**
 * File Upload Interceptor
 */
export class FileUploadInterceptor {
  private uploadService: FileUploadService;

  constructor(options?: FileUploadOptions) {
    this.uploadService = new FileUploadService(options);
  }

  async intercept(context: any, next: any): Promise<any> {
    const request = context.getRequest();
    const contentType = request.headers["content-type"] || "";

    if (contentType.includes("multipart/form-data")) {
      const { fields, files } = await this.uploadService.parseMultipart(
        request
      );

      // Attach to request
      (request as any).files = files;
      (request as any).body = { ...(request as any).body, ...fields };
    }

    return await next.handle();
  }
}
