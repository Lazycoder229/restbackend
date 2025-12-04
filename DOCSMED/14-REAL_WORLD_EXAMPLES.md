# 14 - Real-World Examples

> **Learning Path:** Start with Simple Examples → Intermediate → Advanced

## 📋 Table of Contents

- [Level 1: Simple Examples](#level-1-simple-examples)
  - [Hello World API](#hello-world-api)
  - [Simple Todo API](#simple-todo-api)
  - [Contact Form API](#contact-form-api)
- [Level 2: Intermediate Examples](#level-2-intermediate-examples)
  - [Blog API with Authentication](#blog-api-with-authentication)
  - [E-Commerce Product Catalog](#e-commerce-product-catalog)
  - [Task Management API](#task-management-api)
- [Level 3: Advanced Examples](#level-3-advanced-examples)
  - [Complete Blog Platform](#complete-blog-platform)
  - [Multi-Tenant SaaS](#multi-tenant-saas)
  - [Real-Time Chat Application](#real-time-chat-application)

---

## 🟢 Level 1: Simple Examples

Perfect for beginners who just completed the Getting Started guide.

### Hello World API

**Goal:** Learn basic routing and responses

**Time:** 10 minutes

```typescript
// main.ts
import { FynixFactory, Module, Controller, Get } from "@fynixjs/fynix";

@Controller("/api")
export class AppController {
  @Get("/")
  getRoot() {
    return {
      message: "Welcome to FynixJS!",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("/health")
  getHealth() {
    return {
      status: "healthy",
      uptime: process.uptime(),
    };
  }
}

@Module({
  controllers: [AppController],
})
export class AppModule {}

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);
  await app.init();
  await app.listen(3000);
  console.log("🚀 Server running on http://localhost:3000");
}

bootstrap();
```

**Test it:**

```bash
curl http://localhost:3000/api/
curl http://localhost:3000/api/health
```

---

### Simple Todo API

**Goal:** Learn CRUD operations without database

**Time:** 20 minutes

```typescript
// todo.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from "@fynixjs/fynix";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

@Controller("/todos")
export class TodoController {
  private todos: Todo[] = [
    { id: 1, title: "Learn FynixJS", completed: false },
    { id: 2, title: "Build an API", completed: false },
  ];
  private nextId = 3;

  @Get()
  findAll() {
    return { todos: this.todos };
  }

  @Get("/:id")
  findOne(@Param("id") id: string) {
    const todo = this.todos.find((t) => t.id === parseInt(id));
    if (!todo) {
      return { error: "Todo not found" };
    }
    return { todo };
  }

  @Post()
  create(@Body() body: { title: string }) {
    const todo: Todo = {
      id: this.nextId++,
      title: body.title,
      completed: false,
    };
    this.todos.push(todo);
    return { message: "Todo created", todo };
  }

  @Put("/:id")
  update(@Param("id") id: string, @Body() body: { completed: boolean }) {
    const todo = this.todos.find((t) => t.id === parseInt(id));
    if (!todo) {
      return { error: "Todo not found" };
    }
    todo.completed = body.completed;
    return { message: "Todo updated", todo };
  }

  @Delete("/:id")
  remove(@Param("id") id: string) {
    const index = this.todos.findIndex((t) => t.id === parseInt(id));
    if (index === -1) {
      return { error: "Todo not found" };
    }
    const deleted = this.todos.splice(index, 1)[0];
    return { message: "Todo deleted", todo: deleted };
  }
}

// main.ts
@Module({
  controllers: [TodoController],
})
export class AppModule {}
```

**Test it:**

```bash
# Get all todos
curl http://localhost:3000/todos

# Create a todo
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"New Todo"}'

# Update a todo
curl -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete a todo
curl -X DELETE http://localhost:3000/todos/1
```

---

### Contact Form API

**Goal:** Learn validation and email sending (simulated)

**Time:** 15 minutes

```typescript
// contact.dto.ts
import { IsString, IsEmail, IsNotEmpty, MinLength } from "@fynixjs/fynix";

export class ContactDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  message: string;
}

// contact.service.ts
import { Injectable } from "@fynixjs/fynix";
import { ContactDto } from "./contact.dto";

@Injectable()
export class ContactService {
  async sendMessage(dto: ContactDto) {
    // Simulate email sending
    console.log("Sending email:", dto);

    // In real app, use nodemailer or similar
    return {
      success: true,
      message: "Your message has been sent!",
    };
  }
}

// contact.controller.ts
import { Controller, Post, Body, UsePipes } from "@fynixjs/fynix";
import { ValidationPipe } from "@fynixjs/fynix";
import { ContactService } from "./contact.service";
import { ContactDto } from "./contact.dto";

@Controller("/contact")
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UsePipes(ValidationPipe)
  async sendMessage(@Body() dto: ContactDto) {
    return await this.contactService.sendMessage(dto);
  }
}

// contact.module.ts
@Module({
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
```

**Test it:**

```bash
# Valid request
curl -X POST http://localhost:3000/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello, this is a test message!"
  }'

# Invalid request (will fail validation)
curl -X POST http://localhost:3000/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "J",
    "email": "invalid-email",
    "message": "Short"
  }'
```

---

## 🟡 Level 2: Intermediate Examples

For developers who understand basics and want to add database, authentication, etc.

### Blog API with Authentication

**Goal:** Full CRUD with database and JWT auth

**Time:** 45 minutes

**Complete project structure:**

```
blog-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── jwt-auth.guard.ts
│   └── posts/
│       ├── posts.module.ts
│       ├── posts.controller.ts
│       ├── posts.service.ts
│       └── entities/
│           └── post.entity.ts
```

**Implementation:** (See Advanced section for complete code)

---

## 🔴 Level 3: Advanced Examples

### Complete Blog Platform

A full-featured blog with posts, comments, categories, and user management.

### Project Structure

```
blog-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── jwt-auth.guard.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── entities/user.entity.ts
│   ├── posts/
│   │   ├── posts.module.ts
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   ├── posts.repository.ts
│   │   └── entities/post.entity.ts
│   ├── comments/
│   │   ├── comments.module.ts
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   └── entities/comment.entity.ts
│   └── categories/
│       ├── categories.module.ts
│       ├── categories.controller.ts
│       └── entities/category.entity.ts
```

### Entities

```typescript
// user.entity.ts
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Unique()
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ default: "user" })
  role: string;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

// post.entity.ts
@Entity("posts")
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  @Unique()
  slug: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "text", nullable: true })
  excerpt: string;

  @Column()
  @ForeignKey({ table: "users", column: "id" })
  authorId: number;

  @Column({ nullable: true })
  @ForeignKey({ table: "categories", column: "id" })
  categoryId: number;

  @Column({ default: "draft" })
  status: "draft" | "published";

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;

  async author() {
    return await User.findById(this.authorId);
  }

  async comments() {
    return await Comment.find({ where: { postId: this.id } });
  }
}

// comment.entity.ts
@Entity("comments")
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text" })
  content: string;

  @Column()
  @ForeignKey({ table: "posts", column: "id" })
  postId: number;

  @Column()
  @ForeignKey({ table: "users", column: "id" })
  userId: number;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  async post() {
    return await Post.findById(this.postId);
  }

  async user() {
    return await User.findById(this.userId);
  }
}

// category.entity.ts
@Entity("categories")
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Unique()
  name: string;

  @Column()
  @Unique()
  slug: string;

  async posts() {
    return await Post.find({ where: { categoryId: this.id } });
  }
}
```

### Services

```typescript
// posts.service.ts
@Injectable()
export class PostsService {
  constructor(
    private postRepo: PostRepository,
    private categoryRepo: CategoryRepository
  ) {}

  async findAll(query: { page?: number; limit?: number; category?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    let queryBuilder = this.postRepo
      .query()
      .where("status", "published")
      .orderBy("createdAt", "DESC");

    if (query.category) {
      const category = await this.categoryRepo.findOne({
        where: { slug: query.category },
      });
      if (category) {
        queryBuilder = queryBuilder.where("categoryId", category.id);
      }
    }

    const posts = await queryBuilder.limit(limit).offset(offset).get();

    const total = await this.postRepo
      .query()
      .where("status", "published")
      .count();

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const post = await this.postRepo.findOne({ where: { slug } });
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const author = await post.author();
    const comments = await post.comments();

    return { ...post, author, comments };
  }

  async create(dto: CreatePostDto, userId: number) {
    const slug = this.generateSlug(dto.title);

    const post = await this.postRepo.create({
      title: dto.title,
      slug,
      content: dto.content,
      excerpt: dto.excerpt,
      authorId: userId,
      categoryId: dto.categoryId,
      status: dto.status || "draft",
    });

    return post;
  }

  async update(id: number, dto: UpdatePostDto, userId: number) {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException("Not authorized");
    }

    await this.postRepo.update(id, {
      ...dto,
      updatedAt: new Date(),
    });

    return await this.postRepo.findById(id);
  }

  async delete(id: number, userId: number) {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException("Not authorized");
    }

    await this.postRepo.delete(id);
    return { message: "Post deleted successfully" };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}
```

### Controllers

```typescript
// posts.controller.ts
@Controller("/api/posts")
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("category") category?: string
  ) {
    return await this.postsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      category,
    });
  }

  @Get("/:slug")
  async findOne(@Param("slug") slug: string) {
    return await this.postsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async create(@Body() dto: CreatePostDto, @Req() req: any) {
    return await this.postsService.create(dto, req.user.id);
  }

  @Put("/:id")
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async update(
    @Param("id") id: string,
    @Body() dto: UpdatePostDto,
    @Req() req: any
  ) {
    return await this.postsService.update(Number(id), dto, req.user.id);
  }

  @Delete("/:id")
  @UseGuards(JwtAuthGuard)
  async delete(@Param("id") id: string, @Req() req: any) {
    return await this.postsService.delete(Number(id), req.user.id);
  }
}

// comments.controller.ts
@Controller("/api/posts/:postId/comments")
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  async findAll(@Param("postId") postId: string) {
    return await this.commentsService.findByPost(Number(postId));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async create(
    @Param("postId") postId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any
  ) {
    return await this.commentsService.create(Number(postId), dto, req.user.id);
  }

  @Delete("/:id")
  @UseGuards(JwtAuthGuard)
  async delete(@Param("id") id: string, @Req() req: any) {
    return await this.commentsService.delete(Number(id), req.user.id);
  }
}
```

### Module Configuration

```typescript
// app.module.ts
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    CategoriesModule,
  ],
})
export class AppModule {}

// posts.module.ts
@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [PostsController],
  providers: [PostsService, PostRepository, CategoryRepository],
  exports: [PostsService],
})
export class PostsModule {}
```

---

## 🛒 E-Commerce REST API

Complete e-commerce system with products, orders, cart, and payments.

### Entities

```typescript
// product.entity.ts
@Entity("products")
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  @Unique()
  sku: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "int", default: 0 })
  stock: number;

  @Column()
  category: string;

  @Column({ type: "json", nullable: true })
  images: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

// order.entity.ts
@Entity("orders")
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @ForeignKey({ table: "users", column: "id" })
  userId: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total: number;

  @Column({ default: "pending" })
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";

  @Column({ type: "json" })
  items: Array<{
    productId: number;
    name: string;
    price: number;
    quantity: number;
  }>;

  @Column({ type: "json" })
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };

  @Column({ nullable: true })
  paymentIntentId: string;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

// cart.entity.ts
@Entity("cart_items")
export class CartItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @ForeignKey({ table: "users", column: "id" })
  userId: number;

  @Column()
  @ForeignKey({ table: "products", column: "id" })
  productId: number;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  addedAt: Date;
}
```

### Order Service

```typescript
@Injectable()
export class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private productRepo: ProductRepository,
    private cartRepo: CartRepository,
    private paymentService: PaymentService,
    private emailService: EmailService,
    private db: DatabaseService
  ) {}

  async createOrder(userId: number, dto: CreateOrderDto) {
    const conn = await this.db.getConnection();

    try {
      await conn.beginTransaction();

      // Get cart items
      const cartItems = await this.cartRepo.findByUser(userId);
      if (cartItems.length === 0) {
        throw new BadRequestException("Cart is empty");
      }

      // Validate stock and calculate total
      let total = 0;
      const orderItems = [];

      for (const item of cartItems) {
        const product = await this.productRepo.findById(item.productId);

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}`
          );
        }

        total += product.price * item.quantity;
        orderItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
        });

        // Update stock
        await this.productRepo.update(product.id, {
          stock: product.stock - item.quantity,
        });
      }

      // Create order
      const order = await this.orderRepo.create({
        userId,
        total,
        items: orderItems,
        shippingAddress: dto.shippingAddress,
        status: "pending",
      });

      // Process payment
      const paymentIntent = await this.paymentService.createPayment({
        amount: total,
        orderId: order.id,
        customerId: userId,
      });

      await this.orderRepo.update(order.id, {
        paymentIntentId: paymentIntent.id,
        status: "paid",
      });

      // Clear cart
      await this.cartRepo.clearByUser(userId);

      await conn.commit();

      // Send confirmation email
      await this.emailService.sendOrderConfirmation(userId, order);

      return order;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getOrders(userId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const orders = await this.orderRepo
      .query()
      .where("userId", userId)
      .orderBy("createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .get();

    const total = await this.orderRepo.query().where("userId", userId).count();

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrder(userId: number, orderId: number) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.userId !== userId) {
      throw new ForbiddenException("Not authorized");
    }

    return order;
  }

  async cancelOrder(userId: number, orderId: number) {
    const order = await this.getOrder(userId, orderId);

    if (order.status !== "pending" && order.status !== "paid") {
      throw new BadRequestException("Cannot cancel this order");
    }

    // Restore stock
    for (const item of order.items) {
      const product = await this.productRepo.findById(item.productId);
      if (product) {
        await this.productRepo.update(product.id, {
          stock: product.stock + item.quantity,
        });
      }
    }

    // Refund payment if paid
    if (order.status === "paid" && order.paymentIntentId) {
      await this.paymentService.refund(order.paymentIntentId);
    }

    await this.orderRepo.update(orderId, { status: "cancelled" });

    return { message: "Order cancelled successfully" };
  }
}
```

### Product Controller

```typescript
@Controller("/api/products")
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get()
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("category") category?: string,
    @Query("search") search?: string
  ) {
    return await this.productService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      category,
      search,
    });
  }

  @Get("/:id")
  async findOne(@Param("id") id: string) {
    return await this.productService.findById(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, new RolesGuard(["admin"]))
  @UsePipes(ValidationPipe)
  async create(@Body() dto: CreateProductDto) {
    return await this.productService.create(dto);
  }

  @Put("/:id")
  @UseGuards(JwtAuthGuard, new RolesGuard(["admin"]))
  @UsePipes(ValidationPipe)
  async update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return await this.productService.update(Number(id), dto);
  }

  @Delete("/:id")
  @UseGuards(JwtAuthGuard, new RolesGuard(["admin"]))
  async delete(@Param("id") id: string) {
    return await this.productService.delete(Number(id));
  }
}
```

### Cart Controller

```typescript
@Controller("/api/cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@Req() req: any) {
    return await this.cartService.getCart(req.user.id);
  }

  @Post("/items")
  async addItem(@Req() req: any, @Body() dto: AddToCartDto) {
    return await this.cartService.addItem(req.user.id, dto);
  }

  @Put("/items/:productId")
  async updateItem(
    @Req() req: any,
    @Param("productId") productId: string,
    @Body() dto: UpdateCartItemDto
  ) {
    return await this.cartService.updateItem(
      req.user.id,
      Number(productId),
      dto.quantity
    );
  }

  @Delete("/items/:productId")
  async removeItem(@Req() req: any, @Param("productId") productId: string) {
    return await this.cartService.removeItem(req.user.id, Number(productId));
  }

  @Delete()
  async clearCart(@Req() req: any) {
    return await this.cartService.clearCart(req.user.id);
  }
}
```

---

## 📋 Task Management API

A project and task management system with teams and assignments.

### Entities

```typescript
@Entity("projects")
export class Project extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column()
  @ForeignKey({ table: "users", column: "id" })
  ownerId: number;

  @Column({ default: "active" })
  status: "active" | "archived";

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

@Entity("tasks")
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column()
  @ForeignKey({ table: "projects", column: "id" })
  projectId: number;

  @Column({ nullable: true })
  @ForeignKey({ table: "users", column: "id" })
  assignedTo: number;

  @Column({ default: "todo" })
  status: "todo" | "in_progress" | "done";

  @Column({ default: "medium" })
  priority: "low" | "medium" | "high";

  @Column({ type: "datetime", nullable: true })
  dueDate: Date;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
```

This comprehensive guide provides production-ready code examples for common application types. Each example includes complete entity definitions, services with business logic, controllers with proper routing, error handling, authentication, and best practices.

---

## 📚 Key Features Demonstrated

✅ Complete CRUD operations  
✅ Authentication & authorization  
✅ Database transactions  
✅ Error handling  
✅ Input validation  
✅ Pagination  
✅ Relations between entities  
✅ Business logic separation  
✅ Security best practices  
✅ RESTful API design

---

**Use these examples** as templates for your own FynixJS applications!
