# Config Service Documentation

## Overview

The ConfigService provides centralized configuration management for Fynix applications, supporting environment variables, `.env` files, validation schemas, type safety, and default values.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Validation Schema](#validation-schema)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { ConfigService } from "./builtin/config.service";
```

### Environment File (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=myapp

# App
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key

# External APIs
API_KEY=your-api-key
API_URL=https://api.example.com
```

---

## Basic Usage

```typescript
const config = new ConfigService();

// Get values
const dbHost = config.get("DB_HOST");
const port = config.get("PORT", 3000); // with default
const apiKey = config.get<string>("API_KEY");

// Check if key exists
if (config.has("REDIS_URL")) {
  const redisUrl = config.get("REDIS_URL");
}

// Get all config
const allConfig = config.getAll();
```

---

## API Reference

### Constructor

#### `new ConfigService(options?: ConfigOptions)`

Create a new config service instance.

```typescript
const config = new ConfigService({
  envFilePath: ".env.production",
  ignoreEnvFile: false,
  schema: validationSchema,
});
```

### Methods

#### `get<T = any>(key: string, defaultValue?: T): T`

Get configuration value by key.

```typescript
const dbHost = config.get("DB_HOST");
const port = config.get("PORT", 3000);
const nodeEnv = config.get<string>("NODE_ENV", "development");
```

#### `getOrThrow<T = any>(key: string): T`

Get configuration value or throw error if not found.

```typescript
const jwtSecret = config.getOrThrow("JWT_SECRET");
// Throws error if JWT_SECRET is not defined
```

#### `has(key: string): boolean`

Check if configuration key exists.

```typescript
if (config.has("REDIS_URL")) {
  // Redis is configured
}
```

#### `set(key: string, value: any): void`

Set configuration value.

```typescript
config.set("CUSTOM_KEY", "custom-value");
```

#### `getAll(): Record<string, any>`

Get all configuration values.

```typescript
const allConfig = config.getAll();
console.log(allConfig);
```

---

## Validation Schema

### Defining Schema

```typescript
const configSchema = {
  PORT: {
    type: "number",
    required: true,
    default: 3000,
    min: 1024,
    max: 65535,
  },
  NODE_ENV: {
    type: "string",
    required: true,
    enum: ["development", "production", "test"],
    default: "development",
  },
  DB_HOST: {
    type: "string",
    required: true,
  },
  DB_PORT: {
    type: "number",
    required: true,
    default: 3306,
  },
  JWT_SECRET: {
    type: "string",
    required: true,
    pattern: /^[A-Za-z0-9-_]+$/,
  },
  API_URL: {
    type: "string",
    required: false,
    pattern: /^https?:\/\/.+/,
  },
};

const config = new ConfigService({ schema: configSchema });
```

### Schema Options

| Property   | Type    | Description                               |
| ---------- | ------- | ----------------------------------------- |
| `type`     | string  | Value type: 'string', 'number', 'boolean' |
| `required` | boolean | Whether the key is required               |
| `default`  | any     | Default value if not provided             |
| `enum`     | array   | Allowed values                            |
| `min`      | number  | Minimum value (for numbers)               |
| `max`      | number  | Maximum value (for numbers)               |
| `pattern`  | RegExp  | Pattern to match (for strings)            |

---

## Best Practices

### 1. Use Type-Safe Configuration

```typescript
// Good - type-safe access
interface AppConfig {
  PORT: number;
  DB_HOST: string;
  JWT_SECRET: string;
  NODE_ENV: "development" | "production" | "test";
}

@Injectable()
export class ConfigService {
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config.get(key);
  }
}
```

### 2. Define Validation Schema

```typescript
// Good - validated configuration
const config = new ConfigService({
  schema: {
    DB_HOST: { type: "string", required: true },
    DB_PORT: { type: "number", required: true, min: 1, max: 65535 },
    JWT_SECRET: { type: "string", required: true, pattern: /^.{32,}$/ },
  },
});
```

### 3. Use Environment-Specific Files

```typescript
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

const config = new ConfigService({ envFilePath: envFile });
```

### 4. Don't Hardcode Sensitive Values

```typescript
// Good - use environment variables
const config = new ConfigService();
const dbPassword = config.get("DB_PASSWORD");

// Bad - hardcoded secrets
const dbPassword = "my-secret-password";
```

### 5. Provide Sensible Defaults

```typescript
// Good - defaults for non-critical values
const port = config.get("PORT", 3000);
const logLevel = config.get("LOG_LEVEL", "info");

// Bad - required for everything
const timeout = config.getOrThrow("TIMEOUT"); // Could have default
```

---

## Examples

### Database Configuration

```typescript
@Injectable()
export class DatabaseConfig {
  constructor(private config: ConfigService) {}

  getConnectionOptions() {
    return {
      host: this.config.get("DB_HOST", "localhost"),
      port: this.config.get("DB_PORT", 3306),
      user: this.config.get("DB_USER", "root"),
      password: this.config.getOrThrow("DB_PASSWORD"),
      database: this.config.get("DB_NAME", "myapp"),
      connectionLimit: this.config.get("DB_POOL_SIZE", 10),
    };
  }
}
```

### Application Configuration

```typescript
@Injectable()
export class AppConfig {
  constructor(private config: ConfigService) {}

  get port(): number {
    return this.config.get("PORT", 3000);
  }

  get env(): string {
    return this.config.get("NODE_ENV", "development");
  }

  get isDevelopment(): boolean {
    return this.env === "development";
  }

  get isProduction(): boolean {
    return this.env === "production";
  }

  get jwtSecret(): string {
    return this.config.getOrThrow("JWT_SECRET");
  }

  get jwtExpiresIn(): string {
    return this.config.get("JWT_EXPIRES_IN", "1h");
  }
}
```

### Complete Configuration Service

```typescript
const configSchema = {
  // Server
  PORT: {
    type: "number",
    required: false,
    default: 3000,
    min: 1024,
    max: 65535,
  },
  NODE_ENV: {
    type: "string",
    required: false,
    enum: ["development", "production", "test"],
    default: "development",
  },

  // Database
  DB_HOST: {
    type: "string",
    required: true,
  },
  DB_PORT: {
    type: "number",
    required: false,
    default: 3306,
  },
  DB_USER: {
    type: "string",
    required: true,
  },
  DB_PASSWORD: {
    type: "string",
    required: true,
  },
  DB_NAME: {
    type: "string",
    required: true,
  },

  // Security
  JWT_SECRET: {
    type: "string",
    required: true,
    pattern: /^[A-Za-z0-9-_]{32,}$/,
  },
  JWT_EXPIRES_IN: {
    type: "string",
    required: false,
    default: "1h",
  },

  // Redis (optional)
  REDIS_HOST: {
    type: "string",
    required: false,
  },
  REDIS_PORT: {
    type: "number",
    required: false,
    default: 6379,
  },
};

@Injectable()
export class AppConfigService {
  private config: ConfigService;

  constructor() {
    this.config = new ConfigService({
      envFilePath: ".env",
      schema: configSchema,
    });
  }

  // Server config
  getPort(): number {
    return this.config.get("PORT");
  }

  getEnv(): string {
    return this.config.get("NODE_ENV");
  }

  // Database config
  getDatabaseConfig() {
    return {
      host: this.config.get("DB_HOST"),
      port: this.config.get("DB_PORT"),
      user: this.config.get("DB_USER"),
      password: this.config.get("DB_PASSWORD"),
      database: this.config.get("DB_NAME"),
    };
  }

  // Redis config
  getRedisConfig() {
    if (!this.config.has("REDIS_HOST")) {
      return null;
    }

    return {
      host: this.config.get("REDIS_HOST"),
      port: this.config.get("REDIS_PORT"),
    };
  }

  // JWT config
  getJwtConfig() {
    return {
      secret: this.config.get("JWT_SECRET"),
      expiresIn: this.config.get("JWT_EXPIRES_IN"),
    };
  }
}
```

---

## Related Documentation

- [Database Service](./DATABASE_SERVICE.md)
- [Logger](./LOGGER.md)
- [Security Service](./SECURITY_SERVICE.md)
- [Cache Service](./CACHE_SERVICE.md)

---

**Last Updated**: December 4, 2025
