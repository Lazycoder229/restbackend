# Security Service Documentation

## Overview

The SecurityService provides essential security utilities including password hashing, JWT token generation/verification, input sanitization, and password strength validation for Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Password Hashing](#password-hashing)
- [JWT Tokens](#jwt-tokens)
- [Input Sanitization](#input-sanitization)
- [Password Validation](#password-validation)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { SecurityService } from "./builtin/security.service";

const security = new SecurityService();

// Configure
security.configure({
  jwtSecret: process.env.JWT_SECRET,
  saltRounds: 12,
});
```

---

## Password Hashing

### Hash Password

```typescript
const hashedPassword = await security.hashPassword("user-password");
```

### Compare Password

```typescript
const isValid = await security.comparePassword("user-password", hashedPassword);
```

---

## JWT Tokens

### Generate Token

```typescript
const token = security.generateToken(
  {
    id: user.id,
    email: user.email,
  },
  "1h"
);
```

### Verify Token

```typescript
try {
  const payload = security.verifyToken(token);
  console.log(payload); // { id, email, iat, exp }
} catch (error) {
  console.error("Invalid token");
}
```

### Decode Token (Without Verification)

```typescript
const payload = security.decodeToken(token);
```

---

## Input Sanitization

### Sanitize String

```typescript
const clean = security.sanitizeInput('<script>alert("xss")</script>');
// &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;
```

---

## Password Validation

### Check Password Strength

```typescript
const result = security.isStrongPassword("weak");
// { valid: false, message: 'Password must be at least 8 characters' }

const result2 = security.isStrongPassword("StrongPass123");
// { valid: true }
```

---

## API Reference

### `configure(config: SecurityConfig): void`

Configure security settings.

```typescript
security.configure({
  jwtSecret: "your-secret-key",
  saltRounds: 12,
});
```

### `hashPassword(password: string): Promise<string>`

Hash a password using bcrypt.

```typescript
const hash = await security.hashPassword("password123");
```

### `comparePassword(password: string, hash: string): Promise<boolean>`

Compare password with hash.

```typescript
const isValid = await security.comparePassword("password123", hash);
```

### `generateToken(payload: any, expiresIn: string | number): string`

Generate JWT token.

```typescript
const token = security.generateToken({ userId: 1 }, "1h");
```

### `verifyToken(token: string): any`

Verify and decode JWT token.

```typescript
const payload = security.verifyToken(token);
```

### `decodeToken(token: string): any`

Decode JWT token without verification.

```typescript
const payload = security.decodeToken(token);
```

### `sanitizeInput(input: string): string`

Sanitize string to prevent XSS.

```typescript
const clean = security.sanitizeInput(userInput);
```

### `generateRandomString(length: number): string`

Generate random string.

```typescript
const randomStr = security.generateRandomString(32);
```

### `isValidEmail(email: string): boolean`

Validate email format.

```typescript
const valid = security.isValidEmail("user@example.com");
```

### `isStrongPassword(password: string): { valid: boolean; message?: string }`

Check password strength.

```typescript
const result = security.isStrongPassword("MyPass123");
```

---

## Best Practices

### 1. Always Hash Passwords

```typescript
// Good
const hashedPassword = await security.hashPassword(password);
await userRepo.create({ email, password: hashedPassword });

// Bad
await userRepo.create({ email, password }); // Plain text!
```

### 2. Use Environment Variables for Secrets

```typescript
// Good
security.configure({
  jwtSecret: process.env.JWT_SECRET,
});

// Bad
security.configure({
  jwtSecret: "hardcoded-secret",
});
```

### 3. Sanitize User Input

```typescript
// Good
const cleanBio = security.sanitizeInput(userBio);
await userRepo.update(userId, { bio: cleanBio });

// Bad
await userRepo.update(userId, { bio: userBio }); // XSS risk
```

### 4. Validate Password Strength

```typescript
const result = security.isStrongPassword(password);
if (!result.valid) {
  throw new BadRequestException(result.message);
}
```

---

## Examples

### Complete Authentication Service

```typescript
@Injectable()
export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private security: SecurityService
  ) {}

  async register(data: RegisterDto): Promise<AuthResponse> {
    // Validate password strength
    const passwordCheck = this.security.isStrongPassword(data.password);
    if (!passwordCheck.valid) {
      throw new BadRequestException(passwordCheck.message);
    }

    // Validate email
    if (!this.security.isValidEmail(data.email)) {
      throw new BadRequestException("Invalid email");
    }

    // Hash password
    const hashedPassword = await this.security.hashPassword(data.password);

    // Create user
    const user = await this.userRepo.create({
      email: data.email,
      password: hashedPassword,
      name: this.security.sanitizeInput(data.name),
    });

    // Generate token
    const token = this.security.generateToken(
      {
        id: user.id,
        email: user.email,
      },
      "1h"
    );

    return { token, user };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await this.security.comparePassword(
      password,
      user.password
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = this.security.generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      "1h"
    );

    return { token, user };
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepo.findById(userId);

    const isValid = await this.security.comparePassword(
      oldPassword,
      user.password
    );
    if (!isValid) {
      throw new UnauthorizedException("Invalid password");
    }

    const passwordCheck = this.security.isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
      throw new BadRequestException(passwordCheck.message);
    }

    const hashedPassword = await this.security.hashPassword(newPassword);
    await this.userRepo.update(userId, { password: hashedPassword });
  }
}
```

---

## Related Documentation

- [JWT Auth Guard](./JWT_AUTH_GUARD.md)
- [API Key Guard](./API_KEY_GUARD.md)
- [Validation Pipe](./VALIDATION_PIPE.md)
- [Sanitization Pipes](./SANITIZATION_PIPES.md)

---

**Last Updated**: December 4, 2025
