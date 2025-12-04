/**
 * CSRF Protection
 */

import * as crypto from "crypto";
import {
  FynixInterceptor,
  ExecutionContext,
  CallHandler,
} from "../common/interfaces";
import { ForbiddenException } from "./exception.filter";

export interface CsrfOptions {
  cookieName?: string;
  headerName?: string;
  secret?: string;
  ignoreMethods?: string[];
  tokenLength?: number;
}

/**
 * CSRF Protection Interceptor
 */
export class CsrfInterceptor implements FynixInterceptor {
  private options: Required<CsrfOptions>;
  private tokens: Map<string, { token: string; expires: number }> = new Map();

  constructor(options: CsrfOptions = {}) {
    this.options = {
      cookieName: options.cookieName || "XSRF-TOKEN",
      headerName: options.headerName || "X-XSRF-TOKEN",
      secret: options.secret || crypto.randomBytes(32).toString("hex"),
      ignoreMethods: options.ignoreMethods || ["GET", "HEAD", "OPTIONS"],
      tokenLength: options.tokenLength || 32,
    };
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.getRequest();
    const response = context.getResponse();
    const method = request.method?.toUpperCase();

    // Generate token for safe methods
    if (this.options.ignoreMethods.includes(method || "")) {
      const token = this.generateToken();
      this.setTokenCookie(response, token);
      return await next.handle();
    }

    // Validate token for unsafe methods
    const cookieToken = this.getTokenFromCookie(request);
    const headerToken = this.getTokenFromHeader(request);

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException("Invalid CSRF token");
    }

    if (!this.validateToken(headerToken)) {
      throw new ForbiddenException("CSRF token expired");
    }

    return await next.handle();
  }

  private generateToken(): string {
    const token = crypto.randomBytes(this.options.tokenLength).toString("hex");
    const expires = Date.now() + 3600000; // 1 hour
    this.tokens.set(token, { token, expires });

    // Cleanup expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  private validateToken(token: string): boolean {
    const stored = this.tokens.get(token);
    if (!stored) return false;
    if (stored.expires < Date.now()) {
      this.tokens.delete(token);
      return false;
    }
    return true;
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (data.expires < now) {
        this.tokens.delete(token);
      }
    }
  }

  private getTokenFromCookie(request: any): string | null {
    const cookies = this.parseCookies(request.headers.cookie || "");
    return cookies[this.options.cookieName] || null;
  }

  private getTokenFromHeader(request: any): string | null {
    return request.headers[this.options.headerName.toLowerCase()] || null;
  }

  private setTokenCookie(response: any, token: string): void {
    const cookie = `${this.options.cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`;
    response.setHeader("Set-Cookie", cookie);
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookies[name] = value;
      }
    });
    return cookies;
  }
}

/**
 * Generate CSRF token manually
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Double-submit cookie pattern
 */
export class CsrfDoubleSubmitInterceptor implements FynixInterceptor {
  private secret: string;

  constructor(secret?: string) {
    this.secret = secret || crypto.randomBytes(32).toString("hex");
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.getRequest();
    const response = context.getResponse();
    const method = request.method?.toUpperCase();

    // Generate and set token for GET requests
    if (method === "GET") {
      const token = this.generateToken();
      const signedToken = this.signToken(token);

      response.setHeader(
        "Set-Cookie",
        `csrf-token=${signedToken}; Path=/; HttpOnly; SameSite=Strict`
      );

      return await next.handle();
    }

    // Validate token for POST/PUT/DELETE
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method || "")) {
      const cookieToken = this.getTokenFromCookie(request);
      const bodyToken = request.body?.csrf_token;

      if (!cookieToken || !bodyToken) {
        throw new ForbiddenException("CSRF token missing");
      }

      if (!this.verifyToken(cookieToken, bodyToken)) {
        throw new ForbiddenException("Invalid CSRF token");
      }
    }

    return await next.handle();
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private signToken(token: string): string {
    const signature = crypto
      .createHmac("sha256", this.secret)
      .update(token)
      .digest("hex");
    return `${token}.${signature}`;
  }

  private verifyToken(signedToken: string, plainToken: string): boolean {
    const [token, signature] = signedToken.split(".");
    if (token !== plainToken) return false;

    const expectedSignature = crypto
      .createHmac("sha256", this.secret)
      .update(token)
      .digest("hex");

    return signature === expectedSignature;
  }

  private getTokenFromCookie(request: any): string | null {
    const cookies = request.headers.cookie || "";
    const match = cookies.match(/csrf-token=([^;]+)/);
    return match ? match[1] : null;
  }
}
