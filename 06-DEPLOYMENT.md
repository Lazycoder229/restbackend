# Deployment Guide

Deploy your RestJS application to production with confidence. This guide covers multiple deployment strategies.

## Table of Contents

1. [Production Checklist](#production-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Building for Production](#building-for-production)
4. [PM2 Deployment](#pm2-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Platforms](#cloud-platforms)
7. [Database Setup](#database-setup)
8. [Monitoring & Logs](#monitoring--logs)
9. [Performance Optimization](#performance-optimization)

---

## Production Checklist

Before deploying to production:

- ✅ Set `NODE_ENV=production`
- ✅ Use strong JWT secret (not default)
- ✅ Enable HTTPS
- ✅ Configure CORS properly
- ✅ Set up rate limiting
- ✅ Use environment variables for secrets
- ✅ Enable security headers
- ✅ Set up logging
- ✅ Configure database connection pooling
- ✅ Test all endpoints
- ✅ Set up monitoring
- ✅ Configure backups

---

## Environment Configuration

### Create `.env` File

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=your-super-secret-key-min-32-chars-long-random-string
JWT_EXPIRATION=24h

# Database
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-database-name
DB_CONNECTION_LIMIT=10

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Load Environment Variables

```typescript
// main.ts
import "dotenv/config";

async function bootstrap() {
  // Validate required env vars
  const requiredEnvVars = [
    "JWT_SECRET",
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // ... rest of bootstrap
}
```

---

## Building for Production

### Step 1: Build TypeScript

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

This creates the `dist/` folder with compiled JavaScript.

### Step 2: Production Start Script

Update `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "dev": "nodemon --exec ts-node src/main.ts"
  }
}
```

### Step 3: Test Production Build

```bash
NODE_ENV=production npm start
```

---

## PM2 Deployment

PM2 is a process manager for Node.js applications.

### Step 1: Install PM2

```bash
npm install -g pm2
```

### Step 2: Create PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "restjs-api",
      script: "./dist/main.js",
      instances: "max", // Use all CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "500M",
    },
  ],
};
```

### Step 3: Start with PM2

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs restjs-api

# Restart
pm2 restart restjs-api

# Stop
pm2 stop restjs-api

# Monitor
pm2 monit

# Delete
pm2 delete restjs-api
```

---

## Docker Deployment

Containerize your application with Docker.

### Step 1: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["node", "dist/main.js"]
```

### Step 2: Create .dockerignore

```
node_modules
dist
.env
.git
*.md
test
uploads
```

### Step 3: Build Docker Image

```bash
docker build -t restjs-api:latest .
```

### Step 4: Run Container

```bash
docker run -d \
  --name restjs-api \
  -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e DB_HOST=your-db-host \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e DB_NAME=your-db-name \
  restjs-api:latest
```

### Step 5: Docker Compose (with MySQL)

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=myapp
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
      - MYSQL_DATABASE=myapp
    volumes:
      - mysql-data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql-data:
```

Run with:

```bash
docker-compose up -d
```

---

## Cloud Platforms

### AWS EC2

1. **Launch EC2 Instance** (Ubuntu 22.04)
2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. **Clone Repository:**
   ```bash
   git clone https://github.com/yourusername/restjs-api.git
   cd restjs-api
   ```
4. **Install & Build:**
   ```bash
   npm install
   npm run build
   ```
5. **Setup PM2:**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```
6. **Configure Nginx (reverse proxy):**

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### DigitalOcean Droplet

Same as AWS EC2 above.

### Heroku

1. **Create `Procfile`:**

   ```
   web: node dist/main.js
   ```

2. **Deploy:**

   ```bash
   heroku create your-app-name
   git push heroku main
   ```

3. **Set Environment Variables:**
   ```bash
   heroku config:set JWT_SECRET=your-secret
   heroku config:set DB_HOST=your-db-host
   ```

### Railway

1. **Connect GitHub Repository**
2. **Add Environment Variables** in dashboard
3. **Deploy automatically** on push

### Render

1. **Create Web Service**
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `npm start`
4. **Add Environment Variables**

---

## Database Setup

### MySQL Production Configuration

```typescript
// main.ts
const db = app.get<DatabaseService>(DatabaseService);

db.initialize({
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});
```

### Database Migration Script

```sql
-- migrations/001_create_users.sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

Run migrations:

```bash
mysql -u root -p myapp < migrations/001_create_users.sql
```

---

## Monitoring & Logs

### Winston Logger

Install:

```bash
npm install winston
```

Create logger:

```typescript
// logger.ts
import * as winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

Use in application:

```typescript
import { logger } from "./logger";

logger.info("Server started on port 3000");
logger.error("Database connection failed", { error: err.message });
```

### Health Check Endpoint

```typescript
// health.controller.ts
import { Controller, Get, DatabaseService } from "./index";

@Controller("/health")
export class HealthController {
  constructor(private db: DatabaseService) {}

  @Get()
  async checkHealth() {
    const dbHealth = await this.db.healthCheck();

    return {
      status: dbHealth ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth ? "connected" : "disconnected",
    };
  }
}
```

---

## Performance Optimization

### 1. Enable Compression

RestJS has built-in compression. Enable it:

```typescript
// main.ts
import { CompressionInterceptor } from "./builtin/compression-interceptor";

app.useGlobalInterceptors(new CompressionInterceptor());
```

### 2. Database Connection Pooling

```typescript
db.initialize({
  connectionLimit: 10, // Adjust based on load
  waitForConnections: true,
  queueLimit: 0,
});
```

### 3. Clustering (Multi-core)

Use PM2 cluster mode:

```javascript
// ecosystem.config.js
{
  instances: "max", // Use all CPU cores
  exec_mode: "cluster"
}
```

### 4. Caching

```typescript
// cache.service.ts
@Injectable()
export class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, value: any, ttl: number = 60000) {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }
}
```

### 5. Query Optimization

```typescript
// Use indexes
await repo.findBy("email", "user@example.com"); // Fast with index

// Limit results
await qb.table("users").select().limit(100).get();

// Pagination
await repo.paginate(1, 20); // Page 1, 20 per page
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

1. **Install Certbot:**

   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Get Certificate:**

   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Auto-renewal:**
   ```bash
   sudo certbot renew --dry-run
   ```

### Manual SSL Configuration

```typescript
// production.ts
import * as https from "https";
import * as fs from "fs";

const httpsOptions = {
  key: fs.readFileSync("/path/to/private-key.pem"),
  cert: fs.readFileSync("/path/to/certificate.pem"),
};

const server = https.createServer(httpsOptions, app.getHttpAdapter());
server.listen(443, () => {
  console.log("HTTPS Server running on port 443");
});
```

---

## Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y-%m-%d)
mysqldump -u root -p myapp > /backups/myapp-$DATE.sql
```

### Automated Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

---

## Summary

Your deployment checklist:

1. ✅ Configure environment variables
2. ✅ Build for production (`npm run build`)
3. ✅ Choose deployment method (PM2/Docker/Cloud)
4. ✅ Set up database with connection pooling
5. ✅ Enable HTTPS with SSL certificate
6. ✅ Configure logging and monitoring
7. ✅ Set up health checks
8. ✅ Enable performance optimizations
9. ✅ Configure automated backups
10. ✅ Test all endpoints in production

Your app is production-ready! 🚀

---

## Next Steps

- **[Security Guide](./SECURITY_GUIDE.md)** - Secure your production app
- **[ORM Guide](./ORM_GUIDE.md)** - Database best practices
- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
