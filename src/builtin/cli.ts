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
  description =
    "Generate a new controller (Usage: fynix generate:controller User --module=users)";

  async execute(args: string[]): Promise<void> {
    const name = args[0];

    if (!name) {
      console.error("Controller name is required");
      console.log(
        "Usage: fynix generate:controller <name> --module=<module-name>"
      );
      console.log("Example: fynix generate:controller User --module=users");
      process.exit(1);
    }

    // Check for --module flag
    const moduleFlag = args.find((arg) => arg.startsWith("--module="));
    const moduleName = moduleFlag ? moduleFlag.split("=")[1] : null;

    let directory: string;
    let filename: string;
    let filePath: string;
    if (moduleName) {
      // Flat modular: src/modules/products/product.controller.ts
      directory = path.join(process.cwd(), "src", "modules", moduleName);
      filename = `${name.toLowerCase()}.controller.ts`;
      filePath = path.join(directory, filename);
    } else {
      directory = path.join(process.cwd(), "src", "controllers");
      filename = `${name.toLowerCase()}.controller.ts`;
      filePath = path.join(directory, filename);
    }

    const routePath = name.toLowerCase().replace(/controller$/i, "");

    const template = `import { Controller, Get, Post, Put, Delete, Param, Body, Query } from "@fynixjs/fynix";

@Controller('/${routePath}')
export class ${name}Controller {
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
    if (moduleName) {
      console.log(`  Module: ${moduleName}`);
    }
  }
}

/**
 * Generate Service Command
 */
export class GenerateServiceCommand implements CliCommand {
  name = "generate:service";
  description =
    "Generate a new service (Usage: fynix generate:service User --module=users)";

  async execute(args: string[]): Promise<void> {
    const name = args[0];

    if (!name) {
      console.error("Service name is required");
      console.log(
        "Usage: fynix generate:service <name> --module=<module-name>"
      );
      console.log("Example: fynix generate:service User --module=users");
      process.exit(1);
    }

    // Check for --module flag
    const moduleFlag = args.find((arg) => arg.startsWith("--module="));
    const moduleName = moduleFlag ? moduleFlag.split("=")[1] : null;

    let directory: string;
    let filename: string;
    let filePath: string;
    if (moduleName) {
      // Flat modular: src/modules/products/product.service.ts
      directory = path.join(process.cwd(), "src", "modules", moduleName);
      filename = `${name.toLowerCase()}.service.ts`;
      filePath = path.join(directory, filename);
    } else {
      directory = path.join(process.cwd(), "src", "services");
      filename = `${name.toLowerCase()}.service.ts`;
      filePath = path.join(directory, filename);
    }

    const template = `import { Injectable } from "@fynixjs/fynix";

@Injectable()
export class ${name}Service {
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
    if (moduleName) {
      console.log(`  Module: ${moduleName}`);
    }
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

    let directory: string;
    let filename: string;
    let filePath: string;
    if (name) {
      // Flat modular: src/modules/products/product.module.ts
      const moduleFolder = name.replace(/Module$/i, "").toLowerCase();
      directory = path.join(process.cwd(), "src", "modules", moduleFolder);
      filename = `${moduleFolder}.module.ts`;
      filePath = path.join(directory, filename);
    } else {
      directory = path.join(process.cwd(), "src", "modules");
      filename = `module.module.ts`;
      filePath = path.join(directory, filename);
    }

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
 * Generate Entity Command
 */
export class GenerateEntityCommand implements CliCommand {
  name = "generate:entity";
  description =
    "Generate a new entity (Usage: fynix generate:entity User --module=users)";

  async execute(args: string[]): Promise<void> {
    const name = args[0];

    if (!name) {
      console.error("Entity name is required");
      console.log("Usage: fynix generate:entity <name> --module=<module-name>");
      console.log("Example: fynix generate:entity User --module=users");
      process.exit(1);
    }

    // Check for --module flag
    const moduleFlag = args.find((arg) => arg.startsWith("--module="));
    const moduleName = moduleFlag ? moduleFlag.split("=")[1] : null;

    let directory: string;
    let importPath: string;
    let filename: string;
    let filePath: string;
    if (moduleName) {
      // Flat modular: src/modules/products/product.entity.ts
      directory = path.join(process.cwd(), "src", "modules", moduleName);
      importPath = "@fynixjs/fynix";
      filename = `${name.toLowerCase()}.entity.ts`;
      filePath = path.join(directory, filename);
    } else {
      directory = path.join(process.cwd(), "src", "entities");
      importPath = "@fynixjs/fynix";
      filename = `${name.toLowerCase()}.entity.ts`;
      filePath = path.join(directory, filename);
    }

    const tableName =
      name
        .toLowerCase()
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .toLowerCase() + "s";

    const template = `import { Entity, Column, BaseEntity } from "${importPath}";

@Entity('${tableName}')
export class ${name} extends BaseEntity {
  @Column({ type: 'int', primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'timestamp', default: 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
`;

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      console.error(`Entity already exists: ${filename}`);
      process.exit(1);
    }

    fs.writeFileSync(filePath, template);
    console.log(`✓ Created entity: ${filename}`);
    console.log(`  Location: ${filePath}`);
    console.log(`  Table: ${tableName}`);
    if (moduleName) {
      console.log(`  Module: ${moduleName}`);
    }
  }
}

/**
 * Generate Repository Command
 */
export class GenerateRepositoryCommand implements CliCommand {
  name = "generate:repository";
  description =
    "Generate a new repository (Usage: fynix generate:repository User --module=users)";

  async execute(args: string[]): Promise<void> {
    const name = args[0];

    if (!name) {
      console.error("Repository name is required");
      console.log(
        "Usage: fynix generate:repository <name> --module=<module-name>"
      );
      console.log("Example: fynix generate:repository User --module=users");
      process.exit(1);
    }

    // Check for --module flag
    const moduleFlag = args.find((arg) => arg.startsWith("--module="));
    const moduleName = moduleFlag ? moduleFlag.split("=")[1] : null;

    let directory: string;
    let entityImportPath: string;
    let filename: string;
    let filePath: string;
    if (moduleName) {
      // Flat modular: src/modules/products/product.repository.ts
      directory = path.join(process.cwd(), "src", "modules", moduleName);
      entityImportPath = `./${name.toLowerCase()}.entity`;
      filename = `${name.toLowerCase()}.repository.ts`;
      filePath = path.join(directory, filename);
    } else {
      directory = path.join(process.cwd(), "src", "repositories");
      entityImportPath = `../entities/${name}`;
      filename = `${name.toLowerCase()}.repository.ts`;
      filePath = path.join(directory, filename);
    }

    const entityName = name.replace(/Repository$/i, "");

    const template = `import { Repository } from "@fynixjs/fynix";
import { ${entityName} } from "${entityImportPath}";

export class ${name}Repository extends Repository<${entityName}> {
  constructor() {
    super(${entityName});
  }

  // Add custom repository methods here
  async findByName(name: string): Promise<${entityName} | null> {
    return await this.findOne({ where: { name } });
  }

  async findActive(): Promise<${entityName}[]> {
    return await this.findAll({ where: { active: true } });
  }

  async searchByKeyword(keyword: string): Promise<${entityName}[]> {
    const query = \`
      SELECT * FROM \${this.tableName}
      WHERE name LIKE ?
    \`;
    return await this.query(query, [\`%\${keyword}%\`]);
  }
}
`;

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      console.error(`Repository already exists: ${filename}`);
      process.exit(1);
    }

    fs.writeFileSync(filePath, template);
    console.log(`✓ Created repository: ${filename}`);
    console.log(`  Location: ${filePath}`);
    console.log(`  Entity: ${entityName}`);
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
  cli.registerCommand(new GenerateEntityCommand());
  cli.registerCommand(new GenerateRepositoryCommand());

  if (pool) {
    cli.registerCommand(new RunMigrationsCommand(pool));
    cli.registerCommand(new RollbackMigrationsCommand(pool));
    cli.registerCommand(new ResetMigrationsCommand(pool));
    cli.registerCommand(new MigrationStatusCommand(pool));
    cli.registerCommand(new RunSeedersCommand(pool));
  }

  return cli;
}
