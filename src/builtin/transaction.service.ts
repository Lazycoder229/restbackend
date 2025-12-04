/**
 * Database Transaction Support
 */

import { DatabaseService } from "./database.service";
import * as mysql from "mysql2/promise";

/**
 * Transaction decorator - Wrap method in database transaction
 */
export function Transaction(): MethodDecorator {
  return (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const db = new DatabaseService();
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        // Store connection in context for nested calls
        (this as any).__transactionConnection = connection;

        const result = await originalMethod.apply(this, args);

        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        delete (this as any).__transactionConnection;
        connection.release();
      }
    };

    return descriptor;
  };
}

/**
 * Transaction Manager
 */
export class TransactionManager {
  private connection: mysql.PoolConnection;
  private savepointCounter = 0;

  constructor(connection: mysql.PoolConnection) {
    this.connection = connection;
  }

  /**
   * Start a transaction
   */
  async begin(): Promise<void> {
    await this.connection.beginTransaction();
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    await this.connection.commit();
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    await this.connection.rollback();
  }

  /**
   * Create a savepoint
   */
  async savepoint(name?: string): Promise<string> {
    const savepointName = name || `sp_${++this.savepointCounter}`;
    await this.connection.query(`SAVEPOINT ${savepointName}`);
    return savepointName;
  }

  /**
   * Rollback to a savepoint
   */
  async rollbackTo(savepoint: string): Promise<void> {
    await this.connection.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
  }

  /**
   * Release a savepoint
   */
  async releaseSavepoint(savepoint: string): Promise<void> {
    await this.connection.query(`RELEASE SAVEPOINT ${savepoint}`);
  }

  /**
   * Execute query within transaction
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await this.connection.execute(sql, params);
    return rows as T;
  }

  /**
   * Get the underlying connection
   */
  getConnection(): mysql.PoolConnection {
    return this.connection;
  }

  /**
   * Release connection back to pool
   */
  release(): void {
    this.connection.release();
  }
}

/**
 * Transaction helper for manual transaction control
 */
export class TransactionHelper {
  /**
   * Run code in a transaction
   */
  static async run<T>(
    callback: (transaction: TransactionManager) => Promise<T>
  ): Promise<T> {
    const db = new DatabaseService();
    const connection = await db.getConnection();
    const transaction = new TransactionManager(connection);

    try {
      await transaction.begin();
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      transaction.release();
    }
  }

  /**
   * Run code with nested transactions (savepoints)
   */
  static async nested<T>(
    transaction: TransactionManager,
    callback: (savepoint: string) => Promise<T>
  ): Promise<T> {
    const savepoint = await transaction.savepoint();

    try {
      const result = await callback(savepoint);
      await transaction.releaseSavepoint(savepoint);
      return result;
    } catch (error) {
      await transaction.rollbackTo(savepoint);
      throw error;
    }
  }
}

/**
 * Inject transaction connection into repository
 */
export function InjectTransaction(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;

    const existingParams =
      Reflect.getMetadata("transaction:params", target, propertyKey) || [];
    existingParams.push(parameterIndex);
    Reflect.defineMetadata(
      "transaction:params",
      existingParams,
      target,
      propertyKey
    );
  };
}

/**
 * Get transaction connection if available
 */
export function getTransactionConnection(
  instance: any
): mysql.PoolConnection | null {
  return (instance as any).__transactionConnection || null;
}
