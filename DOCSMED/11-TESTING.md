# 11 - Testing

## 📋 Table of Contents

- [Testing Strategy](#testing-strategy)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Testing Module](#testing-module)
- [Mocking Dependencies](#mocking-dependencies)
- [Testing Controllers](#testing-controllers)
- [Testing Services](#testing-services)
- [Testing Guards & Interceptors](#testing-guards--interceptors)
- [Database Testing](#database-testing)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)

---

## 🎯 Testing Strategy

### Testing Pyramid

```
       /\
      /E2E\          ← Few, high-level tests
     /------\
    /Integr.\       ← More tests, component interactions
   /----------\
  / Unit Tests \    ← Most tests, isolated components
 /--------------\
```

### When to Use Each Type

**Unit Tests**: Test individual functions, methods, and classes in isolation  
**Integration Tests**: Test how components work together  
**E2E Tests**: Test complete user workflows through the API

---

## 🧪 Unit Testing

### Setting Up Jest

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src"],
    "testMatch": ["**/*.spec.ts"],
    "collectCoverageFrom": ["src/**/*.ts", "!src/**/*.spec.ts", "!src/main.ts"]
  }
}
```

### Basic Unit Test

```typescript
// user.service.spec.ts
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";

describe("UserService", () => {
  let service: UserService;
  let repository: UserRepository;

  beforeEach(() => {
    repository = new UserRepository();
    service = new UserService(repository);
  });

  describe("findById", () => {
    it("should return a user when found", async () => {
      const mockUser = { id: 1, name: "John Doe", email: "john@example.com" };
      jest.spyOn(repository, "findOne").mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ id: 1 });
    });

    it("should throw NotFoundException when user not found", async () => {
      jest.spyOn(repository, "findOne").mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const createDto = {
        name: "John",
        email: "john@example.com",
        password: "password123",
      };
      const mockUser = { id: 1, ...createDto };

      jest.spyOn(repository, "create").mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });

    it("should throw ConflictException when email exists", async () => {
      const createDto = {
        name: "John",
        email: "existing@example.com",
        password: "pass",
      };

      jest.spyOn(repository, "findOne").mockResolvedValue({ id: 1 } as any);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
    });
  });
});
```

---

## 🔗 Integration Testing

### Testing Module Setup

```typescript
// user.controller.integration.spec.ts
import { TestingModule } from "@fynixjs/fynix";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";

describe("UserController Integration", () => {
  let controller: UserController;
  let service: UserService;
  let testingModule: TestingModule;

  beforeAll(async () => {
    testingModule = await TestingModule.create({
      controllers: [UserController],
      providers: [UserService, UserRepository],
    });

    controller = testingModule.get<UserController>(UserController);
    service = testingModule.get<UserService>(UserService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  describe("GET /users", () => {
    it("should return array of users", async () => {
      const mockUsers = [
        { id: 1, name: "John", email: "john@example.com" },
        { id: 2, name: "Jane", email: "jane@example.com" },
      ];

      jest.spyOn(service, "findAll").mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });
  });

  describe("GET /users/:id", () => {
    it("should return a single user", async () => {
      const mockUser = { id: 1, name: "John", email: "john@example.com" };

      jest.spyOn(service, "findById").mockResolvedValue(mockUser);

      const result = await controller.findOne("1");

      expect(result).toEqual(mockUser);
    });

    it("should throw 404 when user not found", async () => {
      jest
        .spyOn(service, "findById")
        .mockRejectedValue(new NotFoundException());

      await expect(controller.findOne("999")).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
```

---

## 🌐 E2E Testing

### E2E Test Setup

```typescript
// test/app.e2e.spec.ts
import { FynixFactory } from "@fynixjs/fynix";
import { AppModule } from "../src/app.module";
import supertest from "supertest";

describe("App E2E Tests", () => {
  let app: any;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    app = await FynixFactory.create(AppModule);
    await app.init();
    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Authentication", () => {
    it("POST /auth/register - should register new user", async () => {
      const response = await request
        .post("/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "Password123!",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe("john@example.com");
    });

    it("POST /auth/login - should login user", async () => {
      const response = await request
        .post("/auth/login")
        .send({
          email: "john@example.com",
          password: "Password123!",
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
    });

    it("POST /auth/login - should fail with invalid credentials", async () => {
      await request
        .post("/auth/login")
        .send({
          email: "john@example.com",
          password: "wrongpassword",
        })
        .expect(401);
    });
  });

  describe("Protected Routes", () => {
    let token: string;

    beforeAll(async () => {
      const response = await request.post("/auth/login").send({
        email: "john@example.com",
        password: "Password123!",
      });

      token = response.body.token;
    });

    it("GET /users/profile - should get user profile", async () => {
      const response = await request
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email");
    });

    it("GET /users/profile - should fail without token", async () => {
      await request.get("/users/profile").expect(401);
    });
  });
});
```

---

## 🧰 Testing Module

### Creating Test Module

```typescript
import { TestingModule } from "@fynixjs/fynix";

const module = await TestingModule.create({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserRepository,
      useValue: mockUserRepository,
    },
    {
      provide: "CONFIG",
      useValue: { apiKey: "test-key" },
    },
  ],
});

const controller = module.get<UserController>(UserController);
const service = module.get<UserService>(UserService);
```

### Overriding Providers

```typescript
const module = await TestingModule.create({
  imports: [UserModule],
})
  .overrideProvider(UserRepository)
  .useValue(mockRepository)
  .overrideProvider(EmailService)
  .useValue(mockEmailService)
  .compile();
```

---

## 🎭 Mocking Dependencies

### Mock Repository

```typescript
const mockUserRepository = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
};

describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService(mockUserRepository as any);
  });

  it("should find user by id", async () => {
    const mockUser = { id: 1, name: "John" };
    mockUserRepository.findOne.mockResolvedValue(mockUser);

    const result = await service.findById(1);

    expect(result).toEqual(mockUser);
    expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: 1 });
  });
});
```

### Mock External Services

```typescript
const mockEmailService = {
  send: jest.fn(),
  sendBulk: jest.fn(),
};

const mockPaymentGateway = {
  charge: jest.fn(),
  refund: jest.fn(),
  verifyTransaction: jest.fn(),
};

describe("OrderService", () => {
  let service: OrderService;

  beforeEach(() => {
    service = new OrderService(
      mockOrderRepository as any,
      mockEmailService as any,
      mockPaymentGateway as any
    );
  });

  it("should send confirmation email after order", async () => {
    const order = { id: 1, userId: 1, total: 100 };
    mockEmailService.send.mockResolvedValue(true);

    await service.confirmOrder(order);

    expect(mockEmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.any(String),
        subject: "Order Confirmation",
      })
    );
  });
});
```

---

## 🎮 Testing Controllers

```typescript
describe("PostController", () => {
  let controller: PostController;
  let service: PostService;

  beforeEach(async () => {
    const module = await TestingModule.create({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    });

    controller = module.get<PostController>(PostController);
    service = module.get<PostService>(PostService);
  });

  describe("create", () => {
    it("should create a new post", async () => {
      const createDto = {
        title: "Test Post",
        content: "Test content",
        categoryId: 1,
      };
      const mockPost = { id: 1, ...createDto };

      jest.spyOn(service, "create").mockResolvedValue(mockPost);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockPost);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe("findAll", () => {
    it("should return paginated posts", async () => {
      const mockResponse = {
        data: [
          { id: 1, title: "Post 1" },
          { id: 2, title: "Post 2" },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      jest.spyOn(service, "findAll").mockResolvedValue(mockResponse);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe("delete", () => {
    it("should delete a post", async () => {
      jest.spyOn(service, "delete").mockResolvedValue(undefined);

      await controller.delete("1");

      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it("should throw 404 when post not found", async () => {
      jest.spyOn(service, "delete").mockRejectedValue(new NotFoundException());

      await expect(controller.delete("999")).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## ⚙️ Testing Services

```typescript
describe("AuthService", () => {
  let service: AuthService;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let bcrypt: any;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
    } as any;

    jwtService = {
      sign: jest.fn(),
    } as any;

    bcrypt = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    service = new AuthService(userRepository, jwtService, bcrypt);
  });

  describe("register", () => {
    it("should hash password and create user", async () => {
      const registerDto = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      userRepository.findOne = jest.fn().mockResolvedValue(null);
      bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");
      userRepository.create = jest.fn().mockResolvedValue({
        id: 1,
        ...registerDto,
        password: "hashedPassword",
      });

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...registerDto,
        password: "hashedPassword",
      });
      expect(result.password).toBeUndefined();
    });

    it("should throw ConflictException if email exists", async () => {
      const registerDto = {
        email: "existing@example.com",
        password: "password123",
        name: "Test",
      };

      userRepository.findOne = jest.fn().mockResolvedValue({ id: 1 });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe("login", () => {
    it("should return token on valid credentials", async () => {
      const loginDto = { email: "test@example.com", password: "password123" };
      const mockUser = {
        id: 1,
        email: loginDto.email,
        password: "hashedPassword",
      };

      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      jwtService.sign = jest.fn().mockReturnValue("jwt-token");

      const result = await service.login(loginDto);

      expect(result).toHaveProperty("token", "jwt-token");
      expect(result).toHaveProperty("user");
      expect(result.user.password).toBeUndefined();
    });

    it("should throw UnauthorizedException on invalid password", async () => {
      userRepository.findOne = jest.fn().mockResolvedValue({
        id: 1,
        password: "hashedPassword",
      });
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(
        service.login({ email: "test@example.com", password: "wrong" })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

---

## 🛡️ Testing Guards & Interceptors

### Testing Guards

```typescript
describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = { verify: jest.fn() } as any;
    guard = new JwtAuthGuard(jwtService);
  });

  it("should allow request with valid token", async () => {
    const context = {
      request: {
        headers: { authorization: "Bearer valid-token" },
      },
    };

    jwtService.verify = jest.fn().mockReturnValue({ userId: 1 });

    const result = await guard.canActivate(context as any);

    expect(result).toBe(true);
    expect(context.request["user"]).toEqual({ userId: 1 });
  });

  it("should deny request without token", async () => {
    const context = {
      request: { headers: {} },
    };

    await expect(guard.canActivate(context as any)).rejects.toThrow(
      UnauthorizedException
    );
  });

  it("should deny request with invalid token", async () => {
    const context = {
      request: {
        headers: { authorization: "Bearer invalid-token" },
      },
    };

    jwtService.verify = jest.fn().mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await expect(guard.canActivate(context as any)).rejects.toThrow(
      UnauthorizedException
    );
  });
});
```

### Testing Interceptors

```typescript
describe("LoggingInterceptor", () => {
  let interceptor: LoggingInterceptor;
  let logger: Logger;

  beforeEach(() => {
    logger = { log: jest.fn() } as any;
    interceptor = new LoggingInterceptor(logger);
  });

  it("should log request and response", async () => {
    const context = {
      request: { method: "GET", url: "/users" },
      response: {},
    };

    const next = jest.fn().mockResolvedValue({ data: "test" });

    const result = await interceptor.intercept(context as any, next);

    expect(result).toEqual({ data: "test" });
    expect(logger.log).toHaveBeenCalled();
  });
});
```

---

## 💾 Database Testing

### In-Memory Database

```typescript
// test/database.setup.ts
import { DatabaseService } from "@fynixjs/fynix";

export async function setupTestDatabase() {
  const db = new DatabaseService({
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
  });

  await db.connect();
  return db;
}

export async function cleanupDatabase(db: DatabaseService) {
  await db.disconnect();
}
```

### Integration Test with Database

```typescript
describe("UserService Database Integration", () => {
  let service: UserService;
  let repository: UserRepository;
  let db: DatabaseService;

  beforeAll(async () => {
    db = await setupTestDatabase();
    repository = new UserRepository(db);
    service = new UserService(repository);
  });

  afterAll(async () => {
    await cleanupDatabase(db);
  });

  beforeEach(async () => {
    // Clear database before each test
    await repository.clear();
  });

  it("should create and retrieve user", async () => {
    const createDto = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    const created = await service.create(createDto);
    expect(created.id).toBeDefined();

    const retrieved = await service.findById(created.id);
    expect(retrieved.name).toBe("John Doe");
    expect(retrieved.email).toBe("john@example.com");
  });

  it("should update user", async () => {
    const user = await service.create({
      name: "John",
      email: "john@example.com",
      password: "pass",
    });

    const updated = await service.update(user.id, { name: "Jane" });
    expect(updated.name).toBe("Jane");
  });
});
```

---

## 📊 Test Coverage

### Coverage Configuration

```json
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/**/*.interface.ts'
  ]
};
```

### Running Coverage

```bash
npm run test:cov

# Output:
# ----------------------|---------|----------|---------|---------|
# File                  | % Stmts | % Branch | % Funcs | % Lines |
# ----------------------|---------|----------|---------|---------|
# All files             |   92.5  |   85.3   |   90.1  |   93.2  |
#  user.controller.ts   |   100   |   100    |   100   |   100   |
#  user.service.ts      |   95.5  |   88.9   |   92.3  |   96.1  |
#  auth.service.ts      |   88.2  |   76.5   |   85.7  |   89.3  |
# ----------------------|---------|----------|---------|---------|
```

---

## ✅ Best Practices

### 1. Follow AAA Pattern

```typescript
// ✅ Good - Arrange, Act, Assert
it("should create user", async () => {
  // Arrange
  const createDto = { name: "John", email: "john@example.com" };
  mockRepository.create.mockResolvedValue({ id: 1, ...createDto });

  // Act
  const result = await service.create(createDto);

  // Assert
  expect(result.id).toBe(1);
  expect(result.name).toBe("John");
});
```

### 2. Test One Thing Per Test

```typescript
// ✅ Good - focused tests
it("should validate email format", () => {
  expect(validator.isValidEmail("test@example.com")).toBe(true);
});

it("should reject invalid email", () => {
  expect(validator.isValidEmail("invalid")).toBe(false);
});

// ❌ Bad - testing multiple things
it("should validate email", () => {
  expect(validator.isValidEmail("test@example.com")).toBe(true);
  expect(validator.isValidEmail("invalid")).toBe(false);
  expect(validator.isValidEmail("")).toBe(false);
});
```

### 3. Use Descriptive Test Names

```typescript
// ✅ Good - clear description
it("should throw NotFoundException when user does not exist", async () => {
  // ...
});

// ❌ Bad - vague description
it("should throw error", async () => {
  // ...
});
```

### 4. Clean Up After Tests

```typescript
// ✅ Good
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await database.disconnect();
  await testingModule.close();
});
```

---

## 🎯 Real-World Examples

### Complete Test Suite

```typescript
// user.service.spec.ts
describe("UserService", () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;
  let bcrypt: jest.Mocked<any>;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    bcrypt = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    service = new UserService(repository, bcrypt);
  });

  describe("findById", () => {
    it("should return user when found", async () => {
      const mockUser = { id: 1, name: "John", email: "john@test.com" };
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ id: 1 });
    });

    it("should throw NotFoundException when not found", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should hash password and create user", async () => {
      const dto = { name: "John", email: "john@test.com", password: "pass123" };
      repository.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      repository.create.mockResolvedValue({
        id: 1,
        ...dto,
        password: "hashed",
      });

      const result = await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith("pass123", 10);
      expect(repository.create).toHaveBeenCalled();
      expect(result.password).toBeUndefined();
    });

    it("should throw ConflictException if email exists", async () => {
      const dto = {
        name: "John",
        email: "existing@test.com",
        password: "pass",
      };
      repository.findOne.mockResolvedValue({ id: 1 } as any);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
```

---

## 📚 Next Steps

- **[12-DEPLOYMENT.md](./12-DEPLOYMENT.md)** - Deploy tested applications
- **[13-BEST_PRACTICES.md](./13-BEST_PRACTICES.md)** - Testing best practices
- **[06-SECURITY_AUTH.md](./06-SECURITY_AUTH.md)** - Test security features

---

## 💡 Key Takeaways

✅ Write unit tests for isolated components  
✅ Use integration tests for component interactions  
✅ Test critical user workflows with E2E tests  
✅ Mock external dependencies  
✅ Follow AAA pattern (Arrange, Act, Assert)  
✅ Aim for high test coverage (>80%)  
✅ Use descriptive test names  
✅ Clean up resources after tests

---

**Master Testing** to build reliable, maintainable applications!
