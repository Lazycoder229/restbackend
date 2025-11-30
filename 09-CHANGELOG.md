# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-01

### Added

- **Built-in Hot Reload** 🔥
  - `HotReloadManager` class for automatic file watching
  - `app.enableHotReload()` method to activate in development
  - Configurable options: `watchPaths`, `debounceMs`, `ignore`, `onReload`
  - Uses native Node.js `fs.watch` with recursive monitoring
  - Automatically clears require cache and restarts server on file changes
  - 500ms debounce to handle multiple rapid changes
  - Zero dependencies - built into framework core
  - Watches `.ts`, `.js`, and `.json` files by default
  - Console notifications with emoji indicators

### Changed

- `HotReloadOptions.enabled` is now optional (auto-set by `enableHotReload()`)
- Enhanced developer experience with visual reload feedback

## [1.0.0] - 2025-11-30

### Added

- **Published to npm** as `@restsjsapp/rest`
- **CLI Generator** published as `@restsjsapp/create`
- Performance benchmarks showing 22% faster than Fastify

## [0.1.0] - 2025-11-30

### Added

- **Complete Documentation Suite**

  - `README.md` - Comprehensive framework overview
  - `GETTING_STARTED.md` - Step-by-step tutorial from first app to database
  - `API_REFERENCE.md` - Complete API documentation for all decorators and classes
  - `ORM_GUIDE.md` - QueryBuilder and Repository pattern guide
  - `CREATING_MODULES.md` - Module organization best practices
  - `SECURITY_GUIDE.md` - JWT, password security, guards, and best practices
  - `DEPLOYMENT.md` - Production deployment guide (PM2, Docker, Cloud)
  - `.env.example` - Environment configuration template

- **Testing Framework**

  - Jest configuration with TypeScript support
  - Security service test suite (22 tests covering hashing, JWT, validation)
  - Query builder test suite
  - Test scripts: `npm test`, `npm test:watch`, `npm test:coverage`

- **Global Exception Handler & Logging**

  - `Logger` class with configurable log levels (debug, info, warn, error)
  - `GlobalExceptionFilter` for centralized error handling
  - `LoggingInterceptor` for HTTP request/response logging
  - Integrated into `RestApplication` for automatic error handling
  - Colored console output for better readability

- **Built-in Features** (Previously added, now documented)
  - `DatabaseService` - MySQL2 with connection pooling
  - `SecurityService` - JWT and bcrypt password hashing
  - `JwtAuthGuard` - Route protection with JWT
  - `QueryBuilder` - Fluent SQL query builder
  - `Repository<T>` - Active Record pattern base class
  - `CorsInterceptor` - CORS configuration
  - `SecurityHeadersInterceptor` - Security headers (Helmet-like)
  - `RateLimitInterceptor` - IP-based rate limiting

### Changed

- **TypeScript Strict Mode**

  - Enabled `noImplicitAny: true`
  - Enabled `noUnusedLocals: true`
  - Enabled `noUnusedParameters: true`
  - Enabled `noImplicitReturns: true`
  - Enabled `strictNullChecks: true`
  - Fixed all type safety issues across codebase

- **Package Version**

  - Updated from `1.0.0` to `0.1.0` (pre-release)
  - Indicates framework is feature-complete but needs community testing

- **HttpException Class**

  - Added `statusCode` property for direct access
  - Added optional `details` property for additional error context

- **NestInterceptor Interface**
  - Simplified generic types for better compatibility

### Fixed

- Type safety issues with strict TypeScript settings
- Unused parameter warnings in decorators
- Import cleanup across all files
- Test compatibility with actual API signatures

### Infrastructure

- Jest test runner configured
- TypeScript strict mode enabled
- ESLint-ready codebase (all errors fixed)
- Coverage reporting configured

---

## [Unreleased]

### Planned for 0.2.0

- WebSocket support
- File upload handling
- Request validation decorators
- Middleware system
- MongoDB support
- GraphQL integration
- Microservices support

---

## Project Status

**Current Version**: 0.1.0 (Pre-release)

**Production Readiness**: ✅ Ready for testing and feedback

**What's Complete**:

- ✅ Core framework architecture
- ✅ Dependency injection system
- ✅ Decorator-based API
- ✅ Built-in security features
- ✅ ORM with QueryBuilder
- ✅ Comprehensive documentation
- ✅ Test suite with Jest
- ✅ Global error handling
- ✅ Logging system
- ✅ TypeScript strict mode

**What's Needed**:

- Community testing and feedback
- Performance benchmarks
- More examples and tutorials
- Integration tests
- CI/CD pipeline

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT - See [LICENSE](./LICENSE) for details.
