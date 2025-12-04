# Transaction Service Documentation

## Overview

The TransactionService provides database transaction management with support for nested transactions, savepoints, and automatic rollback on errors in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Transaction Decorator](#transaction-decorator)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  TransactionHelper,
  TransactionManager,
  Transaction,
} from "./builtin/transaction.service";
```

---

## Basic Usage

### Using TransactionHelper

```typescript
await TransactionHelper.run(async (transaction) => {
  // All queries in this block run in a transaction
  await transaction.query("INSERT INTO users (name) VALUES (?)", ["John"]);
  await transaction.query("INSERT INTO logs (action) VALUES (?)", [
    "user_created",
  ]);

  // Transaction commits automatically if no error
  // Rolls back automatically on error
});
```

### Using Transaction Decorator

```typescript
@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  @Transaction()
  async createUserWithProfile(data: CreateUserDto): Promise<User> {
    // Automatically wrapped in transaction
    const user = await this.userRepo.create(data);
    await this.profileRepo.create({ userId: user.id, ...data.profile });
    return user;
  }
}
```

---

## API Reference

### TransactionHelper

#### `static run<T>(callback: (transaction: TransactionManager) => Promise<T>): Promise<T>`

Execute code in a transaction.

```typescript
const result = await TransactionHelper.run(async (tx) => {
  const user = await tx.query("INSERT INTO users...", []);
  await tx.query("INSERT INTO profiles...", [user.insertId]);
  return user;
});
```

### TransactionManager

#### `begin(): Promise<void>`

Start transaction.

```typescript
await transaction.begin();
```

#### `commit(): Promise<void>`

Commit transaction.

```typescript
await transaction.commit();
```

#### `rollback(): Promise<void>`

Rollback transaction.

```typescript
await transaction.rollback();
```

#### `savepoint(name?: string): Promise<string>`

Create savepoint.

```typescript
const sp = await transaction.savepoint("my_savepoint");
```

#### `rollbackTo(savepoint: string): Promise<void>`

Rollback to savepoint.

```typescript
await transaction.rollbackTo(sp);
```

#### `query<T>(sql: string, params?: any[]): Promise<T>`

Execute query within transaction.

```typescript
const users = await transaction.query("SELECT * FROM users");
```

---

## Transaction Decorator

### @Transaction()

Automatically wraps method in a transaction.

```typescript
@Injectable()
export class OrderService {
  @Transaction()
  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    const order = await this.orderRepo.create(orderData);

    for (const item of orderData.items) {
      await this.orderItemRepo.create({
        orderId: order.id,
        ...item,
      });
    }

    return order;
  }
}
```

---

## Best Practices

### 1. Use Transactions for Related Operations

```typescript
// Good - atomic operations
@Transaction()
async transferMoney(from: number, to: number, amount: number) {
  await this.accountRepo.decrement(from, amount);
  await this.accountRepo.increment(to, amount);
  await this.logRepo.create({ action: 'transfer', from, to, amount });
}
```

### 2. Handle Errors Gracefully

```typescript
try {
  await TransactionHelper.run(async (tx) => {
    await tx.query("INSERT...");
  });
} catch (error) {
  console.error("Transaction failed:", error);
  // Transaction is automatically rolled back
}
```

### 3. Use Savepoints for Partial Rollback

```typescript
await TransactionHelper.run(async (tx) => {
  await tx.query("INSERT INTO orders...");

  const sp = await tx.savepoint();

  try {
    await tx.query("INSERT INTO optional_data...");
  } catch (error) {
    await tx.rollbackTo(sp); // Only rollback optional data
  }
});
```

---

## Examples

### Complete Order Processing

```typescript
@Injectable()
export class OrderService {
  @Transaction()
  async processOrder(userId: number, items: OrderItem[]): Promise<Order> {
    // Create order
    const order = await this.orderRepo.create({
      userId,
      status: "pending",
      total: 0,
    });

    let total = 0;

    // Add items and update stock
    for (const item of items) {
      await this.orderItemRepo.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });

      await this.productRepo.decrementStock(item.productId, item.quantity);

      total += item.price * item.quantity;
    }

    // Update order total
    await this.orderRepo.update(order.id, { total });

    // Create transaction log
    await this.transactionLogRepo.create({
      orderId: order.id,
      action: "order_created",
      amount: total,
    });

    return await this.orderRepo.findById(order.id);
  }
}
```

---

## Related Documentation

- [Database Service](./DATABASE_SERVICE.md)
- [Repository Pattern](./REPOSITORY.md)
- [Query Builder](./QUERY_BUILDER.md)

---

**Last Updated**: December 4, 2025
