// Core exports
export { RestFactory } from "./core/rest-factory";
export { RestApplication } from "./core/rest-application";
export { Container } from "./core/container";
export { ModuleContainer } from "./core/module-container";
export { HotReloadOptions } from "./core/hot-reload";

// Decorators
export { Controller } from "./decorators/controller.decorator";
export {
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Options,
  Head,
} from "./decorators/http-methods.decorator";
export { Injectable } from "./decorators/injectable.decorator";
export { Module } from "./decorators/module.decorator";
export {
  Param,
  Query,
  Body,
  Headers,
  Req,
  Res,
} from "./decorators/params.decorator";
export { UseGuards } from "./decorators/guards.decorator";
export { UseInterceptors } from "./decorators/interceptors.decorator";
export { UsePipes } from "./decorators/pipes.decorator";

// Interfaces and Common
export * from "./common/interfaces";

// Export built-in features
export {
  DatabaseService,
  SecurityService,
  JwtAuthGuard,
  CorsInterceptor,
  SecurityHeadersInterceptor,
  RateLimitInterceptor,
  QueryBuilder,
  Repository,
  Logger,
  GlobalExceptionFilter,
  LoggingInterceptor,
} from "./builtin";

// Metadata
export { Scope } from "./core/metadata";
