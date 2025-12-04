import { Pool } from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

/**
 * Seeder interface
 */
export interface Seeder {
  /**
   * Seeder name
   */
  name: string;

  /**
   * Run seeder
   */
  run(connection: Pool): Promise<void>;
}

/**
 * Seeder runner
 */
export class SeederRunner {
  private tableName = "seeders";

  constructor(private pool: Pool) {}

  /**
   * Initialize seeders table
   */
  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Check if seeder is executed
   */
  async isExecuted(name: string): Promise<boolean> {
    const [rows] = await this.pool.query<any[]>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE name = ?`,
      [name]
    );
    return rows[0].count > 0;
  }

  /**
   * Record seeder execution
   */
  async record(name: string): Promise<void> {
    await this.pool.query(`INSERT INTO ${this.tableName} (name) VALUES (?)`, [
      name,
    ]);
  }

  /**
   * Run all seeders
   */
  async run(seeders: Seeder[], force: boolean = false): Promise<void> {
    await this.initialize();

    console.log(`Running ${seeders.length} seeder(s)...`);

    for (const seeder of seeders) {
      if (!force && (await this.isExecuted(seeder.name))) {
        console.log(`Skipping: ${seeder.name} (already executed)`);
        continue;
      }

      console.log(`Seeding: ${seeder.name}`);

      const conn = await this.pool.getConnection();
      try {
        await conn.beginTransaction();
        await seeder.run(this.pool);

        if (!force) {
          await this.record(seeder.name);
        }

        await conn.commit();
        console.log(`Seeded: ${seeder.name}`);
      } catch (error) {
        await conn.rollback();
        console.error(`Failed to seed ${seeder.name}:`, error);
        throw error;
      } finally {
        conn.release();
      }
    }

    console.log("Seeding completed successfully");
  }

  /**
   * Run specific seeder
   */
  async runOne(seeder: Seeder, force: boolean = false): Promise<void> {
    await this.initialize();

    if (!force && (await this.isExecuted(seeder.name))) {
      console.log(`${seeder.name} already executed`);
      return;
    }

    console.log(`Seeding: ${seeder.name}`);

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      await seeder.run(this.pool);

      if (!force) {
        await this.record(seeder.name);
      }

      await conn.commit();
      console.log(`Seeded: ${seeder.name}`);
    } catch (error) {
      await conn.rollback();
      console.error(`Failed to seed ${seeder.name}:`, error);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Reset seeders table
   */
  async reset(): Promise<void> {
    await this.initialize();
    await this.pool.query(`TRUNCATE TABLE ${this.tableName}`);
    console.log("Seeders table reset");
  }
}

/**
 * Seeder file loader
 */
export class SeederLoader {
  /**
   * Load seeders from directory
   */
  static async load(directory: string): Promise<Seeder[]> {
    const seeders: Seeder[] = [];

    if (!fs.existsSync(directory)) {
      return seeders;
    }

    const files = fs
      .readdirSync(directory)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".js"))
      .sort();

    for (const file of files) {
      const filePath = path.join(directory, file);
      const module = require(filePath);

      const seeder: Seeder = {
        name: file.replace(/\.(ts|js)$/, ""),
        run: module.run || module.default,
      };

      seeders.push(seeder);
    }

    return seeders;
  }
}

/**
 * Seeder generator
 */
export class SeederGenerator {
  /**
   * Generate seeder file
   */
  static generate(name: string, directory: string): string {
    const filename = `${name}.ts`;
    const filePath = path.join(directory, filename);

    const template = `import { Pool } from "mysql2/promise";

/**
 * Seeder: ${name}
 */
export async function run(connection: Pool): Promise<void> {
  // Add your seeding logic here
  await connection.query(\`
    INSERT INTO your_table (column1, column2) VALUES
    ('value1', 'value2'),
    ('value3', 'value4')
  \`);
}
`;

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(filePath, template);
    return filePath;
  }
}

/**
 * Database seeder helper
 */
export class DatabaseSeeder {
  constructor(private pool: Pool) {}

  /**
   * Insert data
   */
  async insert<T>(tableName: string, data: Partial<T>[]): Promise<void> {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => "?").join(", ");

    for (const row of data) {
      const values = columns.map((col) => (row as any)[col]);
      await this.pool.query(
        `INSERT INTO \`${tableName}\` (${columns.join(
          ", "
        )}) VALUES (${placeholders})`,
        values
      );
    }
  }

  /**
   * Bulk insert data
   */
  async bulkInsert<T>(
    tableName: string,
    data: Partial<T>[],
    batchSize: number = 1000
  ): Promise<void> {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const values = batch.flatMap((row) =>
        columns.map((col) => (row as any)[col])
      );

      const placeholders = batch
        .map(() => `(${columns.map(() => "?").join(", ")})`)
        .join(", ");

      await this.pool.query(
        `INSERT INTO \`${tableName}\` (${columns.join(
          ", "
        )}) VALUES ${placeholders}`,
        values
      );
    }
  }

  /**
   * Truncate table
   */
  async truncate(tableName: string): Promise<void> {
    await this.pool.query(`SET FOREIGN_KEY_CHECKS = 0`);
    await this.pool.query(`TRUNCATE TABLE \`${tableName}\``);
    await this.pool.query(`SET FOREIGN_KEY_CHECKS = 1`);
  }

  /**
   * Generate random data
   */
  generateData<T>(factory: () => Partial<T>, count: number): Partial<T>[] {
    const data: Partial<T>[] = [];

    for (let i = 0; i < count; i++) {
      data.push(factory());
    }

    return data;
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
   * Generate random number
   */
  randomNumber(min: number = 0, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random email
   */
  randomEmail(): string {
    return `${this.randomString(8)}@example.com`;
  }

  /**
   * Generate random date
   */
  randomDate(start?: Date, end?: Date): Date {
    const startTime = start
      ? start.getTime()
      : Date.now() - 365 * 24 * 60 * 60 * 1000;
    const endTime = end ? end.getTime() : Date.now();
    return new Date(startTime + Math.random() * (endTime - startTime));
  }

  /**
   * Pick random from array
   */
  randomFrom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

/**
 * Create seeder runner
 */
export function createSeederRunner(pool: Pool): SeederRunner {
  return new SeederRunner(pool);
}

/**
 * Create database seeder
 */
export function createDatabaseSeeder(pool: Pool): DatabaseSeeder {
  return new DatabaseSeeder(pool);
}
