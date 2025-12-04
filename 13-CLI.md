# CLI Documentation

## Overview

The Fynix CLI provides command-line tools for scaffolding, code generation, database operations, and project management in Fynix applications.

## Table of Contents

- [Installation](#installation)
- [Commands](#commands)
- [Examples](#examples)

---

## Installation

```bash
npm install -g fynix-cli
```

---

## Commands

### Code Generation

```bash
fynix generate:controller <name>      # Generate controller
fynix generate:service <name>         # Generate service
fynix generate:module <name>          # Generate module
fynix generate:entity <name>          # Generate entity
fynix generate:repository <name>      # Generate repository
fynix generate:guard <name>           # Generate guard
```

### Database Commands

```bash
fynix migrate:create <name>           # Create migration
fynix migrate:run                     # Run migrations
fynix migrate:rollback [steps]        # Rollback migrations
fynix migrate:reset                   # Reset all migrations
fynix migrate:status                  # Show migration status
fynix seed:create <name>              # Create seeder
fynix seed:run [--force]              # Run seeders
```

### Complete Example (Modular Structure)

```bash
# Create complete Users module
fynix generate:entity User --module=users
fynix generate:repository User --module=users
fynix generate:service User --module=users
fynix generate:controller User --module=users

# Result structure:
# src/
#   modules/
#     users/
#       entities/
#         user.entity.ts
#       repositories/
#         user.repository.ts
#       services/
#         user.service.ts
#       controllers/
#         user.controller.ts

# Create migration for the entity
fynix migrate:create CreateUsersTable
fynix migrate:run

# Seed data
fynix seed:create UserSeeder
fynix seed:run
```

---

## Examples

### Create New Project

```bash
fynix new my-api
cd my-api
npm install
fynix start:dev
```

### Generate Resources (Modular Approach)

```bash
# Generate entity in module
fynix generate:entity User --module=users
# Creates: src/modules/users/entities/user.entity.ts

# Generate repository in module
fynix generate:repository User --module=users
# Creates: src/modules/users/repositories/user.repository.ts

# Generate service in module
fynix generate:service User --module=users
# Creates: src/modules/users/services/user.service.ts

# Generate controller in module
fynix generate:controller User --module=users
# Creates: src/modules/users/controllers/user.controller.ts

# Generate module
fynix generate:module UsersModule
# Creates: src/modules/UsersModule.module.ts

# Generate guard (shared)
fynix generate:guard AuthGuard
# Creates: src/guards/AuthGuard.ts
```

### Traditional Structure (Without --module flag)

```bash
# Without --module flag, files go to traditional structure
fynix generate:entity User
# Creates: src/entities/user.entity.ts

fynix generate:repository User
# Creates: src/repositories/user.repository.ts

fynix generate:service User
# Creates: src/services/user.service.ts

fynix generate:controller User
# Creates: src/controllers/user.controller.ts
```

### Database Operations

```bash
# Create and run migration
fynix migrate:create CreateUsersTable
fynix migrate:run

# Check migration status
fynix migrate:status

# Rollback migrations
fynix migrate:rollback        # Rollback 1 batch
fynix migrate:rollback 2      # Rollback 2 batches
fynix migrate:reset           # Rollback all

# Create and run seeder
fynix seed:create UserSeeder
fynix seed:run
fynix seed:run --force        # Force re-run seeders
```

### Development Workflow

```bash
# Start development server
fynix start:dev

# Run tests
fynix test

# Build for production
fynix build
fynix start:prod
```

---

## Related Documentation

- [Migrations Service](./MIGRATIONS_SERVICE.md)
- [Seeders Service](./SEEDERS_SERVICE.md)
- [Documentation Generator](./DOCUMENTATION_GENERATOR.md)

---

**Last Updated**: December 4, 2025
fynix migrate:create <name> # Create migration
fynix migrate:run # Run migrations
fynix migrate:rollback # Rollback migration
fynix migrate:reset # Reset all migrations
fynix migrate:status # Show migration status
fynix seed:create <name> # Create seeder
fynix seed:run # Run seeders
fynix generate:controller <name> # Generate controller
fynix generate:service <name> # Generate service
fynix generate:module <name> # Generate module
fynix generate:guard <name> # Generate guard
