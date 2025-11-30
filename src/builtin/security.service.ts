import { Injectable } from "../decorators/injectable.decorator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * Built-in Security Service
 */
@Injectable()
export class SecurityService {
  private jwtSecret: string = "change-me-in-production";
  private saltRounds: number = 10;

  /**
   * Configure security settings
   */
  configure(config: { jwtSecret?: string; saltRounds?: number }) {
    if (config.jwtSecret) {
      this.jwtSecret = config.jwtSecret;
    }
    if (config.saltRounds) {
      this.saltRounds = config.saltRounds;
    }
  }

  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: any, expiresIn: string | number = "1h"): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: expiresIn as any });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  /**
   * Decode JWT token without verification (use carefully)
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  /**
   * Generate random string
   */
  generateRandomString(length: number = 32): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate strong password
   */
  isStrongPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return {
        valid: false,
        message: "Password must be at least 8 characters",
      };
    }
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain uppercase letter",
      };
    }
    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain lowercase letter",
      };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain number" };
    }
    return { valid: true };
  }
}
