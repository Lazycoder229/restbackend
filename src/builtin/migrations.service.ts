import { Pool } from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

/**
 * Migration interface
 */
export interface Migration {
  /**
   * Migration name
   */
  name: string;

  /**
   * Timestamp
   */
  timestamp: number;

  /**
   * Up migration
   */
  up(connection: Pool): Promise<void>;

  /**
   * Down migration
   */
  down(connection: Pool): Promise<void>;
}

/**
 * Migration record in database
 */
export interface MigrationRecord {
  id: number;
  name: string;
  batch: number;
  executed_at: Date;
}

/**
 * Migration runner
 */
export class MigrationRunner {
  private tableName = "migrations";

  constructor(private pool: Pool) {}

  /**
   * Initialize migrations table
   */
  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        batch INT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get executed migrations
   */
  async getExecuted(): Promise<MigrationRecord[]> {
    const [rows] = await this.pool.query<any[]>(
      `SELECT * FROM ${this.tableName} ORDER BY executed_at ASC`
    );
    return rows;
  }

  /**
   * Get last batch number
   */
  async getLastBatch(): Promise<number> {
    const [rows] = await this.pool.query<any[]>(
      `SELECT MAX(batch) as batch FROM ${this.tableName}`
    );
    return rows[0]?.batch || 0;
  }

  /**
   * Check if migration is executed
   */
  async isExecuted(name: string): Promise<boolean> {
    const [rows] = await this.pool.query<any[]>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE name = ?`,
      [name]
    );
    return rows[0].count > 0;
  }

  /**
   * Record migration
   */
  async record(name: string, batch: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO ${this.tableName} (name, batch) VALUES (?, ?)`,
      [name, batch]
    );
  }

  /**
   * Remove migration record
   */
  async remove(name: string): Promise<void> {
    await this.pool.query(`DELETE FROM ${this.tableName} WHERE name = ?`, [
      name,
    ]);
  }

  /**
   * Run pending migrations
   */
  async up(migrations: Migration[]): Promise<void> {
    await this.initialize();

    const executed = await this.getExecuted();
    const executedNames = new Set(executed.map((m) => m.name));
    const pending = migrations.filter((m) => !executedNames.has(m.name));

    if (pending.length === 0) {
      console.log("No pending migrations");
      return;
    }

    const batch = (await this.getLastBatch()) + 1;

    console.log(`Running ${pending.length} migration(s)...`);

    for (const migration of pending) {
      console.log(`Migrating: ${migration.name}`);

      const conn = await this.pool.getConnection();
      try {
        await conn.beginTransaction();
        await migration.up(this.pool);
        await this.record(migration.name, batch);
        await conn.commit();
        console.log(`Migrated: ${migration.name}`);
      } catch (error) {
        await conn.rollback();
        console.error(`Failed to migrate ${migration.name}:`, error);
        throw error;
      } finally {
        conn.release();
      }
    }

    console.log(`Batch ${batch} completed successfully`);
  }

  /**
   * Rollback last batch
   */
  async down(migrations: Migration[], steps: number = 1): Promise<void> {
    await this.initialize();

    const executed = await this.getExecuted();
    if (executed.length === 0) {
      console.log("No migrations to rollback");
      return;
    }

    const lastBatch = await this.getLastBatch();
    const toRollback = executed
      .filter((m) => m.batch >= lastBatch - steps + 1)
      .reverse();

    if (toRollback.length === 0) {
      console.log("No migrations to rollback");
      return;
    }

    console.log(`Rolling back ${toRollback.length} migration(s)...`);

    for (const record of toRollback) {
      const migration = migrations.find((m) => m.name === record.name);

      if (!migration) {
        console.warn(`Migration ${record.name} not found, skipping rollback`);
        continue;
      }

      console.log(`Rolling back: ${migration.name}`);

      const conn = await this.pool.getConnection();
      try {
        await conn.beginTransaction();
        await migration.down(this.pool);
        await this.remove(migration.name);
        await conn.commit();
        console.log(`Rolled back: ${migration.name}`);
      } catch (error) {
        await conn.rollback();
        console.error(`Failed to rollback ${migration.name}:`, error);
        throw error;
      } finally {
        conn.release();
      }
    }

    console.log("Rollback completed successfully");
  }

  /**
   * Rollback all migrations
   */
  async reset(migrations: Migration[]): Promise<void> {
    await this.initialize();

    const executed = await this.getExecuted();
    if (executed.length === 0) {
      console.log("No migrations to reset");
      return;
    }

    console.log(`Resetting ${executed.length} migration(s)...`);

    for (const record of executed.reverse()) {
      const migration = migrations.find((m) => m.name === record.name);

      if (!migration) {
        console.warn(`Migration ${record.name} not found, skipping reset`);
        continue;
      }

      console.log(`Resetting: ${migration.name}`);

      const conn = await this.pool.getConnection();
      try {
        await conn.beginTransaction();
        await migration.down(this.pool);
        await this.remove(migration.name);
        await conn.commit();
        console.log(`Reset: ${migration.name}`);
      } catch (error) {
        await conn.rollback();
        console.error(`Failed to reset ${migration.name}:`, error);
        throw error;
      } finally {
        conn.release();
      }
    }

    console.log("Reset completed successfully");
  }

  /**
   * Show migration status
   */
  async status(migrations: Migration[]): Promise<void> {
    await this.initialize();

    const executed = await this.getExecuted();
    const executedNames = new Set(executed.map((m) => m.name));

    console.log("\n=== Migration Status ===\n");

    const pending = migrations.filter((m) => !executedNames.has(m.name));
    const ran = migrations.filter((m) => executedNames.has(m.name));

    if (ran.length > 0) {
      console.log("Executed migrations:");
      for (const migration of ran) {
        const record = executed.find((r) => r.name === migration.name);
        console.log(
          `  ✓ ${migration.name} (batch ${record?.batch}, ${record?.executed_at})`
        );
      }
    }

    if (pending.length > 0) {
      console.log("\nPending migrations:");
      for (const migration of pending) {
        console.log(`  - ${migration.name}`);
      }
    } else {
      console.log("\n✓ All migrations executed");
    }

    console.log();
  }
}

/**
 * Migration file loader
 */
export class MigrationLoader {
  /**
   * Load migrations from directory
   */
  static async load(directory: string): Promise<Migration[]> {
    const migrations: Migration[] = [];

    if (!fs.existsSync(directory)) {
      return migrations;
    }

    const files = fs
      .readdirSync(directory)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".js"))
      .sort();

    for (const file of files) {
      const filePath = path.join(directory, file);
      const module = require(filePath);

      const migration: Migration = {
        name: file.replace(/\.(ts|js)$/, ""),
        timestamp: this.extractTimestamp(file),
        up: module.up,
        down: module.down,
      };

      migrations.push(migration);
    }

    return migrations;
  }

  /**
   * Extract timestamp from filename
   */
  private static extractTimestamp(filename: string): number {
    const match = filename.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

/**
 * Migration generator
 */
export class MigrationGenerator {
  /**
   * Generate migration file
   */
  static generate(name: string, directory: string): string {
    const timestamp = Date.now();
    const filename = `${timestamp}_${name}.ts`;
    const filePath = path.join(directory, filename);

    const template = `import { Pool } from "mysql2/promise";

/**
 * Migration: ${name}
 */
export async function up(connection: Pool): Promise<void> {
  // Add your migration logic here
  await connection.query(\`
    -- Your SQL here
  \`);
}

export async function down(connection: Pool): Promise<void> {
  // Add your rollback logic here
  await connection.query(\`
    -- Your rollback SQL here
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
 * Create migration runner
 */
export function createMigrationRunner(pool: Pool): MigrationRunner {
  return new MigrationRunner(pool);
}
