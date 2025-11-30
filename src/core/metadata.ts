import "reflect-metadata";

// Metadata keys
export const CONTROLLER_METADATA = "controller:path";
export const ROUTE_METADATA = "route:metadata";
export const INJECTABLE_METADATA = "injectable:metadata";
export const MODULE_METADATA = "module:metadata";
export const PARAM_METADATA = "param:metadata";
export const GUARDS_METADATA = "guards:metadata";
export const INTERCEPTORS_METADATA = "interceptors:metadata";
export const PIPES_METADATA = "pipes:metadata";
export const ENTITY_METADATA = "entity:metadata";

// HTTP Methods
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

// Route metadata interface
export interface RouteMetadata {
  path: string;
  method: HttpMethod;
  methodName: string;
}

// Parameter metadata interface
export interface ParameterMetadata {
  index: number;
  type: "param" | "query" | "body" | "headers" | "req" | "res";
  data?: string;
}

// Module metadata interface
export interface ModuleMetadata {
  imports?: any[];
  controllers?: any[];
  providers?: any[];
  exports?: any[];
}

// Scope types
export enum Scope {
  DEFAULT = "DEFAULT",
  TRANSIENT = "TRANSIENT",
  REQUEST = "REQUEST",
}

// Provider metadata interface
export interface ProviderMetadata {
  scope?: Scope;
}
