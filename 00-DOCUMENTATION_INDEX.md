# RestJS Documentation Index

Complete documentation for the RestJS Framework - organized for easy navigation.

---

## 📖 Documentation Structure

### Getting Started (Read First)

Start here if you're new to RestJS.

**[README.md](./README.md)** - Framework overview, features, and quick start

**[01-GETTING_STARTED.md](./01-GETTING_STARTED.md)** - Step-by-step tutorial

- Installation and setup
- Your first application
- Creating controllers and services
- Using dependency injection
- Basic routing and parameters
- Running your app

---

### Core Concepts (Essential Reading)

**[02-API_REFERENCE.md](./02-API_REFERENCE.md)** - Complete API documentation

- All decorators (@Controller, @Get, @Post, etc.)
- Core classes (RestFactory, RestApplication)
- Built-in services (Logger, SecurityService, QueryBuilder)
- Guards and interceptors reference
- Parameter decorators (@Param, @Body, @Query, etc.)
- Response handling

**[03-CREATING_MODULES.md](./03-CREATING_MODULES.md)** - Modular architecture

- Module system overview
- Creating and organizing modules
- Dependency injection deep dive
- Service providers and scopes
- Module imports and exports
- Best practices for large applications

**[04-ORM_GUIDE.md](./04-ORM_GUIDE.md)** - Database and ORM

- Database connection setup
- Query Builder API
- Repository pattern
- CRUD operations
- Complex queries (joins, aggregations)
- Transactions
- Connection pooling
- Performance tips

---

### Security & Authentication

**[05-SECURITY_GUIDE.md](./05-SECURITY_GUIDE.md)** - Comprehensive security

- JWT authentication setup
- Password hashing with bcrypt
- Security best practices
- XSS and SQL injection prevention
- CORS configuration
- Rate limiting
- Security headers
- Input validation
- Common vulnerabilities and fixes

---

### Deployment & Operations

**[06-DEPLOYMENT.md](./06-DEPLOYMENT.md)** - Production deployment

- Environment configuration
- Building for production
- Deployment platforms (Heroku, AWS, Azure, DigitalOcean)
- Docker containerization
- Process management (PM2)
- Reverse proxy setup (Nginx)
- SSL/TLS configuration
- Health checks and monitoring

**[07-CI_CD_GUIDE.md](./07-CI_CD_GUIDE.md)** - Automation

- GitHub Actions workflows
- Automated testing
- Build and deployment pipelines
- Environment variables management
- Rollback strategies
- Continuous deployment best practices

---

### Advanced Topics

**[10-MIDDLEWARE_INTERCEPTORS.md](./10-MIDDLEWARE_INTERCEPTORS.md)** - Request pipeline

- Guards vs Interceptors
- Built-in guards (JwtAuthGuard)
- Built-in interceptors (CORS, SecurityHeaders, RateLimit)
- Creating custom guards
- Creating custom interceptors
- Execution order and composition
- Error handling in middleware
- Performance considerations
- Common patterns (auth + logging, rate limiting)

**[11-PERFORMANCE.md](./11-PERFORMANCE.md)** - Optimization

- Performance benchmarks vs Fastify/Express
- Built-in optimizations (route caching, handler caching)
- Best practices for high performance
- Database optimization
- Caching strategies (in-memory, response caching, ETags)
- Production optimizations (compression, keep-alive, clustering)
- Monitoring and profiling
- Troubleshooting performance issues
- Performance checklist

---

### Contributing & Updates

**[08-CONTRIBUTING.md](./08-CONTRIBUTING.md)** - How to contribute

- Code of conduct
- Development setup
- Coding standards
- Pull request process
- Testing guidelines
- Documentation contributions

**[09-CHANGELOG.md](./09-CHANGELOG.md)** - Version history

- Release notes
- Breaking changes
- New features
- Bug fixes
- Upgrade guides

---

## 🎯 Learning Paths

### For Beginners

1. [README.md](./README.md) - Overview
2. [01-GETTING_STARTED.md](./01-GETTING_STARTED.md) - First app
3. [03-CREATING_MODULES.md](./03-CREATING_MODULES.md) - Project structure
4. [04-ORM_GUIDE.md](./04-ORM_GUIDE.md) - Database basics
5. [02-API_REFERENCE.md](./02-API_REFERENCE.md) - Reference as needed

### For Security Focus

1. [05-SECURITY_GUIDE.md](./05-SECURITY_GUIDE.md) - Security overview
2. [10-MIDDLEWARE_INTERCEPTORS.md](./10-MIDDLEWARE_INTERCEPTORS.md) - Guards and auth
3. [06-DEPLOYMENT.md](./06-DEPLOYMENT.md) - Secure deployment

### For Performance Focus

1. [11-PERFORMANCE.md](./11-PERFORMANCE.md) - Optimization guide
2. [04-ORM_GUIDE.md](./04-ORM_GUIDE.md) - Database performance
3. [10-MIDDLEWARE_INTERCEPTORS.md](./10-MIDDLEWARE_INTERCEPTORS.md) - Middleware optimization
4. [06-DEPLOYMENT.md](./06-DEPLOYMENT.md) - Production setup

### For Production Deployment

1. [06-DEPLOYMENT.md](./06-DEPLOYMENT.md) - Deployment strategies
2. [07-CI_CD_GUIDE.md](./07-CI_CD_GUIDE.md) - Automation
3. [11-PERFORMANCE.md](./11-PERFORMANCE.md) - Production optimization
4. [05-SECURITY_GUIDE.md](./05-SECURITY_GUIDE.md) - Security hardening

---

## 📚 Feature Coverage

### Decorators

- **Routing**: @Controller, @Get, @Post, @Put, @Delete, @Patch
- **Parameters**: @Param, @Query, @Body, @Headers, @Req, @Res
- **Module System**: @Module, @Injectable
- **Guards**: @UseGuards
- **Interceptors**: @UseInterceptors
- **Validation**: Covered in Security Guide

### Built-in Services

- **Database**: DatabaseService, QueryBuilder
- **Security**: SecurityService, JWT, bcrypt
- **Logging**: Logger
- **Repository**: Repository pattern implementation

### Built-in Guards

- **JwtAuthGuard**: JWT token validation
- Custom guard creation covered

### Built-in Interceptors

- **SecurityHeadersInterceptor**: Security headers
- **CorsInterceptor**: CORS handling
- **RateLimitInterceptor**: Rate limiting
- Custom interceptor creation covered

### Database Features

- **Connection Management**: Connection pooling
- **Query Builder**: Fluent SQL builder
- **Repository Pattern**: Clean data access
- **Transactions**: ACID operations
- **Raw Queries**: Direct SQL when needed

### Security Features

- **JWT**: Token-based authentication
- **Bcrypt**: Password hashing
- **Input Validation**: XSS prevention
- **SQL Injection**: Prepared statements
- **CORS**: Cross-origin configuration
- **Rate Limiting**: Request throttling
- **Security Headers**: Helmet-like protection

### Performance Features

- **Route Caching**: O(1) lookups
- **Handler Caching**: Direct function references
- **Fast Path**: Zero-overhead routes
- **Loop Unrolling**: Optimized parameter extraction
- **Buffer Pooling**: Pre-allocated responses
- **Connection Pooling**: Database optimization

---

## 🔍 Quick Reference

### Common Tasks

| Task                    | Documentation                                                    |
| ----------------------- | ---------------------------------------------------------------- |
| Create a new project    | [01-GETTING_STARTED.md](./01-GETTING_STARTED.md)                 |
| Add JWT authentication  | [05-SECURITY_GUIDE.md](./05-SECURITY_GUIDE.md)                   |
| Create a database query | [04-ORM_GUIDE.md](./04-ORM_GUIDE.md)                             |
| Add CORS support        | [10-MIDDLEWARE_INTERCEPTORS.md](./10-MIDDLEWARE_INTERCEPTORS.md) |
| Deploy to production    | [06-DEPLOYMENT.md](./06-DEPLOYMENT.md)                           |
| Optimize performance    | [11-PERFORMANCE.md](./11-PERFORMANCE.md)                         |
| Create a custom guard   | [10-MIDDLEWARE_INTERCEPTORS.md](./10-MIDDLEWARE_INTERCEPTORS.md) |
| Setup CI/CD             | [07-CI_CD_GUIDE.md](./07-CI_CD_GUIDE.md)                         |
| Find a decorator        | [02-API_REFERENCE.md](./02-API_REFERENCE.md)                     |
| Contribute code         | [08-CONTRIBUTING.md](./08-CONTRIBUTING.md)                       |

### Code Examples by Feature

| Feature            | File                          | Section                   |
| ------------------ | ----------------------------- | ------------------------- |
| Basic controller   | 01-GETTING_STARTED.md         | Your First Application    |
| Service with DI    | 01-GETTING_STARTED.md         | Add a Service             |
| Database queries   | 04-ORM_GUIDE.md               | Query Builder, Repository |
| JWT auth           | 05-SECURITY_GUIDE.md          | JWT Authentication        |
| Custom guard       | 10-MIDDLEWARE_INTERCEPTORS.md | Custom Guards             |
| Custom interceptor | 10-MIDDLEWARE_INTERCEPTORS.md | Custom Interceptors       |
| Docker setup       | 06-DEPLOYMENT.md              | Docker                    |
| Nginx config       | 06-DEPLOYMENT.md              | Reverse Proxy             |
| Caching            | 11-PERFORMANCE.md             | Caching Strategies        |
| Clustering         | 11-PERFORMANCE.md             | Cluster Mode              |

---

## 💡 Tips

- **New to RestJS?** Start with README → 01-GETTING_STARTED → 03-CREATING_MODULES
- **Need a specific decorator?** Check 02-API_REFERENCE.md
- **Building a real app?** Follow: 01 → 03 → 04 → 05 → 06
- **Performance issues?** See 11-PERFORMANCE.md
- **Security concerns?** Read 05-SECURITY_GUIDE.md thoroughly
- **Deployment ready?** 06-DEPLOYMENT.md + 07-CI_CD_GUIDE.md

---

## 🌐 Web Documentation

This documentation is designed to be:

- **Sequential**: Numbered 01-11 for ordered learning
- **Modular**: Each file covers one major topic
- **Cross-referenced**: Internal links between related topics
- **Comprehensive**: Covers all framework features
- **Practical**: Code examples for every feature

Perfect for static site generators like:

- GitBook
- Docusaurus
- VuePress
- MkDocs
- Jekyll

---

## 📞 Support

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Questions and community support
- **Contributing**: See [08-CONTRIBUTING.md](./08-CONTRIBUTING.md)

---

**Last Updated**: November 30, 2025  
**Framework Version**: 0.1.0  
**Documentation Version**: 1.0.0
