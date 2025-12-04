import { DatabaseService } from "./database.service";
import { Repository } from "./repository";

/**
 * Database test utilities
 */
export class DatabaseTestHelper {
  constructor(private db: DatabaseService) {}

  /**
   * Clear all tables
   */
  async clearAll(): Promise<void> {
    const conn = await this.db.getConnection();
    const [tables] = await conn.query<any[]>("SHOW TABLES");

    // Disable foreign key checks
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of tables) {
      const tableName = Object.values(table)[0] as string;
      await conn.query(`TRUNCATE TABLE \`${tableName}\``);
    }

    // Re-enable foreign key checks
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  /**
   * Clear specific table
   */
  async clearTable(tableName: string): Promise<void> {
    const conn = await this.db.getConnection();
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    await conn.query(`TRUNCATE TABLE \`${tableName}\``);
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  /**
   * Seed data into table
   */
  async seed<T>(tableName: string, data: Partial<T>[]): Promise<void> {
    if (data.length === 0) return;

    const conn = await this.db.getConnection();
    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => "?").join(", ");

    for (const row of data) {
      const values = columns.map((col) => (row as any)[col]);
      await conn.query(
        `INSERT INTO \`${tableName}\` (${columns.join(
          ", "
        )}) VALUES (${placeholders})`,
        values
      );
    }
  }

  /**
   * Count rows in table
   */
  async count(tableName: string, where?: string): Promise<number> {
    const conn = await this.db.getConnection();
    const query = where
      ? `SELECT COUNT(*) as count FROM \`${tableName}\` WHERE ${where}`
      : `SELECT COUNT(*) as count FROM \`${tableName}\``;

    const [rows] = await conn.query<any[]>(query);
    return rows[0].count;
  }

  /**
   * Check if row exists
   */
  async exists(tableName: string, where: string): Promise<boolean> {
    const count = await this.count(tableName, where);
    return count > 0;
  }

  /**
   * Get last inserted ID
   */
  async getLastInsertId(): Promise<number> {
    const conn = await this.db.getConnection();
    const [rows] = await conn.query<any[]>("SELECT LAST_INSERT_ID() as id");
    return rows[0].id;
  }

  /**
   * Execute raw SQL
   */
  async raw(sql: string, params?: any[]): Promise<any> {
    const conn = await this.db.getConnection();
    return conn.query(sql, params);
  }

  /**
   * Begin transaction
   */
  async beginTransaction(): Promise<void> {
    const conn = await this.db.getConnection();
    await conn.beginTransaction();
  }

  /**
   * Commit transaction
   */
  async commit(): Promise<void> {
    const conn = await this.db.getConnection();
    await conn.commit();
  }

  /**
   * Rollback transaction
   */
  async rollback(): Promise<void> {
    const conn = await this.db.getConnection();
    await conn.rollback();
  }

  /**
   * Run in transaction and rollback (for testing)
   */
  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    await this.beginTransaction();
    try {
      const result = await callback();
      await this.rollback(); // Always rollback for tests
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}

/**
 * Repository test helper
 */
export class RepositoryTestHelper<T> {
  constructor(private repository: Repository<T>) {}

  /**
   * Create test fixtures
   */
  async createFixtures(fixtures: Partial<T>[]): Promise<T[]> {
    const created: T[] = [];

    for (const fixture of fixtures) {
      const entity = await this.repository.create(fixture);
      created.push(entity);
    }

    return created;
  }

  /**
   * Create single fixture
   */
  async createFixture(data: Partial<T>): Promise<T> {
    return this.repository.create(data);
  }

  /**
   * Clear all entities
   */
  async clearAll(): Promise<void> {
    const all = await this.repository.findAll();
    for (const entity of all) {
      await this.repository.delete((entity as any).id);
    }
  }

  /**
   * Count all entities
   */
  async count(): Promise<number> {
    const all = await this.repository.findAll();
    return all.length;
  }

  /**
   * Find by criteria
   */
  async findBy(criteria: Partial<T>): Promise<T[]> {
    const all = await this.repository.findAll();
    return all.filter((entity) => {
      return Object.entries(criteria).every(
        ([key, value]) => (entity as any)[key] === value
      );
    });
  }
}

/**
 * Test data factory
 */
export class TestDataFactory {
  private sequences = new Map<string, number>();

  /**
   * Generate sequential number
   */
  sequence(name: string): number {
    const current = this.sequences.get(name) || 0;
    const next = current + 1;
    this.sequences.set(name, next);
    return next;
  }

  /**
   * Generate random string
   */
  randomString(length: number = 10): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random email
   */
  randomEmail(): string {
    return `${this.randomString(8)}@test.com`;
  }

  /**
   * Generate random number
   */
  randomNumber(min: number = 0, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random boolean
   */
  randomBoolean(): boolean {
    return Math.random() >= 0.5;
  }

  /**
   * Pick random from array
   */
  randomFrom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate fake date
   */
  randomDate(start?: Date, end?: Date): Date {
    const startTime = start
      ? start.getTime()
      : Date.now() - 365 * 24 * 60 * 60 * 1000;
    const endTime = end ? end.getTime() : Date.now();
    return new Date(startTime + Math.random() * (endTime - startTime));
  }

  /**
   * Reset sequences
   */
  reset(): void {
    this.sequences.clear();
  }
}

/**
 * Create database test helper
 */
export function createDatabaseTestHelper(
  db: DatabaseService
): DatabaseTestHelper {
  return new DatabaseTestHelper(db);
}

/**
 * Create repository test helper
 */
export function createRepositoryTestHelper<T>(
  repository: Repository<T>
): RepositoryTestHelper<T> {
  return new RepositoryTestHelper(repository);
}

/**
 * Create test data factory
 */
export function createTestDataFactory(): TestDataFactory {
  return new TestDataFactory();
}
