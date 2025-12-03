# Complete Schema Sync Example

This example shows all features of FynixJS Schema Synchronization.

## Full E-commerce Schema

```typescript
// src/entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  Index,
  Unique,
} from "@fynixjs/fynix";

@Entity("users")
@Index(["email"], { isUnique: true })
@Index(["createdAt"])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ type: "varchar", length: 100, comment: "User full name" })
  name: string;

  @Column({ type: "varchar", length: 150, isUnique: true })
  email: string;

  @Column({ type: "varchar", length: 255, comment: "Hashed password" })
  password: string;

  @Column({
    type: "enum('user','admin','moderator')",
    default: "user",
  })
  role: string;

  @Column({ type: "varchar", length: 20, isNullable: true })
  phoneNumber: string | null;

  @Column({ type: "text", isNullable: true })
  address: string | null;

  @Column({ type: "tinyint", length: 1, default: 1 })
  isActive: boolean;

  @Column({ type: "datetime" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}

// src/entities/category.entity.ts
@Entity("categories")
@Index(["slug"], { isUnique: true })
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 100, isUnique: true })
  slug: string;

  @Column({ type: "text", isNullable: true })
  description: string | null;

  @Column({ type: "int", unsigned: true, isNullable: true })
  parentId: number | null;

  @Column({ type: "tinyint", length: 1, default: 1 })
  isActive: boolean;

  @Column({ type: "datetime" })
  createdAt: Date;
}

// src/entities/product.entity.ts
@Entity("products")
@Index(["categoryId"])
@Index(["sku"], { isUnique: true })
@Index(["name"])
@Index(["price"])
@ForeignKey({
  column: "categoryId",
  referencedTable: "categories",
  referencedColumn: "id",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
})
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "varchar", length: 100, isUnique: true })
  sku: string;

  @Column({ type: "text" })
  description: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    unsigned: true,
    comment: "Product price in USD",
  })
  price: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    unsigned: true,
    isNullable: true,
  })
  compareAtPrice: number | null;

  @Column({ type: "int", unsigned: true, default: 0 })
  stock: number;

  @Column({ type: "int", unsigned: true, isNullable: true })
  categoryId: number | null;

  @Column({ type: "json", isNullable: true })
  images: string[];

  @Column({ type: "json", isNullable: true })
  attributes: Record<string, any>;

  @Column({ type: "float", unsigned: true, default: 0 })
  rating: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  reviewCount: number;

  @Column({ type: "bigint", unsigned: true, default: 0 })
  viewCount: number;

  @Column({ type: "tinyint", length: 1, default: 1 })
  isActive: boolean;

  @Column({ type: "tinyint", length: 1, default: 0 })
  isFeatured: boolean;

  @Column({ type: "datetime" })
  createdAt: Date;

  @Column({ type: "datetime" })
  updatedAt: Date;
}

// src/entities/order.entity.ts
@Entity("orders")
@Index(["userId"])
@Index(["status"])
@Index(["orderNumber"], { isUnique: true })
@ForeignKey({
  column: "userId",
  referencedTable: "users",
  referencedColumn: "id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ type: "varchar", length: 50, isUnique: true })
  orderNumber: string;

  @Column({ type: "bigint", unsigned: true })
  userId: number;

  @Column({
    type: "enum('pending','processing','shipped','delivered','cancelled')",
    default: "pending",
  })
  status: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    unsigned: true,
  })
  subtotal: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    unsigned: true,
    default: 0,
  })
  tax: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    unsigned: true,
    default: 0,
  })
  shipping: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    unsigned: true,
  })
  total: number;

  @Column({ type: "json" })
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };

  @Column({ type: "text", isNullable: true })
  notes: string | null;

  @Column({ type: "datetime" })
  createdAt: Date;

  @Column({ type: "datetime" })
  updatedAt: Date;

  @Column({ type: "datetime", isNullable: true })
  shippedAt: Date | null;

  @Column({ type: "datetime", isNullable: true })
  deliveredAt: Date | null;
}

// src/entities/order-item.entity.ts
@Entity("order_items")
@Index(["orderId"])
@Index(["productId"])
@ForeignKey({
  column: "orderId",
  referencedTable: "orders",
  referencedColumn: "id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
@ForeignKey({
  column: "productId",
  referencedTable: "products",
  referencedColumn: "id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
})
export class OrderItem extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ type: "bigint", unsigned: true })
  orderId: number;

  @Column({ type: "bigint", unsigned: true })
  productId: number;

  @Column({ type: "varchar", length: 200 })
  productName: string;

  @Column({ type: "varchar", length: 100 })
  productSku: string;

  @Column({ type: "int", unsigned: true })
  quantity: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    unsigned: true,
  })
  price: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    unsigned: true,
  })
  total: number;

  @Column({ type: "json", isNullable: true })
  attributes: Record<string, any>;
}

// src/entities/review.entity.ts
@Entity("reviews")
@Index(["productId"])
@Index(["userId"])
@Index(["rating"])
@ForeignKey({
  column: "productId",
  referencedTable: "products",
  referencedColumn: "id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
@ForeignKey({
  column: "userId",
  referencedTable: "users",
  referencedColumn: "id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
export class Review extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ type: "bigint", unsigned: true })
  productId: number;

  @Column({ type: "bigint", unsigned: true })
  userId: number;

  @Column({ type: "tinyint", unsigned: true, comment: "Rating from 1 to 5" })
  rating: number;

  @Column({ type: "varchar", length: 200, isNullable: true })
  title: string | null;

  @Column({ type: "text" })
  comment: string;

  @Column({ type: "json", isNullable: true })
  images: string[];

  @Column({ type: "tinyint", length: 1, default: 0 })
  isVerifiedPurchase: boolean;

  @Column({ type: "tinyint", length: 1, default: 1 })
  isApproved: boolean;

  @Column({ type: "int", unsigned: true, default: 0 })
  helpfulCount: number;

  @Column({ type: "datetime" })
  createdAt: Date;

  @Column({ type: "datetime" })
  updatedAt: Date;
}
```

## Main Application Setup

```typescript
// src/main.ts
import {
  FynixFactory,
  DatabaseService,
  SchemaSyncService,
} from "@fynixjs/fynix";
import { AppModule } from "./app.module";

// Import all entities
import { User } from "./entities/user.entity";
import { Category } from "./entities/category.entity";
import { Product } from "./entities/product.entity";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Review } from "./entities/review.entity";

async function bootstrap() {
  const app = await FynixFactory.create(AppModule);

  // Configure database
  const db = app.get<DatabaseService>(DatabaseService);
  db.initialize({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ecommerce",
  });

  // Auto-sync schemas in development
  if (process.env.NODE_ENV === "development") {
    const schemaSync = app.get<SchemaSyncService>(SchemaSyncService);

    // Synchronize all entities
    await schemaSync.synchronize([
      User,
      Category,
      Product,
      Order,
      OrderItem,
      Review,
    ]);

    console.log("✅ Database schema synchronized!");
  }

  await app.listen(3000);
}

bootstrap();
```

## Output

```
🔄 Starting schema synchronization...
📝 Syncing table: users
  ✅ Created table: users
📝 Syncing table: categories
  ✅ Created table: categories
📝 Syncing table: products
  ✅ Created table: products
  🔗 Added index: idx_products_categoryId
  🔗 Added index: idx_products_sku
  🔗 Added foreign key: fk_products_categoryId
📝 Syncing table: orders
  ✅ Created table: orders
  🔗 Added index: idx_orders_userId
  🔗 Added index: idx_orders_status
  🔗 Added foreign key: fk_orders_userId
📝 Syncing table: order_items
  ✅ Created table: order_items
  🔗 Added index: idx_order_items_orderId
  🔗 Added index: idx_order_items_productId
  🔗 Added foreign key: fk_order_items_orderId
  🔗 Added foreign key: fk_order_items_productId
📝 Syncing table: reviews
  ✅ Created table: reviews
  🔗 Added index: idx_reviews_productId
  🔗 Added index: idx_reviews_userId
  🔗 Added foreign key: fk_reviews_productId
  🔗 Added foreign key: fk_reviews_userId
✅ Schema synchronization completed!
✅ Database schema synchronized!
Application is running on: http://localhost:3000
```

## Generate SQL Migration

```typescript
// scripts/generate-migration.ts
import { SchemaSyncService, DatabaseService } from "@fynixjs/fynix";
import { User, Category, Product, Order, OrderItem, Review } from "./entities";
import * as fs from "fs";

async function generateMigration() {
  const db = new DatabaseService();
  const schemaSync = new SchemaSyncService(db);

  const sql = await schemaSync.generateMigration(
    [User, Category, Product, Order, OrderItem, Review],
    "create-ecommerce-schema"
  );

  const fileName = `migrations/${Date.now()}-create-ecommerce-schema.sql`;
  fs.writeFileSync(fileName, sql);

  console.log(`✅ Migration generated: ${fileName}`);
}

generateMigration();
```

---

**Complete e-commerce database with foreign keys, indexes, and all MySQL data types - zero manual SQL!** 🚀
