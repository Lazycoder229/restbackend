/**
 * Input Sanitization for XSS and SQL Injection Prevention
 */

import { PipeTransform, ArgumentMetadata } from "./validation.pipe";

/**
 * Sanitize HTML to prevent XSS
 */
export class SanitizeHtmlPipe implements PipeTransform {
  private dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers
    /javascript:/gi,
    /data:text\/html/gi,
  ];

  transform(value: any, _metadata: ArgumentMetadata): any {
    if (typeof value === "string") {
      return this.sanitize(value);
    }

    if (typeof value === "object" && value !== null) {
      return this.sanitizeObject(value);
    }

    return value;
  }

  private sanitize(input: string): string {
    let sanitized = input;

    // Remove dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      sanitized = sanitized.replace(pattern, "");
    }

    // Escape HTML entities
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");

    return sanitized;
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        sanitized[key] = this.sanitize(value);
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

/**
 * Sanitize decorator for automatic sanitization
 */
export function Sanitize(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;

    const existingParams =
      Reflect.getMetadata("sanitize:params", target, propertyKey) || [];
    existingParams.push(parameterIndex);
    Reflect.defineMetadata(
      "sanitize:params",
      existingParams,
      target,
      propertyKey
    );
  };
}

/**
 * SQL Injection Prevention - Escape SQL special characters
 */
export class SqlSanitizePipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata): any {
    if (typeof value === "string") {
      return this.escapeSql(value);
    }

    if (typeof value === "object" && value !== null) {
      return this.sanitizeObject(value);
    }

    return value;
  }

  private escapeSql(input: string): string {
    return input
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\x00/g, "\\0")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\x1a/g, "\\Z");
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        sanitized[key] = this.escapeSql(value);
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

/**
 * Sanitization Service
 */
export class SanitizationService {
  /**
   * Remove all HTML tags
   */
  static stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, "");
  }

  /**
   * Escape HTML entities
   */
  static escapeHtml(input: string): string {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\.{2,}/g, ".")
      .substring(0, 255);
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url: string): string {
    // Remove javascript: and data: protocols
    if (url.match(/^(javascript|data|vbscript):/i)) {
      return "";
    }

    try {
      const parsed = new URL(url);
      // Only allow http and https
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "";
      }
      return parsed.toString();
    } catch {
      return "";
    }
  }

  /**
   * Sanitize email
   */
  static sanitizeEmail(email: string): string {
    return email.trim().toLowerCase().replace(/[<>]/g, "");
  }

  /**
   * Remove null bytes
   */
  static removeNullBytes(input: string): string {
    return input.replace(/\x00/g, "");
  }

  /**
   * Normalize whitespace
   */
  static normalizeWhitespace(input: string): string {
    return input.trim().replace(/\s+/g, " ");
  }

  /**
   * Check for path traversal
   */
  static hasPathTraversal(path: string): boolean {
    return /(\.\.[\/\\]|\.\.\\)/.test(path);
  }

  /**
   * Sanitize path
   */
  static sanitizePath(path: string): string {
    return path
      .replace(/\\/g, "/")
      .replace(/\.{2,}/g, "")
      .replace(/[<>:"|?*]/g, "")
      .replace(/^\//g, "");
  }
}

/**
 * Whitelist Pipe - Only allow specified characters
 */
export class WhitelistPipe implements PipeTransform {
  constructor(private allowedPattern: RegExp) {}

  transform(value: any, _metadata: ArgumentMetadata): any {
    if (typeof value !== "string") return value;

    const matches = value.match(this.allowedPattern);
    return matches ? matches.join("") : "";
  }
}

/**
 * Blacklist Pipe - Remove specified characters
 */
export class BlacklistPipe implements PipeTransform {
  constructor(private blockedPattern: RegExp) {}

  transform(value: any, _metadata: ArgumentMetadata): any {
    if (typeof value !== "string") return value;
    return value.replace(this.blockedPattern, "");
  }
}

/**
 * Trim Pipe - Remove leading/trailing whitespace
 */
export class TrimPipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata): any {
    return typeof value === "string" ? value.trim() : value;
  }
}

/**
 * Lowercase Pipe
 */
export class LowercasePipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata): any {
    return typeof value === "string" ? value.toLowerCase() : value;
  }
}

/**
 * Uppercase Pipe
 */
export class UppercasePipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata): any {
    return typeof value === "string" ? value.toUpperCase() : value;
  }
}
