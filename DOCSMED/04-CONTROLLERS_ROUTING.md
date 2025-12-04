# 04 - Controllers & Routing

## 📋 Table of Contents

- [What are Controllers?](#what-are-controllers)
- [Creating Controllers](#creating-controllers)
- [HTTP Method Decorators](#http-method-decorators)
- [Route Parameters](#route-parameters)
- [Query Parameters](#query-parameters)
- [Request Body](#request-body)
- [Headers](#headers)
- [Route Prefixes](#route-prefixes)
- [Response Handling](#response-handling)
- [Advanced Routing](#advanced-routing)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)

---

## 🎯 What are Controllers?

**Controllers** are responsible for handling incoming HTTP requests and returning responses to the client. They define your API endpoints and route HTTP traffic to the appropriate handlers.

### Controller Responsibilities

- ✅ Define routes (URLs and HTTP methods)
- ✅ Extract request data (params, query, body)
- ✅ Validate input
- ✅ Call business logic (services)
- ✅ Return responses
- ❌ **NOT**: Database operations, business logic, complex computations

---

## 🏗️ Creating Controllers

### Basic Controller

```typescript
import { Controller, Get } from "@fynixjs/fynix";

@Controller("/api")
export class AppController {
  @Get("/hello")
  sayHello() {
    return { message: "Hello World!" };
  }
}
```

### Controller with Service

```typescript
@Injectable()
export class UserService {
  findAll() {
    return [
      { id: 1, name: "John" },
      { id: 2, name: "Jane" },
    ];
  }
}

@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUsers() {
    return this.userService.findAll();
  }
}

// Register in module
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

---

## 🚀 HTTP Method Decorators

FynixJS supports all standard HTTP methods:

### GET Requests

```typescript
@Controller("/products")
export class ProductController {
  @Get()
  findAll() {
    return { products: [] };
  }

  @Get("/:id")
  findOne(@Param("id") id: string) {
    return { id, name: "Product 1" };
  }

  @Get("/featured")
  getFeatured() {
    return { featured: [] };
  }
}

// Routes:
// GET /products
// GET /products/:id
// GET /products/featured
```

### POST Requests

```typescript
@Controller("/users")
export class UserController {
  @Post()
  create(@Body() body: any) {
    return { message: "User created", data: body };
  }

  @Post("/register")
  register(@Body() body: any) {
    return { message: "Registration successful" };
  }
}

// Routes:
// POST /users
// POST /users/register
```

### PUT/PATCH Requests

```typescript
@Controller("/products")
export class ProductController {
  @Put("/:id")
  update(@Param("id") id: string, @Body() body: any) {
    return { message: `Product ${id} updated`, data: body };
  }

  @Patch("/:id")
  partialUpdate(@Param("id") id: string, @Body() body: any) {
    return { message: `Product ${id} partially updated`, data: body };
  }
}

// Routes:
// PUT /products/:id      - Full update
// PATCH /products/:id    - Partial update
```

### DELETE Requests

```typescript
@Controller("/users")
export class UserController {
  @Delete("/:id")
  remove(@Param("id") id: string) {
    return { message: `User ${id} deleted` };
  }
}

// Route:
// DELETE /users/:id
```

### All HTTP Methods

```typescript
@Controller("/api")
export class ApiController {
  @Get("/resource")
  get() {}

  @Post("/resource")
  post() {}

  @Put("/resource/:id")
  put() {}

  @Patch("/resource/:id")
  patch() {}

  @Delete("/resource/:id")
  delete() {}

  @Options("/resource")
  options() {}

  @Head("/resource")
  head() {}
}
```

---

## 📌 Route Parameters

### Path Parameters

```typescript
@Controller("/users")
export class UserController {
  @Get("/:id")
  findOne(@Param("id") id: string) {
    return { id };
  }

  @Get("/:userId/posts/:postId")
  getUserPost(
    @Param("userId") userId: string,
    @Param("postId") postId: string
  ) {
    return { userId, postId };
  }
}

// GET /users/123 → { id: "123" }
// GET /users/5/posts/10 → { userId: "5", postId: "10" }
```

### Multiple Parameters

```typescript
@Controller("/shops")
export class ShopController {
  @Get("/:shopId/products/:productId/reviews/:reviewId")
  getReview(
    @Param("shopId") shopId: string,
    @Param("productId") productId: string,
    @Param("reviewId") reviewId: string
  ) {
    return { shopId, productId, reviewId };
  }
}

// GET /shops/1/products/2/reviews/3
// → { shopId: "1", productId: "2", reviewId: "3" }
```

### Type Conversion

```typescript
@Controller("/products")
export class ProductController {
  @Get("/:id")
  async findOne(@Param("id") id: string) {
    // Convert to number
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException("Invalid ID");
    }
    return await this.productService.findById(numericId);
  }
}
```

---

## 🔍 Query Parameters

### Single Query Parameter

```typescript
@Controller("/products")
export class ProductController {
  @Get()
  findAll(@Query("category") category: string) {
    return { category, products: [] };
  }
}

// GET /products?category=electronics
// → { category: "electronics", products: [] }
```

### Multiple Query Parameters

```typescript
@Controller("/products")
export class ProductController {
  @Get()
  findAll(
    @Query("category") category: string,
    @Query("minPrice") minPrice: string,
    @Query("maxPrice") maxPrice: string,
    @Query("page") page: string
  ) {
    return {
      category,
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
      page: Number(page) || 1,
      products: [],
    };
  }
}

// GET /products?category=books&minPrice=10&maxPrice=50&page=2
```

### Query Object (All Params)

```typescript
@Controller("/search")
export class SearchController {
  @Get()
  search(@Query() query: any) {
    // query = { term: "laptop", category: "electronics", sort: "price" }
    return {
      term: query.term,
      category: query.category,
      sort: query.sort,
      results: [],
    };
  }
}

// GET /search?term=laptop&category=electronics&sort=price
```

### Pagination Example

```typescript
@Controller("/users")
export class UserController {
  @Get()
  async findAll(
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "10"
  ) {
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const skip = (pageNum - 1) * limitNum;

    return {
      page: pageNum,
      limit: limitNum,
      data: await this.userService.findAll(skip, limitNum),
    };
  }
}

// GET /users?page=2&limit=20
```

---

## 📦 Request Body

### Simple Body

```typescript
@Controller("/users")
export class UserController {
  @Post()
  create(@Body() body: any) {
    return {
      message: "User created",
      data: body,
    };
  }
}

// POST /users
// Body: { "name": "John", "email": "john@example.com" }
```

### Specific Body Properties

```typescript
@Controller("/users")
export class UserController {
  @Post()
  create(
    @Body("name") name: string,
    @Body("email") email: string,
    @Body("age") age: number
  ) {
    return {
      name,
      email,
      age,
    };
  }
}
```

### With Validation

```typescript
// DTO (Data Transfer Object)
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(18)
  age: number;
}

@Controller("/users")
export class UserController {
  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() dto: CreateUserDto) {
    return {
      message: "User created",
      data: dto,
    };
  }
}
```

### Nested Objects

```typescript
@Controller("/orders")
export class OrderController {
  @Post()
  create(@Body() body: any) {
    // body = {
    //   userId: 1,
    //   items: [
    //     { productId: 1, quantity: 2 },
    //     { productId: 2, quantity: 1 }
    //   ],
    //   shipping: {
    //     address: "123 Main St",
    //     city: "New York"
    //   }
    // }
    return {
      userId: body.userId,
      items: body.items,
      shipping: body.shipping,
    };
  }
}
```

---

## 📨 Headers

### Reading Headers

```typescript
@Controller("/api")
export class ApiController {
  @Get()
  getData(
    @Headers("authorization") auth: string,
    @Headers("content-type") contentType: string
  ) {
    return { auth, contentType };
  }
}
```

### All Headers

```typescript
@Controller("/api")
export class ApiController {
  @Get()
  getData(@Headers() headers: any) {
    return {
      authorization: headers.authorization,
      userAgent: headers["user-agent"],
      allHeaders: headers,
    };
  }
}
```

### Custom Headers in Response

```typescript
@Controller("/api")
export class ApiController {
  @Get()
  getData(@Res() res: any) {
    res.setHeader("X-Custom-Header", "my-value");
    res.setHeader("X-Rate-Limit", "100");
    return res.json({ message: "Success" });
  }
}
```

---

## 🎯 Route Prefixes

### Controller-Level Prefix

```typescript
@Controller("/api/v1/users")
export class UserController {
  @Get()
  findAll() {} // GET /api/v1/users

  @Get("/:id")
  findOne() {} // GET /api/v1/users/:id

  @Post()
  create() {} // POST /api/v1/users
}
```

### Versioning

```typescript
// Version 1
@Controller("/api/v1/products")
export class ProductV1Controller {
  @Get()
  findAll() {
    return { version: 1, products: [] };
  }
}

// Version 2
@Controller("/api/v2/products")
export class ProductV2Controller {
  @Get()
  findAll() {
    return { version: 2, products: [], newField: "value" };
  }
}
```

---

## 📤 Response Handling

### JSON Response (Default)

```typescript
@Controller("/api")
export class ApiController {
  @Get("/data")
  getData() {
    return { message: "Success", data: [] };
  }
}

// Response: { "message": "Success", "data": [] }
```

### Status Codes

```typescript
@Controller("/users")
export class UserController {
  @Post()
  create(@Body() body: any) {
    return {
      statusCode: 201,
      message: "User created",
      data: body,
    };
  }

  @Delete("/:id")
  remove(@Param("id") id: string) {
    return {
      statusCode: 204,
      message: "User deleted",
    };
  }
}
```

### Error Responses

```typescript
@Controller("/users")
export class UserController {
  @Get("/:id")
  async findOne(@Param("id") id: string) {
    const user = await this.userService.findById(Number(id));

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  @Post()
  async create(@Body() body: any) {
    if (!body.email) {
      throw new BadRequestException("Email is required");
    }

    return await this.userService.create(body);
  }
}
```

### Async/Await

```typescript
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return { count: users.length, users };
  }

  @Get("/:id")
  async findOne(@Param("id") id: string) {
    const user = await this.userService.findById(Number(id));
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }
}
```

---

## 🔧 Advanced Routing

### Route Wildcards

```typescript
@Controller("/files")
export class FileController {
  @Get("/*")
  getFile(@Req() req: any) {
    // GET /files/images/photo.jpg
    // GET /files/docs/report.pdf
    const path = req.url.replace("/files/", "");
    return { path };
  }
}
```

### Optional Parameters

```typescript
@Controller("/api")
export class ApiController {
  @Get("/users/:userId?/posts/:postId?")
  getPosts(@Param("userId") userId?: string, @Param("postId") postId?: string) {
    if (userId && postId) {
      return { userId, postId };
    } else if (userId) {
      return { userId, posts: [] };
    } else {
      return { allPosts: [] };
    }
  }
}

// GET /api/users/1/posts/2   → { userId: "1", postId: "2" }
// GET /api/users/1/posts     → { userId: "1", posts: [] }
// GET /api/users/posts       → { allPosts: [] }
```

### Request & Response Objects

```typescript
@Controller("/api")
export class ApiController {
  @Get("/data")
  getData(@Req() req: any, @Res() res: any) {
    console.log("URL:", req.url);
    console.log("Method:", req.method);
    console.log("Headers:", req.headers);

    res.status(200).json({
      message: "Success",
      url: req.url,
    });
  }
}
```

---

## ✅ Best Practices

### 1. RESTful Routes

```typescript
// ✅ Good - RESTful naming
@Controller("/products")
export class ProductController {
  @Get() // GET /products
  findAll() {}

  @Get("/:id") // GET /products/:id
  findOne() {}

  @Post() // POST /products
  create() {}

  @Put("/:id") // PUT /products/:id
  update() {}

  @Delete("/:id") // DELETE /products/:id
  remove() {}
}

// ❌ Bad - non-RESTful
@Controller("/products")
export class ProductController {
  @Get("/getAllProducts")
  getAll() {}

  @Post("/createProduct")
  create() {}

  @Post("/deleteProduct/:id")
  delete() {}
}
```

### 2. Thin Controllers

```typescript
// ✅ Good - controller delegates to service
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }
}

// ❌ Bad - business logic in controller
@Controller("/users")
export class UserController {
  @Post()
  async create(@Body() body: any) {
    // ❌ Don't do this in controller
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await db.query("INSERT INTO users...");
    await sendWelcomeEmail(user.email);
    return user;
  }
}
```

### 3. Use DTOs

```typescript
// ✅ Good - typed DTOs
export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  description?: string;
}

@Controller("/products")
export class ProductController {
  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }
}

// ❌ Bad - any type
@Controller("/products")
export class ProductController {
  @Post()
  create(@Body() body: any) {
    return this.productService.create(body);
  }
}
```

### 4. Proper Error Handling

```typescript
// ✅ Good - specific exceptions
@Controller("/users")
export class UserController {
  @Get("/:id")
  async findOne(@Param("id") id: string) {
    const user = await this.userService.findById(Number(id));
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const exists = await this.userService.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException("Email already exists");
    }
    return await this.userService.create(dto);
  }
}
```

### 5. Consistent Response Format

```typescript
// ✅ Good - consistent format
@Controller("/api")
export class ApiController {
  @Get("/users")
  async getUsers() {
    const users = await this.userService.findAll();
    return {
      success: true,
      data: users,
      count: users.length,
    };
  }

  @Get("/products")
  async getProducts() {
    const products = await this.productService.findAll();
    return {
      success: true,
      data: products,
      count: products.length,
    };
  }
}
```

---

## 🎯 Real-World Examples

### Example 1: Blog API

```typescript
// blog.controller.ts
@Controller("/api/blog")
export class BlogController {
  constructor(private blogService: BlogService) {}

  // Get all posts with pagination
  @Get("/posts")
  async getPosts(
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "10",
    @Query("category") category?: string
  ) {
    return await this.blogService.findPosts({
      page: Number(page),
      limit: Number(limit),
      category,
    });
  }

  // Get single post
  @Get("/posts/:slug")
  async getPost(@Param("slug") slug: string) {
    const post = await this.blogService.findBySlug(slug);
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    return post;
  }

  // Create post (requires auth)
  @Post("/posts")
  @UseGuards(JwtAuthGuard)
  async createPost(
    @Body() dto: CreatePostDto,
    @Headers("authorization") auth: string
  ) {
    return await this.blogService.create(dto, auth);
  }

  // Update post
  @Put("/posts/:id")
  @UseGuards(JwtAuthGuard)
  async updatePost(@Param("id") id: string, @Body() dto: UpdatePostDto) {
    return await this.blogService.update(Number(id), dto);
  }

  // Delete post
  @Delete("/posts/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deletePost(@Param("id") id: string) {
    await this.blogService.delete(Number(id));
    return { message: "Post deleted" };
  }

  // Get comments for post
  @Get("/posts/:postId/comments")
  async getComments(@Param("postId") postId: string) {
    return await this.blogService.findComments(Number(postId));
  }

  // Add comment
  @Post("/posts/:postId/comments")
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param("postId") postId: string,
    @Body() dto: CreateCommentDto
  ) {
    return await this.blogService.addComment(Number(postId), dto);
  }
}
```

### Example 2: E-Commerce API

```typescript
// product.controller.ts
@Controller("/api/products")
export class ProductController {
  constructor(
    private productService: ProductService,
    private reviewService: ReviewService
  ) {}

  // Search products
  @Get("/search")
  async search(
    @Query("q") query: string,
    @Query("category") category?: string,
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
    @Query("sort") sort?: string
  ) {
    return await this.productService.search({
      query,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
    });
  }

  // Get product details
  @Get("/:id")
  async getProduct(@Param("id") id: string) {
    const product = await this.productService.findById(Number(id));
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  // Get product reviews
  @Get("/:id/reviews")
  async getReviews(@Param("id") id: string, @Query("page") page: string = "1") {
    return await this.reviewService.findByProduct(Number(id), Number(page));
  }

  // Add review
  @Post("/:id/reviews")
  @UseGuards(JwtAuthGuard)
  async addReview(
    @Param("id") id: string,
    @Body() dto: CreateReviewDto,
    @Req() req: any
  ) {
    return await this.reviewService.create({
      productId: Number(id),
      userId: req.user.id,
      ...dto,
    });
  }

  // Check availability
  @Get("/:id/availability")
  async checkAvailability(@Param("id") id: string) {
    return await this.productService.checkStock(Number(id));
  }
}
```

---

## 📚 Next Steps

- **[05-DATABASE_ORM.md](./05-DATABASE_ORM.md)** - Database operations
- **[06-SECURITY_AUTH.md](./06-SECURITY_AUTH.md)** - Secure your routes
- **[08-VALIDATION_PIPES.md](./08-VALIDATION_PIPES.md)** - Validate input

---

## 💡 Key Takeaways

✅ Controllers handle HTTP requests and return responses  
✅ Use decorators for routes: @Get, @Post, @Put, @Delete  
✅ Extract data with @Param, @Query, @Body, @Headers  
✅ Keep controllers thin, delegate to services  
✅ Follow RESTful conventions for URLs  
✅ Use DTOs for type safety and validation  
✅ Handle errors with specific exceptions  
✅ Return consistent response formats

---

**Master Controllers** to build clean, maintainable APIs!
