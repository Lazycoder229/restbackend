import "reflect-metadata";

/**
 * Cache metadata key
 */
export const CACHE_METADATA = Symbol("cache");
export const CACHE_EVICT_METADATA = Symbol("cacheEvict");

/**
 * Cache store interface
 */
export interface CacheStore {
  get<T = any>(key: string): Promise<T | undefined>;
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * In-memory LRU cache store
 */
export class InMemoryCacheStore implements CacheStore {
  private cache = new Map<string, { value: any; expires: number }>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    const item = this.cache.get(key);

    if (!item) return undefined;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }

    // LRU: Move to end
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value as T;
  }

  async set<T = any>(key: string, value: T, ttl: number = 3600): Promise<void> {
    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

/**
 * Redis cache store
 */
export class RedisCacheStore implements CacheStore {
  constructor(private redis: any) {}

  async get<T = any>(key: string): Promise<T | undefined> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : undefined;
  }

  async set<T = any>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async clear(): Promise<void> {
    await this.redis.flushdb();
  }

  async has(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }
}

/**
 * Cache manager
 */
export class CacheManager {
  constructor(private store: CacheStore, private namespace: string = "app") {}

  /**
   * Get from cache
   */
  async get<T = any>(key: string): Promise<T | undefined> {
    return this.store.get<T>(this.getKey(key));
  }

  /**
   * Set to cache
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    return this.store.set(this.getKey(key), value, ttl);
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    return this.store.delete(this.getKey(key));
  }

  /**
   * Clear namespace
   */
  async clear(): Promise<void> {
    return this.store.clear();
  }

  /**
   * Get or set
   */
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Remember (alias for getOrSet)
   */
  async remember<T = any>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return this.getOrSet(key, factory, ttl);
  }

  /**
   * Get namespaced key
   */
  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
}

/**
 * Cache decorator
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Cache({ ttl: 300, key: 'user' })
 *   async getUser(id: string) {
 *     return db.findUser(id);
 *   }
 * }
 * ```
 */
export function Cache(options: {
  ttl?: number;
  key?: string;
  namespace?: string;
}): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheManager = (this as any).cacheManager as CacheManager;

      if (!cacheManager) {
        return originalMethod.apply(this, args);
      }

      const cacheKey = options.key
        ? `${options.key}:${JSON.stringify(args)}`
        : `${String(propertyKey)}:${JSON.stringify(args)}`;

      const cached = await cacheManager.get(cacheKey);

      if (cached !== undefined) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      await cacheManager.set(cacheKey, result, options.ttl);

      return result;
    };

    Reflect.defineMetadata(CACHE_METADATA, options, target, propertyKey);
    return descriptor;
  };
}

/**
 * Cache evict decorator
 */
export function CacheEvict(options: {
  key?: string;
  allEntries?: boolean;
}): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      const cacheManager = (this as any).cacheManager as CacheManager;

      if (cacheManager) {
        if (options.allEntries) {
          await cacheManager.clear();
        } else if (options.key) {
          await cacheManager.delete(options.key);
        }
      }

      return result;
    };

    Reflect.defineMetadata(CACHE_EVICT_METADATA, options, target, propertyKey);
    return descriptor;
  };
}

/**
 * Cache interceptor for HTTP responses
 */
export class CacheInterceptor {
  constructor(
    private cacheManager: CacheManager,
    private defaultTtl: number = 60
  ) {}

  async intercept(req: any, res: any, next: () => Promise<any>): Promise<any> {
    const cacheKey = `http:${req.method}:${req.url}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return cached;
    }

    const result = await next();
    res.setHeader("X-Cache", "MISS");

    if (req.method === "GET") {
      await this.cacheManager.set(cacheKey, result, this.defaultTtl);
    }

    return result;
  }
}

/**
 * ETag generator
 */
export class ETagGenerator {
  /**
   * Generate ETag from content
   */
  static generate(content: string): string {
    const crypto = require("crypto");
    return `"${crypto.createHash("md5").update(content).digest("hex")}"`;
  }

  /**
   * Check if ETag matches
   */
  static matches(etag: string, ifNoneMatch?: string): boolean {
    if (!ifNoneMatch) return false;
    return etag === ifNoneMatch;
  }
}

/**
 * Create cache manager
 */
export function createCacheManager(
  store: CacheStore,
  namespace?: string
): CacheManager {
  return new CacheManager(store, namespace);
}

/**
 * Create in-memory cache
 */
export function createInMemoryCache(maxSize?: number): InMemoryCacheStore {
  return new InMemoryCacheStore(maxSize);
}

/**
 * Create Redis cache
 */
export function createRedisCache(redis: any): RedisCacheStore {
  return new RedisCacheStore(redis);
}
