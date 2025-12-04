/**
 * API Key Authentication Guard
 */

import { CanActivate, ExecutionContext } from "../common/interfaces";
import { UnauthorizedException } from "./exception.filter";
import * as crypto from "crypto";

export interface ApiKey {
  key: string;
  name: string;
  userId?: string;
  scopes?: string[];
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface ApiKeyOptions {
  header?: string;
  prefix?: string;
  store?: ApiKeyStore;
}

/**
 * API Key Store Interface
 */
export interface ApiKeyStore {
  find(key: string): Promise<ApiKey | null>;
  save(apiKey: ApiKey): Promise<void>;
  revoke(key: string): Promise<void>;
  rotate(oldKey: string): Promise<ApiKey>;
}

/**
 * In-Memory API Key Store
 */
export class InMemoryApiKeyStore implements ApiKeyStore {
  private keys: Map<string, ApiKey> = new Map();

  async find(key: string): Promise<ApiKey | null> {
    return this.keys.get(key) || null;
  }

  async save(apiKey: ApiKey): Promise<void> {
    this.keys.set(apiKey.key, apiKey);
  }

  async revoke(key: string): Promise<void> {
    this.keys.delete(key);
  }

  async rotate(oldKey: string): Promise<ApiKey> {
    const oldApiKey = await this.find(oldKey);
    if (!oldApiKey) {
      throw new Error("API key not found");
    }

    const newKey = ApiKeyService.generate();
    const newApiKey: ApiKey = {
      ...oldApiKey,
      key: newKey,
      createdAt: new Date(),
    };

    await this.revoke(oldKey);
    await this.save(newApiKey);

    return newApiKey;
  }
}

/**
 * API Key Guard
 */
export class ApiKeyGuard implements CanActivate {
  private options: Required<ApiKeyOptions>;

  constructor(options: ApiKeyOptions = {}) {
    this.options = {
      header: options.header || "x-api-key",
      prefix: options.prefix || "",
      store: options.store || new InMemoryApiKeyStore(),
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException("API key missing");
    }

    const storedKey = await this.options.store.find(apiKey);

    if (!storedKey) {
      throw new UnauthorizedException("Invalid API key");
    }

    // Check expiration
    if (storedKey.expiresAt && storedKey.expiresAt < new Date()) {
      throw new UnauthorizedException("API key expired");
    }

    // Update last used
    storedKey.lastUsedAt = new Date();
    await this.options.store.save(storedKey);

    // Attach to request
    (request as any).apiKey = storedKey;

    return true;
  }

  private extractApiKey(request: any): string | null {
    const header = request.headers[this.options.header.toLowerCase()];

    if (!header) return null;

    if (this.options.prefix) {
      if (!header.startsWith(this.options.prefix)) return null;
      return header.slice(this.options.prefix.length).trim();
    }

    return header;
  }
}

/**
 * API Key Service
 */
export class ApiKeyService {
  /**
   * Generate a new API key
   */
  static generate(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Generate API key with prefix
   */
  static generateWithPrefix(prefix: string, length: number = 32): string {
    const key = crypto.randomBytes(length).toString("hex");
    return `${prefix}_${key}`;
  }

  /**
   * Hash API key for storage
   */
  static hash(apiKey: string): string {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
  }

  /**
   * Verify hashed API key
   */
  static verify(apiKey: string, hashedKey: string): boolean {
    const hash = this.hash(apiKey);
    return hash === hashedKey;
  }

  /**
   * Create API key with metadata
   */
  static create(options: {
    name: string;
    userId?: string;
    scopes?: string[];
    expiresIn?: number; // days
  }): ApiKey {
    const key = this.generate();
    const expiresAt = options.expiresIn
      ? new Date(Date.now() + options.expiresIn * 86400000)
      : undefined;

    return {
      key,
      name: options.name,
      userId: options.userId,
      scopes: options.scopes || [],
      expiresAt,
      createdAt: new Date(),
    };
  }
}

/**
 * Scoped API Key Guard - Check scopes
 */
export class ScopedApiKeyGuard extends ApiKeyGuard {
  constructor(private requiredScopes: string[], options?: ApiKeyOptions) {
    super(options);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowed = await super.canActivate(context);
    if (!allowed) return false;

    const request = context.getRequest();
    const apiKey: ApiKey = (request as any).apiKey;

    if (!apiKey.scopes) {
      throw new UnauthorizedException("API key has no scopes");
    }

    const hasRequiredScopes = this.requiredScopes.every((scope) =>
      apiKey.scopes!.includes(scope)
    );

    if (!hasRequiredScopes) {
      throw new UnauthorizedException(
        `API key missing required scopes: ${this.requiredScopes.join(", ")}`
      );
    }

    return true;
  }
}
