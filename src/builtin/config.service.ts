/**
 * Configuration Service with type safety and validation
 */

import * as fs from "fs";

export interface ConfigOptions {
  envFilePath?: string | string[];
  ignoreEnvFile?: boolean;
  validationSchema?: Record<string, ConfigValidation>;
}

export interface ConfigValidation {
  type: "string" | "number" | "boolean" | "url" | "email" | "port";
  required?: boolean;
  default?: any;
  enum?: any[];
  min?: number;
  max?: number;
  pattern?: RegExp;
}

/**
 * Configuration Service
 */
export class ConfigService {
  private config: Map<string, any> = new Map();
  private schema?: Record<string, ConfigValidation>;

  constructor(options: ConfigOptions = {}) {
    this.schema = options.validationSchema;

    // Load environment variables
    if (!options.ignoreEnvFile) {
      this.loadEnvFiles(options.envFilePath);
    }

    // Load from process.env
    this.loadProcessEnv();

    // Validate configuration
    if (this.schema) {
      this.validate();
    }
  }

  /**
   * Load environment files
   */
  private loadEnvFiles(envFilePath?: string | string[]): void {
    const paths = envFilePath
      ? Array.isArray(envFilePath)
        ? envFilePath
        : [envFilePath]
      : [".env", `.env.${process.env.NODE_ENV || "development"}`];

    for (const filePath of paths) {
      if (fs.existsSync(filePath)) {
        this.parseEnvFile(filePath);
      }
    }
  }

  /**
   * Parse .env file
   */
  private parseEnvFile(filePath: string): void {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalIndex = trimmed.indexOf("=");
      if (equalIndex === -1) continue;

      const key = trimmed.slice(0, equalIndex).trim();
      let value = trimmed.slice(equalIndex + 1).trim();

      // Remove quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Don't override existing env vars
      if (!process.env[key]) {
        process.env[key] = value;
      }

      this.config.set(key, value);
    }
  }

  /**
   * Load from process.env
   */
  private loadProcessEnv(): void {
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        this.config.set(key, value);
      }
    }
  }

  /**
   * Validate configuration against schema
   */
  private validate(): void {
    if (!this.schema) return;

    const errors: string[] = [];

    for (const [key, validation] of Object.entries(this.schema)) {
      const value = this.config.get(key);

      // Check required
      if (validation.required && (value === undefined || value === null)) {
        if (validation.default !== undefined) {
          this.config.set(key, validation.default);
          continue;
        }
        errors.push(`Configuration key "${key}" is required but not provided`);
        continue;
      }

      // Skip validation if value is undefined and not required
      if (value === undefined || value === null) {
        if (validation.default !== undefined) {
          this.config.set(key, validation.default);
        }
        continue;
      }

      // Type validation
      const typedValue = this.castValue(value, validation.type);
      if (typedValue === null) {
        errors.push(
          `Configuration key "${key}" must be of type ${validation.type}`
        );
        continue;
      }

      // Enum validation
      if (validation.enum && !validation.enum.includes(typedValue)) {
        errors.push(
          `Configuration key "${key}" must be one of: ${validation.enum.join(
            ", "
          )}`
        );
        continue;
      }

      // Range validation for numbers
      if (validation.type === "number") {
        if (validation.min !== undefined && typedValue < validation.min) {
          errors.push(
            `Configuration key "${key}" must be at least ${validation.min}`
          );
          continue;
        }
        if (validation.max !== undefined && typedValue > validation.max) {
          errors.push(
            `Configuration key "${key}" must be at most ${validation.max}`
          );
          continue;
        }
      }

      // Pattern validation for strings
      if (
        validation.type === "string" &&
        validation.pattern &&
        !validation.pattern.test(typedValue)
      ) {
        errors.push(
          `Configuration key "${key}" does not match required pattern`
        );
        continue;
      }

      // Update with typed value
      this.config.set(key, typedValue);
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
    }
  }

  /**
   * Cast value to specified type
   */
  private castValue(value: any, type: string): any {
    switch (type) {
      case "string":
        return String(value);

      case "number": {
        const num = Number(value);
        return isNaN(num) ? null : num;
      }

      case "boolean":
        if (typeof value === "boolean") return value;
        if (value === "true") return true;
        if (value === "false") return false;
        return null;

      case "port": {
        const port = Number(value);
        if (isNaN(port) || port < 0 || port > 65535) return null;
        return port;
      }

      case "url":
        try {
          new URL(value);
          return String(value);
        } catch {
          return null;
        }

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? String(value) : null;

      default:
        return value;
    }
  }

  /**
   * Get configuration value
   */
  get<T = any>(key: string): T | undefined;
  get<T = any>(key: string, defaultValue: T): T;
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    const value = this.config.get(key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Get required configuration value (throws if not found)
   */
  getOrThrow<T = any>(key: string): T {
    const value = this.config.get(key);
    if (value === undefined || value === null) {
      throw new Error(`Configuration key "${key}" is required but not found`);
    }
    return value;
  }

  /**
   * Set configuration value
   */
  set(key: string, value: any): void {
    this.config.set(key, value);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.config.has(key);
  }

  /**
   * Get all configuration
   */
  getAll(): Record<string, any> {
    return Object.fromEntries(this.config);
  }
}

/**
 * Global config instance
 */
let globalConfig: ConfigService | null = null;

/**
 * Create and set global config
 */
export function createConfig(options?: ConfigOptions): ConfigService {
  globalConfig = new ConfigService(options);
  return globalConfig;
}

/**
 * Get global config instance
 */
export function getConfig(): ConfigService {
  if (!globalConfig) {
    globalConfig = new ConfigService();
  }
  return globalConfig;
}

/**
 * Configuration property decorator
 */
export function ConfigProperty(
  key: string,
  defaultValue?: any
): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Object.defineProperty(target, propertyKey, {
      get() {
        const config = getConfig();
        return config.get(key, defaultValue);
      },
      enumerable: true,
      configurable: true,
    });
  };
}
