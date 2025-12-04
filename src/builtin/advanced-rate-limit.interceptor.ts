import { IncomingMessage, ServerResponse } from "http";

/**
 * Rate limit storage interface
 */
export interface RateLimitStore {
  /**
   * Increment counter and return current count
   */
  increment(key: string, windowMs: number): Promise<number>;

  /**
   * Get current count
   */
  get(key: string): Promise<number>;

  /**
   * Reset counter
   */
  reset(key: string): Promise<void>;

  /**
   * Reset all counters
   */
  resetAll(): Promise<void>;
}

/**
 * In-memory rate limit store
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now >= existing.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return 1;
    }

    existing.count++;
    return existing.count;
  }

  async get(key: string): Promise<number> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now >= existing.resetTime) {
      return 0;
    }

    return existing.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async resetAll(): Promise<void> {
    this.store.clear();
  }
}

/**
 * Redis rate limit store (requires redis client)
 */
export class RedisRateLimitStore implements RateLimitStore {
  constructor(private redisClient: any) {}

  async increment(key: string, windowMs: number): Promise<number> {
    const redisKey = `ratelimit:${key}`;
    const count = await this.redisClient.incr(redisKey);

    if (count === 1) {
      // First request, set expiration
      await this.redisClient.pexpire(redisKey, windowMs);
    }

    return count;
  }

  async get(key: string): Promise<number> {
    const redisKey = `ratelimit:${key}`;
    const count = await this.redisClient.get(redisKey);
    return count ? parseInt(count, 10) : 0;
  }

  async reset(key: string): Promise<void> {
    const redisKey = `ratelimit:${key}`;
    await this.redisClient.del(redisKey);
  }

  async resetAll(): Promise<void> {
    const keys = await this.redisClient.keys("ratelimit:*");
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }
}

/**
 * Advanced rate limit options
 */
export interface AdvancedRateLimitOptions {
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number;

  /**
   * Max number of requests per window
   * @default 100
   */
  max?: number;

  /**
   * Rate limit store (in-memory or Redis)
   * @default InMemoryRateLimitStore
   */
  store?: RateLimitStore;

  /**
   * Custom key generator
   * @default IP-based
   */
  keyGenerator?: (req: IncomingMessage) => string;

  /**
   * Handler when rate limit is exceeded
   */
  handler?: (req: IncomingMessage, res: ServerResponse) => void;

  /**
   * Skip rate limiting for certain requests
   */
  skip?: (req: IncomingMessage) => boolean;

  /**
   * Message when rate limit is exceeded
   */
  message?: string;

  /**
   * Standard headers (X-RateLimit-*)
   * @default true
   */
  standardHeaders?: boolean;

  /**
   * Legacy headers (X-Rate-Limit-*)
   * @default false
   */
  legacyHeaders?: boolean;

  /**
   * Skip successful requests
   * @default false
   */
  skipSuccessfulRequests?: boolean;

  /**
   * Skip failed requests
   * @default false
   */
  skipFailedRequests?: boolean;

  /**
   * Request property to use for limiting (e.g., 'user.id' for per-user limiting)
   */
  requestProperty?: string;
}

/**
 * Advanced Rate Limit Interceptor with Redis support
 *
 * @example
 * ```typescript
 * // Per-IP rate limiting with Redis
 * const redis = require('redis').createClient();
 * const redisStore = new RedisRateLimitStore(redis);
 *
 * @Controller('/api')
 * @UseInterceptors(new AdvancedRateLimitInterceptor({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 100, // 100 requests per window
 *   store: redisStore
 * }))
 * export class ApiController {}
 *
 * // Per-user rate limiting
 * @UseInterceptors(new AdvancedRateLimitInterceptor({
 *   windowMs: 60000,
 *   max: 10,
 *   keyGenerator: (req) => {
 *     return (req as any).user?.id || 'anonymous';
 *   }
 * }))
 * async createPost() {}
 *
 * // Skip authenticated users
 * @UseInterceptors(new AdvancedRateLimitInterceptor({
 *   skip: (req) => !!(req as any).user
 * }))
 * ```
 */
export class AdvancedRateLimitInterceptor {
  private store: RateLimitStore;
  private windowMs: number;
  private max: number;
  private keyGenerator: (req: IncomingMessage) => string;
  private handler?: (req: IncomingMessage, res: ServerResponse) => void;
  private skip?: (req: IncomingMessage) => boolean;
  private message: string;
  private standardHeaders: boolean;
  private legacyHeaders: boolean;
  private skipSuccessfulRequests: boolean;
  private skipFailedRequests: boolean;
  private requestProperty?: string;

  constructor(options: AdvancedRateLimitOptions = {}) {
    this.store = options.store || new InMemoryRateLimitStore();
    this.windowMs = options.windowMs || 60000;
    this.max = options.max || 100;
    this.keyGenerator =
      options.keyGenerator || this.defaultKeyGenerator.bind(this);
    this.handler = options.handler;
    this.skip = options.skip;
    this.message =
      options.message || "Too many requests, please try again later.";
    this.standardHeaders = options.standardHeaders !== false;
    this.legacyHeaders = options.legacyHeaders === true;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests === true;
    this.skipFailedRequests = options.skipFailedRequests === true;
    this.requestProperty = options.requestProperty;
  }

  private defaultKeyGenerator(req: IncomingMessage): string {
    // Extract IP from various headers
    const forwarded = req.headers["x-forwarded-for"];
    const realIp = req.headers["x-real-ip"];

    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }

    if (typeof realIp === "string") {
      return realIp;
    }

    return req.socket.remoteAddress || "unknown";
  }

  private getRequestPropertyValue(req: any): string | undefined {
    if (!this.requestProperty) return undefined;

    const parts = this.requestProperty.split(".");
    let value = req;

    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) return undefined;
    }

    return String(value);
  }

  async intercept(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => Promise<any>
  ): Promise<any> {
    // Skip if configured
    if (this.skip && this.skip(req)) {
      return next();
    }

    // Get rate limit key
    let key = this.keyGenerator(req);

    // Use request property if specified
    if (this.requestProperty) {
      const propValue = this.getRequestPropertyValue(req);
      if (propValue) {
        key = propValue;
      }
    }

    // Increment counter
    const count = await this.store.increment(key, this.windowMs);
    const remaining = Math.max(0, this.max - count);
    const resetTime = Date.now() + this.windowMs;

    // Set rate limit headers
    if (this.standardHeaders) {
      res.setHeader("RateLimit-Limit", this.max);
      res.setHeader("RateLimit-Remaining", remaining);
      res.setHeader("RateLimit-Reset", new Date(resetTime).toISOString());
    }

    if (this.legacyHeaders) {
      res.setHeader("X-Rate-Limit-Limit", this.max);
      res.setHeader("X-Rate-Limit-Remaining", remaining);
      res.setHeader("X-Rate-Limit-Reset", new Date(resetTime).toISOString());
    }

    // Check if rate limit exceeded
    if (count > this.max) {
      res.setHeader("Retry-After", Math.ceil(this.windowMs / 1000));

      if (this.handler) {
        return this.handler(req, res);
      }

      res.statusCode = 429;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          statusCode: 429,
          message: this.message,
          error: "Too Many Requests",
        })
      );
      return;
    }

    // Execute handler
    try {
      const result = await next();

      // Skip successful requests if configured
      if (this.skipSuccessfulRequests && res.statusCode < 400) {
        await this.store.reset(key);
      }

      return result;
    } catch (error) {
      // Skip failed requests if configured
      if (this.skipFailedRequests) {
        await this.store.reset(key);
      }

      throw error;
    }
  }
}

/**
 * Distributed rate limiter using sliding window
 */
export class SlidingWindowRateLimiter {
  private store: RateLimitStore;
  private windowMs: number;
  private max: number;
  private keyGenerator: (req: IncomingMessage) => string;

  constructor(options: AdvancedRateLimitOptions = {}) {
    this.store = options.store || new InMemoryRateLimitStore();
    this.windowMs = options.windowMs || 60000;
    this.max = options.max || 100;
    this.keyGenerator =
      options.keyGenerator || this.defaultKeyGenerator.bind(this);
  }

  private defaultKeyGenerator(req: IncomingMessage): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.socket.remoteAddress || "unknown";
  }

  async intercept(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => Promise<any>
  ): Promise<any> {
    const key = this.keyGenerator(req);
    const now = Date.now();

    // Use sliding window algorithm
    const currentWindow = Math.floor(now / this.windowMs);
    const previousWindow = currentWindow - 1;

    const currentKey = `${key}:${currentWindow}`;
    const previousKey = `${key}:${previousWindow}`;

    const currentCount = await this.store.get(currentKey);
    const previousCount = await this.store.get(previousKey);

    const percentageInCurrent = (now % this.windowMs) / this.windowMs;
    const weightedCount =
      previousCount * (1 - percentageInCurrent) + currentCount;

    if (weightedCount >= this.max) {
      res.statusCode = 429;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          statusCode: 429,
          message: "Too many requests",
          error: "Too Many Requests",
        })
      );
      return;
    }

    await this.store.increment(currentKey, this.windowMs * 2);
    return next();
  }
}

/**
 * Helper to create Redis store
 */
export function createRedisStore(redisClient: any): RedisRateLimitStore {
  return new RedisRateLimitStore(redisClient);
}

/**
 * Helper to create in-memory store
 */
export function createMemoryStore(): InMemoryRateLimitStore {
  return new InMemoryRateLimitStore();
}
