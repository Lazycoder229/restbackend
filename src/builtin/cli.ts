#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { Pool } from "mysql2/promise";

/**
 * CLI Command interface
 */
export interface CliCommand {
  name: string;
  description: string;
  execute(args: string[]): Promise<void>;
}

/**
 * FynixJS CLI
 */
export class FynixCli {
  private commands = new Map<string, CliCommand>();

  /**
   * Register a command
   */
  registerCommand(command: CliCommand): void {
    this.commands.set(command.name, command);
  }

  /**
   * Execute CLI
   */
  async execute(args: string[]): Promise<void> {
    const commandName = args[2];

    if (!commandName || commandName === "help" || commandName === "--help") {
      this.showHelp();
      return;
    }

    const command = this.commands.get(commandName);

    if (!command) {
      console.error(`Unknown command: ${commandName}`);
      console.log('\nRun "fynix help" for available commands');
      process.exit(1);
    }

    try {
      await command.execute(args.slice(3));
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Show help
   */
  private showHelp(): void {
    console.log(`
FynixJS CLI v2.0.0

Usage: fynix <command> [options]

Commands:
`);

    for (const [name, command] of this.commands) {
      console.log(`  ${name.padEnd(30)} ${command.description}`);
    }

    console.log(`
Examples:
  fynix migrate:create CreateUsersTable
  fynix migrate:run
  fynix seed:create UserSeeder
  fynix generate:controller UserController
`);
  }
}

/**
 * Generate Migration Command
 */
export class GenerateMigrationCommand implements CliCommand {
  name = "migrate:create";
  description = "Create a new migration file";

  async execute(args: string[]): Promise<void> {
    const name = args[0];

    if (!name) {
      console.error("Migration name is required");
      console.log("Usage: fynix migrate:create <name>");
      process.exit(1);
    }

    const directory = path.join(process.cwd(), "database", "migrations");
    const timestamp = Date.now();
    const filename = `${timestamp}_${name}.ts`;
    const filePath = path.join(directory, filename);

    const template = `import { Pool } from "mysql2/promise";

/**
 * Migration: ${name}
 */
export async function up(connection: Pool): Promise<void> {
  await connection.query(\`
    -- Your SQL here
    -- Example:
    -- CREATE TABLE users (
    --   id INT PRIMARY KEY AUTO_INCREMENT,
    --   name VARCHAR(255) NOT NULL,
    --   email VARCHAR(255) UNIQUE NOT NULL,
    --   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- );
  \`);
}

export async function down(connection: Pool): Promise<void> {
  await connection.query(\`
    -- Your rollback SQL here
    -- Example:
    -- DROP TABLE IF EXISTS users;
  \`);
}
`;

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(filePath, template);
    console.log(`✓ Created migration: ${filename}`);
    console.log(`  Location: ${filePath}`);
  }
}

/**
 * Run Migrations Command
 */
export class RunMigrationsCommand implements CliCommand {
  name = "migrate:run";
  description = "Run pending migrations";

  constructor(private pool: Pool) {}

  async execute(_args: string[]): Promise<void> {
    const {
      MigrationRunner,
      MigrationLoader,
    } = require("./migrations.service");

    const directory = path.join(process.cwd(), "database", "migrations");
    const migrations = await MigrationLoader.load(directory);
    const runner = new MigrationRunner(this.pool);

    await runner.up(migrations);
  }
}

/**
 * Rollback Migrations Command
 */
export class RollbackMigrationsCommand implements CliCommand {
  name = "migrate:rollback";
  description = "Rollback last migration batch";

  constructor(private pool: Pool) {}

  async execute(args: string[]): Promise<void> {
    const {
      MigrationRunner,
      MigrationLoader,
    } = require("./migrations.service");

    const steps = args[0] ? parseInt(args[0]) : 1;
    const directory = path.join(process.cwd(), "database", "migrations");
    const migrations = await MigrationLoader.load(directory);
    const runner = new MigrationRunner(this.pool);

    await runner.down(migrations, steps);
  }
}

/**
 * Reset Migrations Command
 */
export class ResetMigrationsCommand implements CliCommand {
  name = "migrate:reset";
  description = "Rollback all migrations";

  constructor(private pool: Pool) {}

  async execute(_args: string[]): Promise<void> {
    const {
      MigrationRunner,
      MigrationLoader,
    } = require("./migrations.service");

    const directory = path.join(process.cwd(), "database", "migrations");
    const migrations = await MigrationLoader.load(directory);
    const runner = new MigrationRunner(this.pool);

    await runner.reset(migrations);
  }
}

/**
 * Migration Status Command
 */
export class MigrationStatusCommand implements CliCommand {
  name = "migrate:status";
  description = "Show migration status";

  constructor(private pool: Pool) {}

  async execute(_args: string[]): Promise<void> {
    const {
      MigrationRunner,
      MigrationLoader,
    } = require("./migrations.service");

    const directory = path.join(process.cwd(), "database", "migrations");
    const migrations = await MigrationLoader.load(directory);
    const runner = new MigrationRunner(this.pool);

    await runner.status(migrations);
  }
}

/**
 * Generate Seeder Command
 */
export class GenerateSeederCommand implements CliCommand {
  name = "seed:create";
  description = "Create a new seeder file";

  async execute(args: string[]): Promise<void> {
    const name = args[0];

    if (!name) {
      console.error("Seeder name is required");
      console.log("Usage: fynix seed:create <name>");
      process.exit(1);
    }

    const directory = path.join(process.cwd(), "database", "seeders");
    const filename = `${name}.ts`;
    const filePath = path.join(directory, filename);

    const template = `import { Pool } from "mysql2/promise";

/**
 * Seeder: ${name}
 */
export async function run(connection: Pool): Promise<void> {
  await connection.query(\`
    INSERT INTO your_table (column1, column2) VALUES
    ('value1', 'value2'),
    ('value3', 'value4')
  \`);
  
  console.log('✓ Seeded: ${name}');
}
`;

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      console.error(`Seeder already exists: ${filename}`);
      process.exit(1);
    }

    fs.writeFileSync(filePath, template);
    console.log(`✓ Created seeder: ${filename}`);
    console.log(`  Location: ${filePath}`);
  }
}

/**
 * Run Seeders Command
 */
export class RunSeedersCommand implements CliCommand {
  name = "seed:run";
  description = "Run database seeders";

  constructor(private pool: Pool) {}

  async execute(args: string[]): Promise<void> {
    const { SeederRunner, SeederLoader } = require("./seeders.service");

    const force = args.includes("--force");
    const directory = path.join(process.cwd(), "database", "seeders");
    const seeders = await SeederLoader.load(directory);
    const runner = new SeederRunner(this.pool);

    await runner.run(seeders, force);
  }
}

/**
 * Generate Controller Command
 */
export class GenerateControllerCommand implements CliCommand {
  name = "generate:controller";
  description = "Generate a new controller";

  async execute(args: string[]): Promise<void> {
    const name = args[0];

    if (!name) {
      console.error("Controller name is required");
      console.log("Usage: fynix generate:controller <name>");
      process.exit(1);
    }

    const directory = path.join(process.cwd(), "src", "controllers");
    const filename = `${name}.ts`;
    const filePath = path.join(directory, filename);

    const template = `import { Controller, Get, Post, Put, Delete, Param, Body, Query } from "@fynixjs/fynix";

@Controller('/${name.toLowerCase().replace(/controller$/i, "")}')
export class ${name} {
  @Get('/')
  async index(@Query() query: any) {
    return {
      message: 'List all items',
      query
    };
  }

  @Get('/:id')
  async show(@Param('id') id: string) {
    return {
      message: 'Show item',
      id
    };
  }

  @Post('/')
  async create(@Body() body: any) {
    return {
      message: 'Create item',
      body
    };
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    return {
      message: 'Update item',
      id,
      body
    };
  }

  @Delete('/:id')
  async destroy(@Param('id') id: string) {
    return {
      message: 'Delete item',
      id
    };
  }
}
`;

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      console.error(`Controller already exists: ${filename}`);
      process.exit(1);
    }

    fs.writeFileSync(filePath, template);
    console.log(`✓ Created controller: ${filename}`);
    console.log(`  Location: ${filePath}`);
  }
}

/**
 * Generate Service Command
 */
export class GenerateServiceCommand implements CliCommand {
  name = "generate:service";
  description = "Generate a new service";

  async execute(args: string[]): Promise<void> {
    const name = args[0];

    if (!name) {
      console.error("Service name is required");
      console.log("Usage: fynix generate:service <name>");
      process.exit(1);
    }

    const directory = path.join(process.cwd(), "src", "services");
    const filename = `${name}.ts`;
    const filePath = path.join(directory, filename);

    const template = `import { Injectable } from "@fynixjs/fynix";

@Injectable()
export class ${name} {
  async findAll() {
    // Implement your logic here
    return [];
  }

  async findById(id: string) {
    // Implement your logic here
    return null;
  }

  async create(data: any) {
    // Implement your logic here
    return data;
  }

  async update(id: string, data: any) {
    // Implement your logic here
    return { id, ...data };
  }

  async delete(id: string) {
    // Implement your logic here
    return { deleted: true };
  }
}
`;

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      console.error(`Service already exists: ${filename}`);
      process.exit(1);
    }

    fs.writeFileSync(filePath, template);
    console.log(`✓ Created service: ${filename}`);
    console.log(`  Location: ${filePath}`);
  }
}

/**
 * Generate Module Command
 */
export class GenerateModuleCommand implements CliCommand {
  name = "generate:module";
  description = "Generate a new module";

  async execute(args: string[]): Promise<void> {
    const name = args[0];

    if (!name) {
      console.error("Module name is required");
      console.log("Usage: fynix generate:module <name>");
      process.exit(1);
    }

    const directory = path.join(process.cwd(), "src", "modules");
    const filename = `${name}.module.ts`;
    const filePath = path.join(directory, filename);

    const template = `import { Module } from "@fynixjs/fynix";

@Module({
  controllers: [],
  providers: [],
  imports: [],
  exports: []
})
export class ${name} {}
`;

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      console.error(`Module already exists: ${filename}`);
      process.exit(1);
    }

    fs.writeFileSync(filePath, template);
    console.log(`✓ Created module: ${filename}`);
    console.log(`  Location: ${filePath}`);
  }
}

/**
 * Generate Guard Command
 */
export class GenerateGuardCommand implements CliCommand {
  name = "generate:guard";
  description = "Generate a new guard";

  async execute(args: string[]): Promise<void> {
    const name = args[0];

    if (!name) {
      console.error("Guard name is required");
      console.log("Usage: fynix generate:guard <name>");
      process.exit(1);
    }

    const directory = path.join(process.cwd(), "src", "guards");
    const filename = `${name}.ts`;
    const filePath = path.join(directory, filename);

    const template = `import { Guard } from "@fynixjs/fynix";

export class ${name} implements Guard {
  async canActivate(req: any, res: any): Promise<boolean> {
    // Implement your authorization logic here
    return true;
  }
}
`;

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      console.error(`Guard already exists: ${filename}`);
      process.exit(1);
    }

    fs.writeFileSync(filePath, template);
    console.log(`✓ Created guard: ${filename}`);
    console.log(`  Location: ${filePath}`);
  }
}

/**
 * Create CLI instance
 */
export function createCli(pool?: Pool): FynixCli {
  const cli = new FynixCli();

  // Register commands
  cli.registerCommand(new GenerateMigrationCommand());
  cli.registerCommand(new GenerateSeederCommand());
  cli.registerCommand(new GenerateControllerCommand());
  cli.registerCommand(new GenerateServiceCommand());
  cli.registerCommand(new GenerateModuleCommand());
  cli.registerCommand(new GenerateGuardCommand());

  if (pool) {
    cli.registerCommand(new RunMigrationsCommand(pool));
    cli.registerCommand(new RollbackMigrationsCommand(pool));
    cli.registerCommand(new ResetMigrationsCommand(pool));
    cli.registerCommand(new MigrationStatusCommand(pool));
    cli.registerCommand(new RunSeedersCommand(pool));
  }

  return cli;
}
