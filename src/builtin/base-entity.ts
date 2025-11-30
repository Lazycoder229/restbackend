import { DatabaseService } from "./database.service";
import { QueryBuilder } from "./query-builder";
import {
  ENTITY_METADATA,
  EntityMetadata,
} from "../decorators/entity.decorator";

/**
 * Base Entity class with Active Record pattern
 * Similar to NestJS TypeORM's BaseEntity
 *
 * Provides static methods for querying and instance methods for saving/deleting
 *
 * @example
 * ```typescript
 * @Entity('users')
 * export class User extends BaseEntity {
 *   id?: number;
 *   name: string;
 *   email: string;
 *
 *   static async findByEmail(email: string): Promise<User | null> {
 *     return await this.findOne({ email });
 *   }
 * }
 *
 * // Usage:
 * const user = new User();
 * user.name = "John";
 * user.email = "john@example.com";
 * await user.save();
 *
 * const found = await User.findById(1);
 * const allUsers = await User.findAll();
 * ```
 */
export class BaseEntity {
  private static dbConnection: DatabaseService;

  /**
   * Initialize the database connection for all entities
   * This should be called once during application startup
   */
  static initializeConnection(db: DatabaseService): void {
    BaseEntity.dbConnection = db;
  }

  /**
   * Get the database connection
   */
  protected static getConnection(): DatabaseService {
    if (!BaseEntity.dbConnection) {
      throw new Error(
        "Database connection not initialized. Call BaseEntity.initializeConnection(db) first."
      );
    }
    return BaseEntity.dbConnection;
  }

  /**
   * Get entity metadata
   */
  protected static getMetadata(): EntityMetadata {
    const metadata = Reflect.getMetadata(ENTITY_METADATA, this);
    if (!metadata) {
      throw new Error(
        `Entity metadata not found. Did you use @Entity() decorator on ${this.name}?`
      );
    }
    return metadata;
  }

  /**
   * Get table name for this entity
   */
  protected static getTableName(): string {
    return this.getMetadata().tableName;
  }

  /**
   * Get primary key field name
   */
  protected static getPrimaryKey(): string {
    return this.getMetadata().primaryKey || "id";
  }

  /**
   * Create a new query builder for this entity
   */
  static query<T extends BaseEntity>(): QueryBuilder<T> {
    const db = this.getConnection();
    const qb = new QueryBuilder<T>(db);
    return qb.table(this.getTableName());
  }

  /**
   * Find all records
   */
  static async findAll<T extends BaseEntity>(this: new () => T): Promise<T[]> {
    const Constructor = this.constructor as typeof BaseEntity;
    const results = await Constructor.query().get();
    return results.map((data) => Object.assign(new this(), data));
  }

  /**
   * Find record by ID
   */
  static async findById<T extends BaseEntity>(
    this: new () => T,
    id: number
  ): Promise<T | null> {
    const Constructor = this.constructor as typeof BaseEntity;
    const primaryKey = Constructor.getPrimaryKey();
    const result = await Constructor.query().where(primaryKey, "=", id).first();
    return result ? Object.assign(new this(), result) : null;
  }

  /**
   * Find one record by conditions
   */
  static async findOne<T extends BaseEntity>(
    this: new () => T,
    conditions: Partial<T>
  ): Promise<T | null> {
    const Constructor = this.constructor as typeof BaseEntity;
    let query = Constructor.query();

    for (const [key, value] of Object.entries(conditions)) {
      query = query.where(key, "=", value);
    }

    const result = await query.first();
    return result ? Object.assign(new this(), result) : null;
  }

  /**
   * Find many records by conditions
   */
  static async findMany<T extends BaseEntity>(
    this: new () => T,
    conditions: Partial<T>
  ): Promise<T[]> {
    const Constructor = this.constructor as typeof BaseEntity;
    let query = Constructor.query();

    for (const [key, value] of Object.entries(conditions)) {
      query = query.where(key, "=", value);
    }

    const results = await query.get();
    return results.map((data) => Object.assign(new this(), data));
  }

  /**
   * Create a new record
   */
  static async create<T extends BaseEntity>(
    this: new () => T,
    data: Partial<T>
  ): Promise<T> {
    const Constructor = this.constructor as typeof BaseEntity;
    const result = await Constructor.query().insert(data);
    return Object.assign(new this(), {
      ...data,
      [Constructor.getPrimaryKey()]: result.id,
    });
  }

  /**
   * Update records by conditions
   */
  static async update<T extends BaseEntity>(
    this: new () => T,
    conditions: Partial<T>,
    data: Partial<T>
  ): Promise<number> {
    const Constructor = this.constructor as typeof BaseEntity;
    let query = Constructor.query();

    for (const [key, value] of Object.entries(conditions)) {
      query = query.where(key, "=", value);
    }

    return await query.update(data);
  }

  /**
   * Delete records by conditions
   */
  static async remove<T extends BaseEntity>(
    this: new () => T,
    conditions: Partial<T>
  ): Promise<number> {
    const Constructor = this.constructor as typeof BaseEntity;
    let query = Constructor.query();

    for (const [key, value] of Object.entries(conditions)) {
      query = query.where(key, "=", value);
    }

    return await query.delete();
  }

  /**
   * Count records
   */
  static async count<T extends BaseEntity>(
    this: new () => T,
    conditions?: Partial<T>
  ): Promise<number> {
    const Constructor = this.constructor as typeof BaseEntity;
    let query = Constructor.query();

    if (conditions) {
      for (const [key, value] of Object.entries(conditions)) {
        query = query.where(key, "=", value);
      }
    }

    return await query.count();
  }

  /**
   * Check if record exists
   */
  static async exists<T extends BaseEntity>(
    this: new () => T,
    conditions: Partial<T>
  ): Promise<boolean> {
    const Constructor = this.constructor as typeof BaseEntity;
    return (await Constructor.count.call(this, conditions)) > 0;
  }

  // Instance methods

  /**
   * Save this entity (insert or update)
   */
  async save(): Promise<this> {
    const Constructor = this.constructor as typeof BaseEntity;
    const primaryKey = Constructor.getPrimaryKey();
    const id = (this as any)[primaryKey];

    const data = { ...this };
    delete (data as any)[primaryKey];

    if (id) {
      // Update existing record
      await Constructor.query().where(primaryKey, "=", id).update(data);
    } else {
      // Insert new record
      const result = await Constructor.query().insert(data);
      (this as any)[primaryKey] = result.id;
    }

    return this;
  }

  /**
   * Delete this entity
   */
  async delete(): Promise<void> {
    const Constructor = this.constructor as typeof BaseEntity;
    const primaryKey = Constructor.getPrimaryKey();
    const id = (this as any)[primaryKey];

    if (!id) {
      throw new Error("Cannot delete entity without ID");
    }

    await Constructor.query().where(primaryKey, "=", id).delete();
  }

  /**
   * Reload this entity from database
   */
  async reload(): Promise<this> {
    const Constructor = this.constructor as typeof BaseEntity;
    const primaryKey = Constructor.getPrimaryKey();
    const id = (this as any)[primaryKey];

    if (!id) {
      throw new Error("Cannot reload entity without ID");
    }

    const result = await Constructor.query().where(primaryKey, "=", id).first();

    if (!result) {
      throw new Error("Entity not found in database");
    }

    return Object.assign(this, result);
  }
}
