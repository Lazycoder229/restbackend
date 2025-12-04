# 12 - Deployment & Production

## 📋 Table of Contents

- [Production Checklist](#production-checklist)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Docker Deployment](#docker-deployment)
- [PM2 Process Manager](#pm2-process-manager)
- [Nginx Configuration](#nginx-configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring & Logging](#monitoring--logging)
- [Performance Optimization](#performance-optimization)
- [Scaling Strategies](#scaling-strategies)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security Hardening](#security-hardening)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)

---

## ✅ Production Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Error logging set up
- [ ] Monitoring tools configured
- [ ] Backup strategy in place
- [ ] Performance tested under load
- [ ] Documentation updated

### Post-Deployment

- [ ] Health checks passing
- [ ] Logs monitoring
- [ ] Performance metrics tracking
- [ ] Error alerts configured
- [ ] Backup system verified
- [ ] Rollback plan ready

---

## 🔐 Environment Configuration

### .env File Structure

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-db-host.com
DB_PORT=3306
DB_USERNAME=your_user
DB_PASSWORD=your_secure_password
DB_DATABASE=your_production_db

# JWT
JWT_SECRET=your-super-secure-secret-key-min-32-characters
JWT_EXPIRES_IN=7d

# API Keys
API_KEY=your-api-key
STRIPE_SECRET_KEY=your-stripe-key

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=error
LOG_FILE=logs/production.log

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15
```

### Config Service

```typescript
// config.service.ts
import { Injectable } from "@fynixjs/fynix";

@Injectable()
export class ConfigService {
  get(key: string): string {
    return process.env[key] || "";
  }

  getNumber(key: string, defaultValue: number = 0): number {
    return parseInt(process.env[key] || String(defaultValue), 10);
  }

  getBoolean(key: string, defaultValue: boolean = false): boolean {
    return process.env[key] === "true" || defaultValue;
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  }

  isDevelopment(): boolean {
    return process.env.NODE_ENV === "development";
  }

  validate(): void {
    const required = [
      "NODE_ENV",
      "PORT",
      "DB_HOST",
      "DB_USERNAME",
      "DB_PASSWORD",
      "JWT_SECRET",
    ];

    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    // Validate JWT secret length
    if (process.env.JWT_SECRET!.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters");
    }
  }
}
```

### Using Config Service

```typescript
// main.ts
import { ConfigService } from "./config.service";

const configService = new ConfigService();

// Validate environment variables on startup
configService.validate();

const app = await FynixFactory.create(AppModule);
await app.init();

const port = configService.getNumber("PORT", 3000);
await app.listen(port);

console.log(
  `Application running in ${process.env.NODE_ENV} mode on port ${port}`
);
```

---

## 💾 Database Setup

### Production Database Configuration

```typescript
// database.config.ts
import { DatabaseService } from "@fynixjs/fynix";

export const databaseConfig = {
  development: {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "root",
    database: "myapp_dev",
    synchronize: true,
    logging: true,
  },
  production: {
    type: "mysql",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false, // NEVER use in production
    logging: false,
    pool: {
      max: 20,
      min: 5,
      idle: 10000,
      acquire: 30000,
    },
    ssl: {
      rejectUnauthorized: false,
    },
  },
};

export function getDatabaseConfig() {
  const env = process.env.NODE_ENV || "development";
  return databaseConfig[env];
}
```

### Database Migrations

```typescript
// migrations/001_create_users_table.ts
export default {
  up: async (db: any) => {
    await db.query(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  },

  down: async (db: any) => {
    await db.query("DROP TABLE IF EXISTS users");
  },
};
```

### Running Migrations

```bash
# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Create new migration
npm run migration:create -- create_posts_table
```

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_USERNAME=root
      - DB_PASSWORD=secret
      - DB_DATABASE=myapp
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  mysql:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=secret
      - MYSQL_DATABASE=myapp
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  mysql_data:
```

### Building and Running

```bash
# Build image
docker build -t myapp:latest .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 🔄 PM2 Process Manager

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "myapp",
      script: "dist/main.js",
      instances: "max", // Use all CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_memory_restart: "500M",
      autorestart: true,
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
```

### PM2 Commands

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Start with specific environment
pm2 start ecosystem.config.js --env production

# View status
pm2 status

# View logs
pm2 logs myapp

# Monitor
pm2 monit

# Restart
pm2 restart myapp

# Stop
pm2 stop myapp

# Delete
pm2 delete myapp

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

---

## 🌐 Nginx Configuration

### Nginx as Reverse Proxy

```nginx
# /etc/nginx/sites-available/myapp
upstream myapp {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Client body size limit
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://myapp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /static {
        alias /var/www/myapp/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://myapp;
    }

    # Logs
    access_log /var/log/nginx/myapp_access.log;
    error_log /var/log/nginx/myapp_error.log;
}
```

### Enable Nginx Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL/HTTPS Setup

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Auto-renewal is set up in cron
sudo systemctl status certbot.timer
```

---

## 📊 Monitoring & Logging

### Winston Logger

```typescript
// logger.service.ts
import winston from "winston";

export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
        }),
      ],
    });

    if (process.env.NODE_ENV !== "production") {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        })
      );
    }
  }

  error(message: string, trace?: string): void {
    this.logger.error(message, { trace });
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  info(message: string): void {
    this.logger.info(message);
  }

  debug(message: string): void {
    this.logger.debug(message);
  }
}
```

### Health Check Endpoint

```typescript
@Controller("/health")
export class HealthController {
  constructor(
    private databaseService: DatabaseService,
    private cacheService: CacheService
  ) {}

  @Get()
  async check() {
    const checks = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: await this.checkDatabase(),
      cache: await this.checkCache(),
      memory: this.getMemoryUsage(),
    };

    const isHealthy = checks.database && checks.cache;
    const status = isHealthy ? 200 : 503;

    return { ...checks, healthy: isHealthy };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.databaseService.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  private async checkCache(): Promise<boolean> {
    try {
      await this.cacheService.set("health_check", "ok", 10);
      return true;
    } catch {
      return false;
    }
  }

  private getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    };
  }
}
```

---

## ⚡ Performance Optimization

### Build Optimization

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "outDir": "./dist",
    "removeComments": true,
    "sourceMap": false,
    "declaration": false
  }
}
```

### Production Main File

```typescript
// main.ts
import { FynixFactory } from "@fynixjs/fynix";
import { AppModule } from "./app.module";
import { CompressionInterceptor } from "./interceptors/compression.interceptor";
import { LoggerService } from "./logger.service";

async function bootstrap() {
  const logger = new LoggerService();

  try {
    const app = await FynixFactory.create(AppModule);
    await app.init();

    // Apply production optimizations
    if (process.env.NODE_ENV === "production") {
      app.useGlobalInterceptors(new CompressionInterceptor());
      app.disableDetailedErrors();
    }

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.info(`Application started on port ${port}`);
  } catch (error) {
    logger.error("Failed to start application", error.stack);
    process.exit(1);
  }
}

bootstrap();
```

---

## 📈 Scaling Strategies

### Horizontal Scaling

```yaml
# docker-compose-scaled.yml
version: "3.8"

services:
  app:
    image: myapp:latest
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
    environment:
      - NODE_ENV=production

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
```

---

## 🔐 Security Hardening

### Production Security Checklist

```typescript
// security.config.ts
export const securityConfig = {
  // Helmet-like security headers
  helmet: {
    contentSecurityPolicy: true,
    xFrameOptions: "SAMEORIGIN",
    xContentTypeOptions: "nosniff",
    xXssProtection: "1; mode=block",
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(","),
    credentials: true,
  },

  // CSRF protection
  csrf: {
    enabled: true,
  },
};
```

---

## 📚 Best Practices

✅ Use environment variables for configuration  
✅ Never commit secrets to version control  
✅ Run database migrations automatically  
✅ Implement health checks  
✅ Enable HTTPS/SSL  
✅ Use process managers (PM2)  
✅ Implement proper logging  
✅ Monitor application metrics  
✅ Set up automated backups  
✅ Use CI/CD for deployments

---

## 💡 Key Takeaways

✅ Always validate environment variables on startup  
✅ Use Docker for consistent deployments  
✅ Implement health checks for monitoring  
✅ Enable SSL/HTTPS in production  
✅ Use Nginx as reverse proxy  
✅ Implement proper logging and monitoring  
✅ Scale horizontally with load balancing  
✅ Harden security with proper headers

---

**Master Deployment** to run production-ready applications!
