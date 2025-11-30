import { Injectable } from "../decorators/injectable.decorator";
import {
  RestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from "../common/interfaces";

/**
 * Built-in Rate Limiting Interceptor
 */
@Injectable()
export class RateLimitInterceptor implements RestInterceptor {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private maxRequests: number = 100;
  private windowMs: number = 60000; // 1 minute

  configure(options: { maxRequests?: number; windowMs?: number }) {
    if (options.maxRequests) this.maxRequests = options.maxRequests;
    if (options.windowMs) this.windowMs = options.windowMs;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.getRequest();
    const ip = request.socket?.remoteAddress || "unknown";
    const now = Date.now();

    // Clean up old entries
    this.cleanup(now);

    // Get or create rate limit info
    let rateInfo = this.requests.get(ip);

    if (!rateInfo || now > rateInfo.resetTime) {
      rateInfo = {
        count: 0,
        resetTime: now + this.windowMs,
      };
      this.requests.set(ip, rateInfo);
    }

    rateInfo.count++;

    // Check if rate limit exceeded
    if (rateInfo.count > this.maxRequests) {
      throw new HttpException("Too many requests", 429);
    }

    return await next.handle();
  }

  private cleanup(now: number) {
    for (const [ip, info] of this.requests.entries()) {
      if (now > info.resetTime) {
        this.requests.delete(ip);
      }
    }
  }
}
