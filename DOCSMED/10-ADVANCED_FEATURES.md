# 10 - Advanced Features

## 📋 Table of Contents

- [Caching](#caching)
- [Performance Monitoring](#performance-monitoring)
- [Compression](#compression)
- [Static File Serving](#static-file-serving)
- [File Upload](#file-upload)
- [Pagination](#pagination)
- [Rate Limiting](#rate-limiting)
- [CORS Configuration](#cors-configuration)
- [GraphQL Support](#graphql-support)
- [WebSocket Support](#websocket-support)
- [Background Jobs](#background-jobs)
- [API Versioning](#api-versioning)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)

---

## 🚀 Caching

### Cache Service

```typescript
import { CacheService, Injectable } from "@fynixjs/fynix";

@Injectable()
export class UserService {
  constructor(
    private repository: UserRepository,
    private cacheService: CacheService
  ) {}

  async findById(id: number): Promise<User> {
    // Check cache first
    const cacheKey = `user:${id}`;
    const cached = await this.cacheService.get<User>(cacheKey);

    if (cached) {
      return cached;
    }

    // Fetch from database
    const user = await this.repository.findOne({ id });

    // Store in cache for 5 minutes
    await this.cacheService.set(cacheKey, user, 300);

    return user;
  }

  async update(id: number, data: UpdateUserDto): Promise<User> {
    const user = await this.repository.update(id, data);

    // Invalidate cache
    await this.cacheService.delete(`user:${id}`);

    return user;
  }
}
```

### Cache Interceptor

```typescript
import { Injectable, FynixInterceptor, ExecutionContext } from "@fynixjs/fynix";

@Injectable()
export class CacheInterceptor implements FynixInterceptor {
  constructor(private cacheService: CacheService) {}

  async intercept(context: ExecutionContext, next: () => Promise<any>) {
    const request = context.request;
    const cacheKey = this.generateCacheKey(request);

    // Return cached response if available
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute handler
    const response = await next();

    // Cache the response
    await this.cacheService.set(cacheKey, response, 300);

    return response;
  }

  private generateCacheKey(request: any): string {
    return `cache:${request.method}:${request.url}`;
  }
}

// Usage
@Controller("/products")
export class ProductController {
  @Get()
  @UseInterceptors(CacheInterceptor)
  async findAll() {
    return await this.productService.findAll();
  }
}
```

### Advanced Caching Patterns

```typescript
@Injectable()
export class ProductService {
  constructor(
    private repository: ProductRepository,
    private cacheService: CacheService
  ) {}

  // Cache-aside pattern
  async findById(id: number): Promise<Product> {
    const cacheKey = `product:${id}`;
    const cached = await this.cacheService.get<Product>(cacheKey);

    if (cached) return cached;

    const product = await this.repository.findOne({ id });
    await this.cacheService.set(cacheKey, product, 600);

    return product;
  }

  // Write-through caching
  async create(data: CreateProductDto): Promise<Product> {
    const product = await this.repository.create(data);

    // Cache immediately
    await this.cacheService.set(`product:${product.id}`, product, 600);

    return product;
  }

  // Cache invalidation
  async update(id: number, data: UpdateProductDto): Promise<Product> {
    const product = await this.repository.update(id, data);

    // Invalidate related caches
    await Promise.all([
      this.cacheService.delete(`product:${id}`),
      this.cacheService.delete("products:list"),
      this.cacheService.delete(`products:category:${product.categoryId}`),
    ]);

    return product;
  }

  // Bulk cache warming
  async warmCache(): Promise<void> {
    const products = await this.repository.findAll();

    await Promise.all(
      products.map((product) =>
        this.cacheService.set(`product:${product.id}`, product, 600)
      )
    );
  }
}
```

---

## 📊 Performance Monitoring

### Performance Interceptor

```typescript
import {
  Injectable,
  FynixInterceptor,
  ExecutionContext,
  Logger,
} from "@fynixjs/fynix";

@Injectable()
export class PerformanceInterceptor implements FynixInterceptor {
  private readonly logger = new Logger("Performance");

  async intercept(context: ExecutionContext, next: () => Promise<any>) {
    const request = context.request;
    const startTime = Date.now();

    try {
      const response = await next();
      const duration = Date.now() - startTime;

      this.logPerformance(request, duration, "success");

      // Add performance header
      context.response.setHeader("X-Response-Time", `${duration}ms`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logPerformance(request, duration, "error");
      throw error;
    }
  }

  private logPerformance(request: any, duration: number, status: string): void {
    const logData = {
      method: request.method,
      url: request.url,
      duration: `${duration}ms`,
      status,
    };

    if (duration > 1000) {
      this.logger.warn("Slow request detected", logData);
    } else {
      this.logger.log("Request completed", logData);
    }
  }
}

// Apply globally
app.useGlobalInterceptors(new PerformanceInterceptor());
```

### Performance Service

```typescript
@Injectable()
export class PerformanceService {
  private metrics: Map<string, number[]> = new Map();

  track(endpoint: string, duration: number): void {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    this.metrics.get(endpoint)!.push(duration);
  }

  getStats(endpoint: string) {
    const durations = this.metrics.get(endpoint) || [];
    if (durations.length === 0) return null;

    const sorted = [...durations].sort((a, b) => a - b);

    return {
      count: durations.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getAllStats() {
    const stats: Record<string, any> = {};

    for (const [endpoint, _] of this.metrics) {
      stats[endpoint] = this.getStats(endpoint);
    }

    return stats;
  }
}
```

---

## 🗜️ Compression

### Compression Interceptor

```typescript
import { Injectable, FynixInterceptor, ExecutionContext } from "@fynixjs/fynix";
import * as zlib from "zlib";

@Injectable()
export class CompressionInterceptor implements FynixInterceptor {
  async intercept(context: ExecutionContext, next: () => Promise<any>) {
    const request = context.request;
    const response = context.response;
    const acceptEncoding = request.headers["accept-encoding"] || "";

    const result = await next();

    // Only compress JSON responses
    if (typeof result === "object") {
      const json = JSON.stringify(result);

      // Only compress if size > 1KB
      if (json.length > 1024) {
        if (acceptEncoding.includes("gzip")) {
          const compressed = zlib.gzipSync(json);
          response.setHeader("Content-Encoding", "gzip");
          response.setHeader("Content-Type", "application/json");
          return compressed;
        } else if (acceptEncoding.includes("deflate")) {
          const compressed = zlib.deflateSync(json);
          response.setHeader("Content-Encoding", "deflate");
          response.setHeader("Content-Type", "application/json");
          return compressed;
        }
      }
    }

    return result;
  }
}

// Apply globally
app.useGlobalInterceptors(new CompressionInterceptor());
```

---

## 📁 Static File Serving

### Static Files Configuration

```typescript
import { StaticFilesInterceptor } from "@fynixjs/fynix";

// Serve static files from 'public' directory
app.useStaticAssets("public", {
  prefix: "/static",
});

// Access: http://localhost:3000/static/images/logo.png
```

### Static File Controller

```typescript
@Controller("/files")
export class FileController {
  @Get("/download/:filename")
  async downloadFile(
    @Param("filename") filename: string,
    @Res() response: Response
  ) {
    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException("File not found");
    }

    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    response.sendFile(filePath);
  }

  @Get("/view/:filename")
  async viewFile(
    @Param("filename") filename: string,
    @Res() response: Response
  ) {
    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException("File not found");
    }

    response.sendFile(filePath);
  }
}
```

---

## 📤 File Upload

### File Upload Interceptor

```typescript
import { FileUploadInterceptor, UploadedFile } from "@fynixjs/fynix";

@Controller("/upload")
export class UploadController {
  @Post("/single")
  @UseInterceptors(
    FileUploadInterceptor({
      dest: "uploads/",
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException("Only image files allowed"), false);
        }
        cb(null, true);
      },
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
    };
  }

  @Post("/multiple")
  @UseInterceptors(
    FileUploadInterceptor({
      dest: "uploads/",
      limits: { files: 10, fileSize: 5 * 1024 * 1024 },
    })
  )
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    }));
  }
}
```

### Advanced File Upload

```typescript
@Injectable()
export class FileUploadService {
  private readonly uploadDir = "uploads";
  private readonly maxSize = 10 * 1024 * 1024; // 10MB

  async uploadImage(file: Express.Multer.File): Promise<string> {
    // Validate file type
    if (!file.mimetype.startsWith("image/")) {
      throw new BadRequestException("Only image files allowed");
    }

    // Validate file size
    if (file.size > this.maxSize) {
      throw new BadRequestException("File too large");
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    // Save file
    await fs.promises.writeFile(filePath, file.buffer);

    return filename;
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async getFileUrl(filename: string): string {
    return `/static/uploads/${filename}`;
  }
}
```

---

## 📄 Pagination

### Pagination Service

```typescript
import { PaginationService } from "@fynixjs/fynix";

@Injectable()
export class ProductService {
  constructor(
    private repository: ProductRepository,
    private paginationService: PaginationService
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip: offset,
      take: limit,
    });

    return this.paginationService.paginate(data, total, page, limit);
  }
}
```

### Pagination Response

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Controller("/products")
export class ProductController {
  @Get()
  async findAll(
    @Query("page", ParseIntPipe, new DefaultValuePipe(1)) page: number,
    @Query("limit", ParseIntPipe, new DefaultValuePipe(10)) limit: number
  ): Promise<PaginatedResponse<Product>> {
    return await this.productService.findAll(page, limit);
  }
}

// Response:
// {
//   "data": [...],
//   "meta": {
//     "total": 100,
//     "page": 1,
//     "limit": 10,
//     "totalPages": 10,
//     "hasNext": true,
//     "hasPrev": false
//   }
// }
```

### Cursor-Based Pagination

```typescript
@Injectable()
export class PostService {
  async findWithCursor(cursor?: string, limit: number = 10) {
    const query: any = { take: limit + 1 };

    if (cursor) {
      query.where = { id: { $gt: parseInt(cursor) } };
    }

    const posts = await this.repository.find(query);
    const hasMore = posts.length > limit;

    if (hasMore) {
      posts.pop();
    }

    const nextCursor = hasMore ? posts[posts.length - 1].id.toString() : null;

    return {
      data: posts,
      nextCursor,
      hasMore,
    };
  }
}

// Usage: GET /posts?cursor=123&limit=10
```

---

## 🛡️ Rate Limiting

### Advanced Rate Limiting

```typescript
import { AdvancedRateLimitInterceptor } from "@fynixjs/fynix";

@Controller("/api")
@UseInterceptors(
  new AdvancedRateLimitInterceptor({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests, please try again later",
  })
)
export class ApiController {
  @Post("/expensive-operation")
  @UseInterceptors(
    new AdvancedRateLimitInterceptor({
      windowMs: 60 * 1000, // 1 minute
      max: 5, // Only 5 requests per minute
      skipSuccessfulRequests: false,
    })
  )
  async expensiveOperation() {
    return await this.service.performExpensiveOperation();
  }
}
```

### Custom Rate Limit Strategy

```typescript
@Injectable()
export class CustomRateLimitInterceptor implements FynixInterceptor {
  private requests: Map<string, number[]> = new Map();

  async intercept(context: ExecutionContext, next: () => Promise<any>) {
    const request = context.request;
    const identifier = this.getIdentifier(request);
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    // Get request timestamps for this identifier
    const timestamps = this.requests.get(identifier) || [];

    // Remove old timestamps
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= maxRequests) {
      throw new HttpException("Too many requests", 429);
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);

    return await next();
  }

  private getIdentifier(request: any): string {
    // Use user ID if authenticated, otherwise IP
    return request.user?.id || request.ip;
  }
}
```

---

## 🌐 CORS Configuration

### Basic CORS

```typescript
import { CorsInterceptor } from "@fynixjs/fynix";

// Enable CORS for all routes
app.useGlobalInterceptors(
  new CorsInterceptor({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

### Advanced CORS

```typescript
app.useGlobalInterceptors(
  new CorsInterceptor({
    origin: (origin, callback) => {
      const allowedOrigins = ["https://example.com", "https://app.example.com"];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-Total-Count", "X-Page-Count"],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);
```

---

## 🔌 GraphQL Support

### GraphQL Schema

```typescript
import { GraphQLService } from "@fynixjs/fynix";

const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
    createPost(title: String!, content: String!, authorId: ID!): Post!
  }
`;

const resolvers = {
  Query: {
    users: async () => await userService.findAll(),
    user: async (_, { id }) => await userService.findById(id),
    posts: async () => await postService.findAll(),
    post: async (_, { id }) => await postService.findById(id),
  },
  Mutation: {
    createUser: async (_, { name, email }) =>
      await userService.create({ name, email }),
    createPost: async (_, { title, content, authorId }) =>
      await postService.create({ title, content, authorId }),
  },
  User: {
    posts: async (user) => await postService.findByAuthor(user.id),
  },
  Post: {
    author: async (post) => await userService.findById(post.authorId),
  },
};

const graphqlService = new GraphQLService({ typeDefs, resolvers });
app.use("/graphql", graphqlService.getHandler());
```

---

## 🌐 WebSocket Support

### WebSocket Gateway

```typescript
import { WebSocketService } from "@fynixjs/fynix";

@Injectable()
export class ChatGateway {
  private wsService: WebSocketService;

  constructor() {
    this.wsService = new WebSocketService({ port: 3001 });
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.wsService.on("connection", (socket) => {
      console.log("Client connected");

      socket.on("message", (data) => {
        // Broadcast to all clients
        this.wsService.broadcast("message", {
          user: socket.user,
          text: data.text,
          timestamp: new Date(),
        });
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  }

  sendToUser(userId: string, event: string, data: any): void {
    this.wsService.sendToUser(userId, event, data);
  }

  broadcast(event: string, data: any): void {
    this.wsService.broadcast(event, data);
  }
}
```

---

## ⏰ Background Jobs

### Job Service

```typescript
import { JobsService } from "@fynixjs/fynix";

@Injectable()
export class TaskScheduler {
  constructor(private jobsService: JobsService) {
    this.setupJobs();
  }

  private setupJobs(): void {
    // Run every minute
    this.jobsService.schedule("*/1 * * * *", async () => {
      await this.processQueue();
    });

    // Run daily at midnight
    this.jobsService.schedule("0 0 * * *", async () => {
      await this.cleanupOldRecords();
    });

    // Run every hour
    this.jobsService.schedule("0 * * * *", async () => {
      await this.sendNotifications();
    });
  }

  private async processQueue(): Promise<void> {
    const pending = await this.queueService.getPending();
    for (const job of pending) {
      await this.queueService.process(job);
    }
  }

  private async cleanupOldRecords(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await this.repository.deleteOlderThan(thirtyDaysAgo);
  }

  private async sendNotifications(): Promise<void> {
    const users = await this.userService.getActiveUsers();
    for (const user of users) {
      await this.notificationService.send(user);
    }
  }
}
```

---

## 🔄 API Versioning

### URI Versioning

```typescript
@Controller("/v1/users")
export class UserV1Controller {
  @Get()
  async findAll() {
    return await this.userService.findAll();
  }
}

@Controller("/v2/users")
export class UserV2Controller {
  @Get()
  async findAll() {
    // Enhanced version with pagination
    return await this.userService.findAllPaginated();
  }
}
```

### Header Versioning

```typescript
import { VersioningService } from "@fynixjs/fynix";

@Controller("/users")
export class UserController {
  @Get()
  async findAll(@Headers("api-version") version: string) {
    if (version === "2") {
      return await this.userService.findAllV2();
    }
    return await this.userService.findAll();
  }
}
```

---

## ✅ Best Practices

### 1. Cache Strategically

```typescript
// ✅ Good - cache expensive operations
async getRecommendations(userId: number) {
  const cacheKey = `recommendations:${userId}`;
  const cached = await this.cacheService.get(cacheKey);
  if (cached) return cached;

  const recommendations = await this.ml.generateRecommendations(userId);
  await this.cacheService.set(cacheKey, recommendations, 3600);
  return recommendations;
}

// ❌ Bad - caching everything
async getUser(id: number) {
  const cached = await this.cacheService.get(`user:${id}`);
  if (cached) return cached;
  // This might be overkill for simple queries
}
```

### 2. Implement Pagination

```typescript
// ✅ Good - always paginate large datasets
@Get('/products')
async findAll(@Query() query: PaginationDto) {
  return await this.productService.findAll(query.page, query.limit);
}

// ❌ Bad - returning all records
@Get('/products')
async findAll() {
  return await this.productService.findAll(); // Could return thousands!
}
```

---

## 📚 Next Steps

- **[11-TESTING.md](./11-TESTING.md)** - Test advanced features
- **[12-DEPLOYMENT.md](./12-DEPLOYMENT.md)** - Deploy with optimization
- **[13-BEST_PRACTICES.md](./13-BEST_PRACTICES.md)** - Performance patterns

---

## 💡 Key Takeaways

✅ Implement caching for expensive operations  
✅ Monitor performance metrics  
✅ Enable compression for large payloads  
✅ Paginate large datasets  
✅ Apply rate limiting to prevent abuse  
✅ Use background jobs for heavy tasks  
✅ Version your API for backward compatibility  
✅ Secure file uploads with validation

---

**Master Advanced Features** to build high-performance, scalable APIs!
