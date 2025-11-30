import "reflect-metadata";
import { PARAM_METADATA, ParameterMetadata } from "../core/metadata";

/**
 * Helper to create parameter decorators
 */
function createParamDecorator(type: ParameterMetadata["type"]) {
  return (data?: string): ParameterDecorator => {
    return (target, propertyKey, parameterIndex) => {
      const params: ParameterMetadata[] =
        Reflect.getMetadata(
          PARAM_METADATA,
          target.constructor,
          propertyKey as string
        ) || [];

      params.push({
        index: parameterIndex,
        type,
        data,
      });

      Reflect.defineMetadata(
        PARAM_METADATA,
        params,
        target.constructor,
        propertyKey as string
      );
    };
  };
}

// Parameter decorators
export const Param = createParamDecorator("param");
export const Query = createParamDecorator("query");
export const Body = createParamDecorator("body");
export const Headers = createParamDecorator("headers");
export const Req = createParamDecorator("req");
export const Res = createParamDecorator("res");
