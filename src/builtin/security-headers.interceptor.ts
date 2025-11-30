import { Injectable } from "../decorators/injectable.decorator";
import {
  RestInterceptor,
  ExecutionContext,
  CallHandler,
} from "../common/interfaces";

/**
 * Built-in Security Headers Interceptor (Helmet-like)
 */
@Injectable()
export class SecurityHeadersInterceptor implements RestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const response = context.getResponse();

    // Set security headers
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("X-XSS-Protection", "1; mode=block");
    response.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    response.setHeader("Content-Security-Policy", "default-src 'self'");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );

    // Remove powered-by header
    response.removeHeader?.("X-Powered-By");

    return await next.handle();
  }
}
