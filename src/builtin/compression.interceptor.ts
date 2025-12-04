/**
 * Response Compression Middleware (gzip/deflate)
 */

import * as http from "http";
import * as zlib from "zlib";
import {
  CallHandler,
  ExecutionContext,
  FynixInterceptor,
} from "../common/interfaces";

export interface CompressionOptions {
  threshold?: number; // Minimum size in bytes to compress (default: 1024)
  level?: number; // Compression level 0-9 (default: 6)
  filter?: (req: http.IncomingMessage, res: http.ServerResponse) => boolean;
  contentTypes?: string[]; // Only compress these content types
}

/**
 * Compression Interceptor
 */
export class CompressionInterceptor implements FynixInterceptor {
  private options: Required<CompressionOptions>;

  constructor(options: CompressionOptions = {}) {
    this.options = {
      threshold: options.threshold || 1024, // 1KB default
      level: options.level !== undefined ? options.level : 6,
      filter: options.filter || this.defaultFilter,
      contentTypes: options.contentTypes || [
        "text/html",
        "text/plain",
        "text/css",
        "text/javascript",
        "application/javascript",
        "application/json",
        "application/xml",
        "text/xml",
        "application/x-javascript",
      ],
    };
  }

  /**
   * Default filter - compress text-based content types
   */
  private defaultFilter(
    _req: http.IncomingMessage,
    res: http.ServerResponse
  ): boolean {
    const contentType = res.getHeader("Content-Type");
    if (!contentType) return false;

    const type = contentType.toString().split(";")[0].trim().toLowerCase();
    return this.options.contentTypes.includes(type);
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.getRequest();
    const response = context.getResponse();

    // Check if client accepts compression
    const acceptEncoding = request.headers["accept-encoding"] || "";
    const supportsGzip = acceptEncoding.includes("gzip");
    const supportsDeflate = acceptEncoding.includes("deflate");

    if (!supportsGzip && !supportsDeflate) {
      return await next.handle();
    }

    // Store original methods
    const originalEnd = response.end.bind(response);
    const originalSetHeader = response.setHeader.bind(response);

    const buffer: Buffer[] = [];
    let shouldCompress = false;
    const self = this;

    // Override setHeader to check content-type
    response.setHeader = function (name: string, value: any) {
      if (name.toLowerCase() === "content-type") {
        shouldCompress = self.options.filter(request, response);
      }
      return originalSetHeader(name, value);
    };

    // Override write to buffer content
    response.write = function (chunk: any): boolean {
      if (Buffer.isBuffer(chunk)) {
        buffer.push(chunk);
      } else if (typeof chunk === "string") {
        buffer.push(Buffer.from(chunk));
      }
      return true;
    };

    // Override end to compress and send
    response.end = function (chunk?: any, ...args: any[]): any {
      if (chunk) {
        if (Buffer.isBuffer(chunk)) {
          buffer.push(chunk);
        } else if (typeof chunk === "string") {
          buffer.push(Buffer.from(chunk));
        }
      }

      const fullBuffer = Buffer.concat(buffer);

      // Check if we should compress
      if (shouldCompress && fullBuffer.length >= self.options.threshold) {
        self.compressAndSend(
          fullBuffer,
          response,
          supportsGzip,
          originalSetHeader,
          originalEnd
        );
      } else {
        // Send uncompressed
        originalEnd.call(response, fullBuffer, ...args);
      }

      return response;
    };

    // Execute handler
    const result = await next.handle();

    return result;
  }

  /**
   * Compress and send response
   */
  private compressAndSend(
    buffer: Buffer,
    response: http.ServerResponse,
    _supportsGzip: boolean,
    setHeader: Function,
    end: Function
  ): void {
    const encoding = "gzip";
    const compressor = zlib.createGzip({ level: this.options.level });

    const chunks: Buffer[] = [];

    compressor.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    compressor.on("end", () => {
      const compressed = Buffer.concat(chunks);

      // Set compression headers
      setHeader.call(response, "Content-Encoding", encoding);
      setHeader.call(response, "Content-Length", compressed.length);
      setHeader.call(response, "Vary", "Accept-Encoding");

      // Send compressed data
      end.call(response, compressed);
    });

    compressor.on("error", (err: Error) => {
      console.error("Compression error:", err);
      // Send uncompressed on error
      end.call(response, buffer);
    });

    // Write and compress
    compressor.write(buffer);
    compressor.end();
  }
}

/**
 * Helper: Check if response should be compressed
 */
export function shouldCompress(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  options: CompressionOptions = {}
): boolean {
  const acceptEncoding = req.headers["accept-encoding"] || "";
  if (!acceptEncoding.includes("gzip") && !acceptEncoding.includes("deflate")) {
    return false;
  }

  const contentType = res.getHeader("Content-Type");
  if (!contentType) return false;

  const type = contentType.toString().split(";")[0].trim().toLowerCase();

  const compressibleTypes = options.contentTypes || [
    "text/html",
    "text/plain",
    "text/css",
    "text/javascript",
    "application/javascript",
    "application/json",
    "application/xml",
  ];

  return compressibleTypes.includes(type);
}

/**
 * Compress buffer with gzip
 */
export function gzipCompress(
  buffer: Buffer,
  level: number = 6
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zlib.gzip(buffer, { level }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Compress buffer with deflate
 */
export function deflateCompress(
  buffer: Buffer,
  level: number = 6
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zlib.deflate(buffer, { level }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Decompress gzip buffer
 */
export function gzipDecompress(buffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zlib.gunzip(buffer, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Decompress deflate buffer
 */
export function deflateDecompress(buffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zlib.inflate(buffer, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
