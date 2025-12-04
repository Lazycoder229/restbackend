import {
  FynixInterceptor,
  ExecutionContext,
  CallHandler,
} from "../common/interfaces";
import * as fs from "fs";
import * as path from "path";

/**
 * MIME type mappings for common file extensions
 */
const MIME_TYPES: Record<string, string> = {
  // Text
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".csv": "text/csv",

  // Images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".bmp": "image/bmp",

  // Fonts
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",

  // Media
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",

  // Documents
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".zip": "application/zip",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
};

export interface StaticFilesOptions {
  /**
   * Root directory to serve static files from (relative to project root)
   * @default 'public'
   */
  rootDir?: string;

  /**
   * URL prefix for serving static files
   * @default '/static'
   */
  prefix?: string;

  /**
   * Enable caching with max-age header (in seconds)
   * @default 86400 (1 day)
   */
  maxAge?: number;

  /**
   * Enable directory listing
   * @default false
   */
  enableDirectoryListing?: boolean;

  /**
   * Default file to serve when accessing a directory
   * @default 'index.html'
   */
  index?: string;

  /**
   * Enable ETag headers for caching
   * @default true
   */
  etag?: boolean;

  /**
   * Custom 404 page path (relative to rootDir)
   * @default null
   */
  notFoundPage?: string | null;

  /**
   * Enable dotfiles serving (files starting with .)
   * @default false
   */
  dotfiles?: boolean;

  /**
   * Paths to exclude from static file serving (e.g., ['/api', '/graphql'])
   * Useful when prefix is '/' to allow API routes to work
   * @default []
   */
  exclude?: string[];
}

/**
 * Built-in Static Files Interceptor
 * Serves static files from a directory with proper MIME types and caching
 *
 * @example
 * ```typescript
 * // Serve files from 'public' directory at '/static' prefix
 * app.useGlobalInterceptors(
 *   new StaticFilesInterceptor({
 *     rootDir: 'public',
 *     prefix: '/static',
 *     maxAge: 86400
 *   })
 * );
 * ```
 */
export class StaticFilesInterceptor implements FynixInterceptor {
  private rootDir: string;
  private prefix: string;
  private maxAge: number;
  private enableDirectoryListing: boolean;
  private index: string;
  private etag: boolean;
  private notFoundPage: string | null;
  private dotfiles: boolean;
  private absoluteRootDir: string;
  private exclude: string[];

  constructor(options: StaticFilesOptions = {}) {
    this.rootDir = options.rootDir || "public";
    this.prefix = options.prefix || "/static";
    this.maxAge = options.maxAge !== undefined ? options.maxAge : 86400;
    this.enableDirectoryListing =
      options.enableDirectoryListing !== undefined
        ? options.enableDirectoryListing
        : false;
    this.index = options.index || "index.html";
    this.etag = options.etag !== undefined ? options.etag : true;
    this.notFoundPage = options.notFoundPage || null;
    this.dotfiles = options.dotfiles !== undefined ? options.dotfiles : false;
    this.exclude = options.exclude || [];

    // Normalize prefix
    if (!this.prefix.startsWith("/")) {
      this.prefix = "/" + this.prefix;
    }
    if (this.prefix.endsWith("/")) {
      this.prefix = this.prefix.slice(0, -1);
    }

    // Resolve absolute path to root directory
    this.absoluteRootDir = path.resolve(process.cwd(), this.rootDir);

    // Create directory if it doesn't exist
    if (!fs.existsSync(this.absoluteRootDir)) {
      fs.mkdirSync(this.absoluteRootDir, { recursive: true });
      console.log(
        `[StaticFilesInterceptor] Created directory: ${this.absoluteRootDir}`
      );
    }
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.getRequest();
    const response = context.getResponse();
    const url = request.url || "";

    // Check if path should be excluded (e.g., /api routes)
    for (const excludePath of this.exclude) {
      if (url.startsWith(excludePath)) {
        return await next.handle();
      }
    }

    // Check if request matches static files prefix
    if (!url.startsWith(this.prefix)) {
      return await next.handle();
    }

    // Extract file path from URL (remove prefix and query string)
    const queryIndex = url.indexOf("?");
    const pathname = queryIndex === -1 ? url : url.slice(0, queryIndex);
    let filePath = pathname.slice(this.prefix.length) || "/";

    // Decode URI component to handle special characters
    try {
      filePath = decodeURIComponent(filePath);
    } catch (err) {
      return this.sendError(response, 400, "Bad Request");
    }

    // Security: Prevent path traversal attacks
    const normalizedPath = path
      .normalize(filePath)
      .replace(/^(\.\.[\/\\])+/, "");
    const absolutePath = path.join(this.absoluteRootDir, normalizedPath);

    // Ensure the resolved path is still within rootDir
    if (!absolutePath.startsWith(this.absoluteRootDir)) {
      return this.sendError(response, 403, "Forbidden");
    }

    // Check if file/directory exists
    if (!fs.existsSync(absolutePath)) {
      return this.send404(response);
    }

    const stats = fs.statSync(absolutePath);

    // Handle directory requests
    if (stats.isDirectory()) {
      return await this.handleDirectory(absolutePath, response, normalizedPath);
    }

    // Block dotfiles if disabled
    const basename = path.basename(absolutePath);
    if (!this.dotfiles && basename.startsWith(".")) {
      return this.sendError(response, 403, "Forbidden");
    }

    // Serve the file
    return this.serveFile(absolutePath, response, stats);
  }

  /**
   * Handle directory requests
   */
  private async handleDirectory(
    dirPath: string,
    response: any,
    urlPath: string
  ): Promise<void> {
    // Try to serve index file
    const indexPath = path.join(dirPath, this.index);
    if (fs.existsSync(indexPath)) {
      const stats = fs.statSync(indexPath);
      return this.serveFile(indexPath, response, stats);
    }

    // Directory listing if enabled
    if (this.enableDirectoryListing) {
      return this.serveDirectoryListing(dirPath, response, urlPath);
    }

    // Otherwise, send 404
    return this.send404(response);
  }

  /**
   * Serve a file with proper headers
   */
  private serveFile(
    filePath: string,
    response: any,
    stats: fs.Stats
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || "application/octet-stream";

      // Set headers
      response.setHeader("Content-Type", mimeType);
      response.setHeader("Content-Length", stats.size);

      // Cache headers
      if (this.maxAge > 0) {
        response.setHeader("Cache-Control", `public, max-age=${this.maxAge}`);
      }

      // ETag header for caching
      if (this.etag) {
        const etag = `"${stats.mtime.getTime()}-${stats.size}"`;
        response.setHeader("ETag", etag);

        // Check if client has cached version
        const ifNoneMatch = response.req?.headers["if-none-match"];
        if (ifNoneMatch === etag) {
          response.statusCode = 304;
          response.end();
          resolve();
          return;
        }
      }

      // Last-Modified header
      response.setHeader("Last-Modified", stats.mtime.toUTCString());

      // Stream file to response
      const stream = fs.createReadStream(filePath);
      response.statusCode = 200;

      stream.on("error", (err) => {
        console.error(`[StaticFilesInterceptor] Error reading file:`, err);
        this.sendError(response, 500, "Internal Server Error");
        reject(err);
      });

      stream.on("end", () => {
        resolve();
      });

      stream.pipe(response);
    });
  }

  /**
   * Serve directory listing
   */
  private serveDirectoryListing(
    dirPath: string,
    response: any,
    urlPath: string
  ): void {
    try {
      const files = fs.readdirSync(dirPath);

      // Filter dotfiles if disabled
      const filteredFiles = this.dotfiles
        ? files
        : files.filter((f) => !f.startsWith("."));

      // Sort: directories first, then files
      const items = filteredFiles
        .map((file) => {
          const fullPath = path.join(dirPath, file);
          const stats = fs.statSync(fullPath);
          return {
            name: file,
            isDir: stats.isDirectory(),
            size: stats.size,
            mtime: stats.mtime,
          };
        })
        .sort((a, b) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name);
        });

      // Generate HTML
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Index of ${urlPath}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 0.5rem;
    }
    table {
      width: 100%;
      background: white;
      border-collapse: collapse;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th, td {
      text-align: left;
      padding: 0.75rem;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #007bff;
      color: white;
      font-weight: 600;
    }
    tr:hover {
      background: #f8f9fa;
    }
    a {
      color: #007bff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .icon {
      margin-right: 0.5rem;
    }
    .size {
      text-align: right;
    }
  </style>
</head>
<body>
  <h1>Index of ${urlPath}</h1>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th class="size">Size</th>
        <th>Last Modified</th>
      </tr>
    </thead>
    <tbody>
      ${
        urlPath !== "/"
          ? `<tr>
        <td><a href="${this.prefix}${path.dirname(urlPath)}">
          <span class="icon">📁</span>..
        </a></td>
        <td class="size">-</td>
        <td>-</td>
      </tr>`
          : ""
      }
      ${items
        .map((item) => {
          const icon = item.isDir ? "📁" : "📄";
          const size = item.isDir ? "-" : this.formatBytes(item.size);
          const href = `${this.prefix}${path.posix.join(urlPath, item.name)}`;
          return `
      <tr>
        <td>
          <a href="${href}">
            <span class="icon">${icon}</span>${item.name}${
            item.isDir ? "/" : ""
          }
          </a>
        </td>
        <td class="size">${size}</td>
        <td>${item.mtime.toLocaleString()}</td>
      </tr>`;
        })
        .join("")}
    </tbody>
  </table>
</body>
</html>`;

      response.statusCode = 200;
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(html);
    } catch (err) {
      console.error(`[StaticFilesInterceptor] Error listing directory:`, err);
      this.sendError(response, 500, "Internal Server Error");
    }
  }

  /**
   * Send 404 response
   */
  private async send404(response: any): Promise<void> {
    if (this.notFoundPage) {
      const notFoundPath = path.join(this.absoluteRootDir, this.notFoundPage);
      if (fs.existsSync(notFoundPath)) {
        const stats = fs.statSync(notFoundPath);
        response.statusCode = 404;
        return this.serveFile(notFoundPath, response, stats);
      }
    }

    this.sendError(response, 404, "Not Found");
  }

  /**
   * Send error response
   */
  private sendError(response: any, statusCode: number, message: string): void {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${statusCode} ${message}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .error {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #dc3545;
      margin: 0 0 1rem 0;
    }
    p {
      color: #666;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="error">
    <h1>${statusCode}</h1>
    <p>${message}</p>
  </div>
</body>
</html>
`);
  }

  /**
   * Format bytes to human-readable size
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}
