# 08 - Validation & Pipes

## 📋 Table of Contents

- [Understanding Pipes](#understanding-pipes)
- [Built-in ValidationPipe](#built-in-validationpipe)
- [Validation Decorators](#validation-decorators)
- [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
- [Custom Pipes](#custom-pipes)
- [Transformation Pipes](#transformation-pipes)
- [Sanitization](#sanitization)
- [Error Messages](#error-messages)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)

---

## 🎯 Understanding Pipes

**Pipes** transform and validate input data before it reaches the route handler. They operate on arguments passed to controller methods.

### Pipe Interface

```typescript
export interface PipeTransform<T = any, R = any> {
  transform(value: T, metadata: ArgumentMetadata): R;
}
```

### When to Use Pipes

✅ Input validation  
✅ Type transformation  
✅ Data sanitization  
✅ Default value assignment  
✅ Data formatting

---

## ✅ Built-in ValidationPipe

### Basic Usage

```typescript
import { ValidationPipe, UsePipes, Post, Body } from "@fynixjs/fynix";

@Controller("/users")
export class UserController {
  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }
}
```

### Global Validation

```typescript
// main.ts
const app = await FynixFactory.create(AppModule);
await app.init();

// Apply to all routes
app.useGlobalPipes(new ValidationPipe());

await app.listen(3000);
```

---

## 🎨 Validation Decorators

FynixJS provides built-in validation decorators:

### String Validators

```typescript
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsURL,
} from "@fynixjs/fynix";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      "Password must contain uppercase, lowercase, number and special char",
  })
  password: string;

  @IsURL()
  @IsOptional()
  website?: string;
}
```

### Number Validators

```typescript
import { IsNumber, IsInt, Min, Max, IsPositive } from "@fynixjs/fynix";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  @Min(0.01)
  price: number;

  @IsInt()
  @Min(0)
  @Max(10000)
  stock: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
```

### Boolean Validators

```typescript
import { IsBoolean } from "@fynixjs/fynix";

export class UpdateUserDto {
  @IsBoolean()
  isActive: boolean;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;
}
```

### Date Validators

```typescript
import { IsDate, IsDateString } from "@fynixjs/fynix";

export class CreateEventDto {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
```

### Array Validators

```typescript
import { IsArray, ArrayMinSize, ArrayMaxSize } from "@fynixjs/fynix";

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  items: OrderItem[];

  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
```

### Object Validators

```typescript
import { IsObject, ValidateNested } from "@fynixjs/fynix";

class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  @Matches(/^\d{5}$/)
  zipCode: string;
}

export class CreateUserDto {
  @IsString()
  name: string;

  @ValidateNested()
  @IsObject()
  address: AddressDto;
}
```

### Enum Validators

```typescript
import { IsIn } from "@fynixjs/fynix";

export class UpdateOrderDto {
  @IsIn(["pending", "processing", "shipped", "delivered", "cancelled"])
  status: string;

  @IsIn(["low", "medium", "high"])
  @IsOptional()
  priority?: string;
}
```

### Optional Fields

```typescript
import { IsOptional } from "@fynixjs/fynix";

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsInt()
  @Min(18)
  @IsOptional()
  age?: number;
}
```

---

## 📦 Data Transfer Objects (DTOs)

### Create DTO

```typescript
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsIn(['draft', 'published'])
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

// Usage
@Post('/posts')
@UsePipes(ValidationPipe)
async create(@Body() dto: CreatePostDto) {
  return await this.postService.create(dto);
}
```

### Update DTO

```typescript
export class UpdatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsString()
  @MinLength(10)
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsIn(['draft', 'published'])
  @IsOptional()
  status?: string;
}

// Usage
@Put('/posts/:id')
@UsePipes(ValidationPipe)
async update(
  @Param('id') id: string,
  @Body() dto: UpdatePostDto
) {
  return await this.postService.update(Number(id), dto);
}
```

### Query DTO

```typescript
export class GetUsersQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sort?: 'asc' | 'desc' = 'desc';
}

// Usage
@Get('/users')
async findAll(@Query() query: GetUsersQueryDto) {
  return await this.userService.findAll(query);
}
```

---

## 🔧 Custom Pipes

### Transformation Pipe

```typescript
import { PipeTransform, Injectable, BadRequestException } from "@fynixjs/fynix";

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException('Validation failed: not a number');
    }

    return val;
  }
}

// Usage
@Get('/users/:id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  return await this.userService.findById(id);
}
```

### Default Value Pipe

```typescript
@Injectable()
export class DefaultValuePipe implements PipeTransform {
  constructor(private defaultValue: any) {}

  transform(value: any): any {
    return value === undefined || value === null ? this.defaultValue : value;
  }
}

// Usage
@Get('/products')
async findAll(
  @Query('page', new DefaultValuePipe(1)) page: number,
  @Query('limit', new DefaultValuePipe(10)) limit: number
) {
  return await this.productService.findAll(page, limit);
}
```

### Trim Pipe

```typescript
@Injectable()
export class TrimPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    return typeof value === 'string' ? value.trim() : value;
  }
}

// Usage
@Post('/users')
async create(@Body('email', TrimPipe) email: string) {
  return await this.userService.create({ email });
}
```

### Lowercase Pipe

```typescript
@Injectable()
export class LowercasePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    return typeof value === 'string' ? value.toLowerCase() : value;
  }
}

// Usage
@Post('/users')
async create(
  @Body('email', TrimPipe, LowercasePipe) email: string
) {
  return await this.userService.create({ email });
}
```

---

## 🎨 Transformation Pipes

### Date Transformation

```typescript
@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  transform(value: string): Date {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    return date;
  }
}

// Usage
@Post('/events')
async create(
  @Body('startDate', ParseDatePipe) startDate: Date
) {
  return await this.eventService.create({ startDate });
}
```

### JSON Parse Pipe

```typescript
@Injectable()
export class ParseJsonPipe implements PipeTransform {
  transform(value: string): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new BadRequestException('Invalid JSON');
    }
  }
}

// Usage
@Post('/config')
async updateConfig(
  @Body('settings', ParseJsonPipe) settings: any
) {
  return await this.configService.update(settings);
}
```

### Array Transformation

```typescript
@Injectable()
export class ParseArrayPipe implements PipeTransform<string, string[]> {
  transform(value: string): string[] {
    if (!value) return [];
    return value.split(',').map(v => v.trim());
  }
}

// Usage
@Get('/products')
async findAll(
  @Query('tags', ParseArrayPipe) tags: string[]
) {
  return await this.productService.findByTags(tags);
}
// GET /products?tags=electronics,gadgets,sale
```

---

## 🧹 Sanitization

### HTML Sanitization

```typescript
import { sanitize } from 'sanitize-html';

@Injectable()
export class SanitizeHtmlPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string') return value;

    return sanitize(value, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p'],
      allowedAttributes: {
        'a': ['href']
      }
    });
  }
}

// Usage
@Post('/posts')
async create(
  @Body('content', SanitizeHtmlPipe) content: string
) {
  return await this.postService.create({ content });
}
```

### XSS Prevention

```typescript
@Injectable()
export class XssSanitizationPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === "string") {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item));
    }

    if (typeof value === "object" && value !== null) {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = this.transform(value[key]);
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }
}
```

### SQL Injection Prevention

```typescript
@Injectable()
export class SqlSanitizationPipe implements PipeTransform<string, string> {
  private dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\;|\/\*|\*\/)/g,
    /(\bOR\b.*\=.*\bOR\b)/gi,
  ];

  transform(value: string): string {
    if (typeof value !== "string") return value;

    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(value)) {
        throw new BadRequestException("Invalid input detected");
      }
    }

    return value;
  }
}
```

---

## 💬 Error Messages

### Custom Error Messages

```typescript
export class CreateUserDto {
  @IsString({ message: "Name must be a string" })
  @IsNotEmpty({ message: "Name is required" })
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @MaxLength(50, { message: "Name must not exceed 50 characters" })
  name: string;

  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @IsString({ message: "Password must be a string" })
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      "Password must contain uppercase, lowercase, number and special character",
  })
  password: string;
}
```

### Custom Validation Error Handler

```typescript
@Injectable()
export class CustomValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const errors = await validate(value);

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new BadRequestException({
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    return value;
  }

  private formatErrors(errors: any[]): any {
    return errors.reduce((acc, err) => {
      acc[err.property] = Object.values(err.constraints || {});
      return acc;
    }, {});
  }
}

// Response format:
// {
//   "message": "Validation failed",
//   "errors": {
//     "email": ["Invalid email format", "Email is required"],
//     "password": ["Password must be at least 8 characters"]
//   }
// }
```

---

## ✅ Best Practices

### 1. Always Use DTOs

```typescript
// ✅ Good
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

@Post()
@UsePipes(ValidationPipe)
async create(@Body() dto: CreateUserDto) {
  return await this.userService.create(dto);
}

// ❌ Bad
@Post()
async create(@Body() body: any) {
  return await this.userService.create(body);
}
```

### 2. Validate All Input

```typescript
// ✅ Good - validate everything
@Get()
async findAll(
  @Query('page', ParseIntPipe) page: number,
  @Query('limit', ParseIntPipe) limit: number
) {}

@Get('/:id')
async findOne(@Param('id', ParseIntPipe) id: number) {}

// ❌ Bad - no validation
@Get('/:id')
async findOne(@Param('id') id: any) {}
```

### 3. Provide Clear Error Messages

```typescript
// ✅ Good
@IsEmail({}, { message: 'Please provide a valid email address' })
@MinLength(8, { message: 'Password must be at least 8 characters long' })

// ❌ Bad
@IsEmail()
@MinLength(8)
```

### 4. Sanitize User Input

```typescript
// ✅ Good
@Post('/posts')
async create(
  @Body('title', TrimPipe, SanitizeHtmlPipe) title: string,
  @Body('content', SanitizeHtmlPipe) content: string
) {
  return await this.postService.create({ title, content });
}
```

### 5. Transform Query Parameters

```typescript
// ✅ Good
export class PaginationDto {
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit: number = 10;
}
```

---

## 🎯 Real-World Examples

### Complete User Registration

```typescript
// dto/register.dto.ts
export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: "Name is required" })
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @MaxLength(50, { message: "Name cannot exceed 50 characters" })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      "Password must contain uppercase, lowercase, number and special character",
  })
  password: string;

  @IsString()
  @Matches(/^\d{10}$/, { message: "Phone must be 10 digits" })
  @IsOptional()
  phone?: string;

  @IsInt()
  @Min(18, { message: "Must be at least 18 years old" })
  @Max(120, { message: "Invalid age" })
  @IsOptional()
  age?: number;
}

// controller
@Controller("/auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("/register")
  @UsePipes(ValidationPipe)
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }
}
```

### E-Commerce Product Filter

```typescript
export class ProductFilterDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  limit?: number = 10;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? value.split(",") : value
  )
  @IsOptional()
  categories?: string[];

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  maxPrice?: number;

  @IsIn(["price", "name", "rating"])
  @IsOptional()
  sortBy?: string = "name";

  @IsIn(["asc", "desc"])
  @IsOptional()
  sortOrder?: "asc" | "desc" = "asc";
}

@Controller("/products")
export class ProductController {
  @Get()
  async findAll(@Query() filters: ProductFilterDto) {
    return await this.productService.findAll(filters);
  }
}

// GET /products?search=laptop&categories=electronics,computers&minPrice=100&maxPrice=1000&page=1&limit=20&sortBy=price&sortOrder=asc
```

### Complex Nested Validation

```typescript
class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @Matches(/^\d{5}$/)
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

class OrderItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  items: OrderItemDto[];

  @ValidateNested()
  shippingAddress: AddressDto;

  @ValidateNested()
  @IsOptional()
  billingAddress?: AddressDto;

  @IsString()
  @IsOptional()
  notes?: string;
}

@Controller("/orders")
export class OrderController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async create(@Body() dto: CreateOrderDto) {
    return await this.orderService.create(dto);
  }
}
```

---

## 📚 Next Steps

- **[09-ERROR_HANDLING.md](./09-ERROR_HANDLING.md)** - Handle validation errors
- **[06-SECURITY_AUTH.md](./06-SECURITY_AUTH.md)** - Secure validated data
- **[13-BEST_PRACTICES.md](./13-BEST_PRACTICES.md)** - Validation patterns

---

## 💡 Key Takeaways

✅ Always validate user input with DTOs  
✅ Use built-in validation decorators  
✅ Transform data with custom pipes  
✅ Sanitize to prevent XSS and SQL injection  
✅ Provide clear error messages  
✅ Apply ValidationPipe globally  
✅ Validate query parameters and params  
✅ Use @IsOptional for optional fields

---

**Master Validation & Pipes** to build secure, robust APIs!
