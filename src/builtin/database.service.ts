import { Injectable } from "../decorators/injectable.decorator";
import mysql from "mysql2/promise";

/**
 * Built-in Database Service for MySQL
 */
@Injectable()
export class DatabaseService {
  private pool: mysql.Pool | null = null;

  /**
   * Initialize database connection
   */
  initialize(config: {
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number;
  }) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.connectionLimit || 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  /**
   * Execute a query
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    if (!this.pool) {
      throw new Error("Database not initialized. Call initialize() first.");
    }

    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows as T;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }

  /**
   * Get a connection for transactions
   */
  async getConnection() {
    if (!this.pool) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return await this.pool.getConnection();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close all connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
