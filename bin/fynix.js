#!/usr/bin/env node

/**
 * FynixJS CLI Entry Point
 */

const { createCli } = require("./dist/builtin/cli");

async function main() {
  try {
    // Check if database pool is needed (for migration/seed commands)
    const needsDb = [
      "migrate:run",
      "migrate:rollback",
      "migrate:reset",
      "migrate:status",
      "seed:run",
    ].includes(process.argv[2]);

    let pool;

    if (needsDb) {
      // Try to load database config
      try {
        const { DatabaseService } = require("./dist/builtin/database.service");
        const dbService = new DatabaseService({
          host: process.env.DB_HOST || "localhost",
          port: parseInt(process.env.DB_PORT || "3306"),
          user: process.env.DB_USER || "root",
          password: process.env.DB_PASSWORD || "",
          database: process.env.DB_NAME || "fynix_db",
        });
        pool = await dbService.getConnection();
      } catch (error) {
        console.error(
          "Database connection required. Please set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME environment variables."
        );
        process.exit(1);
      }
    }

    const cli = createCli(pool);
    await cli.execute(process.argv);

    if (pool) {
      await pool.end();
    }
  } catch (error) {
    console.error("CLI Error:", error.message);
    process.exit(1);
  }
}

main();
