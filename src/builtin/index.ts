// Export all built-in features
export { DatabaseService } from "./database.service";
export { SecurityService } from "./security.service";
export { JwtAuthGuard } from "./jwt-auth.guard";
export { CorsInterceptor } from "./cors.interceptor";
export { SecurityHeadersInterceptor } from "./security-headers.interceptor";
export { RateLimitInterceptor } from "./rate-limit.interceptor";
export { StaticFilesInterceptor } from "./static-files.interceptor";
export { QueryBuilder } from "./query-builder";
export { Repository } from "./repository";
export { BaseEntity } from "./base-entity";
export { SchemaSyncService } from "./schema-sync.service";
export {
  Logger,
  GlobalExceptionFilter,
  LoggingInterceptor,
  LoggerOptions,
} from "./logger";

// Validation
export {
  ValidationPipe,
  ValidationService,
  ValidationException,
  validate,
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
  IsEmail,
  IsURL,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  IsIn,
  IsDate,
  IsArray,
  IsObject,
  IsOptional,
} from "./validation.pipe";

// Exception Filters
export {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  MethodNotAllowedException,
  NotAcceptableException,
  RequestTimeoutException,
  ConflictException,
  GoneException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  UnprocessableEntityException,
  TooManyRequestsException,
  InternalServerErrorException,
  NotImplementedException,
  BadGatewayException,
  ServiceUnavailableException,
  GatewayTimeoutException,
  ExceptionFilter,
  Catch,
  HttpExceptionFilter,
  AllExceptionsFilter,
  ExceptionHandler,
} from "./exception.filter";

// File Upload
export {
  FileUploadService,
  FileUploadInterceptor,
  UploadedFile,
  UploadedFiles,
  getFileUploadMetadata,
} from "./file-upload.interceptor";

// Pagination
export {
  PaginationService,
  PaginationInterceptor,
  PaginationPipe,
  PaginationHelper,
  Paginate,
  createPaginatedResponse,
} from "./pagination.service";

// Configuration
export {
  ConfigService,
  createConfig,
  getConfig,
  ConfigProperty,
} from "./config.service";

// Compression
export {
  CompressionInterceptor,
  shouldCompress,
  gzipCompress,
  deflateCompress,
  gzipDecompress,
  deflateDecompress,
} from "./compression.interceptor";

// Transactions (Phase 2)
export {
  Transaction,
  TransactionManager,
  TransactionHelper,
  InjectTransaction,
  getTransactionConnection,
} from "./transaction.service";

// Transform Pipes (Phase 2)
export {
  ParseIntPipe,
  ParseFloatPipe,
  ParseBoolPipe,
  ParseArrayPipe,
  ParseUUIDPipe,
  ParseDatePipe,
  ParseEnumPipe,
  ParseJsonPipe,
  DefaultValuePipe,
  PipeChain,
  chain,
} from "./transform.pipes";

// Security (Phase 3)
export {
  CsrfInterceptor,
  CsrfDoubleSubmitInterceptor,
  generateCsrfToken,
} from "./csrf.interceptor";

export {
  SanitizeHtmlPipe,
  Sanitize,
  SqlSanitizePipe,
  SanitizationService,
  WhitelistPipe,
  BlacklistPipe,
  TrimPipe,
  LowercasePipe,
  UppercasePipe,
} from "./sanitization.pipes";

export {
  ApiKeyGuard,
  ScopedApiKeyGuard,
  ApiKeyService,
  InMemoryApiKeyStore,
} from "./api-key.guard";

export {
  AdvancedRateLimitInterceptor,
  SlidingWindowRateLimiter,
  InMemoryRateLimitStore,
  RedisRateLimitStore,
  createRedisStore,
  createMemoryStore,
} from "./advanced-rate-limit.interceptor";

// Testing (Phase 4)
export {
  Test,
  TestingModule,
  MockRequest,
  MockResponse,
  TestClient,
  createTestClient,
} from "./testing.module";

export {
  DatabaseTestHelper,
  RepositoryTestHelper,
  TestDataFactory,
  createDatabaseTestHelper,
  createRepositoryTestHelper,
  createTestDataFactory,
} from "./database-testing";

export {
  expect,
  Expect,
  assertions,
  ResponseAssertions,
} from "./test-assertions";

// Migrations & Seeders (Phase 5)
export {
  Migration,
  MigrationRunner,
  MigrationLoader,
  MigrationGenerator,
  createMigrationRunner,
} from "./migrations.service";

export {
  Seeder,
  SeederRunner,
  SeederLoader,
  SeederGenerator,
  DatabaseSeeder,
  createSeederRunner,
  createDatabaseSeeder,
} from "./seeders.service";

export {
  OneToOne,
  OneToMany,
  ManyToOne,
  ManyToMany,
  SoftDelete,
  RelationType,
  getRelations,
  usesSoftDelete,
  RelationLoader,
  SoftDeleteHelper,
} from "./relations.decorator";

// API Versioning (Phase 6)
export {
  ApiVersion,
  getApiVersion,
  isVersionDeprecated,
  VersionExtractor,
  VersionManager,
  VersionInterceptor,
  createVersionManager,
  createVersionInterceptor,
} from "./versioning.service";

// OpenAPI/Swagger (Phase 6)
export {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiProperty,
  OpenAPIBuilder,
  SwaggerUI,
  createOpenAPIBuilder,
} from "./openapi.service";

// Documentation (Phase 6)
export {
  DocumentationGenerator,
  createDocumentationGenerator,
} from "./documentation.generator";

// CLI (Phase 6)
export {
  FynixCli,
  createCli,
  GenerateMigrationCommand,
  RunMigrationsCommand,
  RollbackMigrationsCommand,
  ResetMigrationsCommand,
  MigrationStatusCommand,
  GenerateSeederCommand,
  RunSeedersCommand,
  GenerateControllerCommand,
  GenerateServiceCommand,
  GenerateModuleCommand,
  GenerateGuardCommand,
} from "./cli";

// WebSocket & Real-time (Phase 7)
export {
  WebSocketConnection,
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  SSEConnection,
  Sse,
  createWebSocketServer,
} from "./websocket.service";

// Caching (Phase 8)
export {
  CacheStore,
  InMemoryCacheStore,
  RedisCacheStore,
  CacheManager,
  Cache,
  CacheEvict,
  CacheInterceptor,
  ETagGenerator,
  createCacheManager,
  createInMemoryCache,
  createRedisCache,
} from "./cache.service";

// Background Jobs (Phase 9)
export {
  JobQueue,
  JobStatus,
  Job,
  Processor,
  Process,
  CronScheduler,
  Cron,
  createJobQueue,
  createCronScheduler,
} from "./jobs.service";

// OAuth & 2FA (Phase 10)
export {
  OAuth2Server,
  GrantType,
  TwoFactorAuth,
  SocialAuthService,
  SocialProvider,
  createOAuth2Server,
  createSocialAuthService,
} from "./oauth.service";

// Performance & Monitoring (Phase 11)
export {
  PerformanceMonitor,
  PerformanceInterceptor,
  HealthCheckService,
  HealthIndicator,
  DatabaseHealthIndicator,
  DiskSpaceHealthIndicator,
  MemoryHealthIndicator,
  PrometheusExporter,
  ClusterManager,
  createPerformanceMonitor,
  createHealthCheckService,
  createPrometheusExporter,
  createClusterManager,
} from "./performance.service";

// GraphQL (Phase 12)
export {
  Resolver,
  Query,
  Mutation,
  Field,
  Args,
  GraphQLSchemaBuilder,
  GraphQLExecutor,
  GraphQLHandler,
  createGraphQLSchema,
  createGraphQLExecutor,
  createGraphQLHandler,
} from "./graphql.service";
