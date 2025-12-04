/**
 * Validation Pipe for input validation using class-validator
 */

export interface ValidationError {
  property: string;
  constraints: Record<string, string>;
  children?: ValidationError[];
}

export interface ValidationPipeOptions {
  transform?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  skipMissingProperties?: boolean;
  validationError?: {
    target?: boolean;
    value?: boolean;
  };
}

/**
 * Pipe interface
 */
export interface PipeTransform<T = any, R = any> {
  transform(value: T, metadata: ArgumentMetadata): R | Promise<R>;
}

export interface ArgumentMetadata {
  type: "body" | "query" | "param" | "custom";
  metatype?: any;
  data?: string;
}

/**
 * Built-in validation decorators (lightweight implementation)
 */
export class ValidationService {
  /**
   * Validate if value is a string
   */
  static isString(value: any): boolean {
    return typeof value === "string";
  }

  /**
   * Validate if value is a number
   */
  static isNumber(value: any): boolean {
    return typeof value === "number" && !isNaN(value);
  }

  /**
   * Validate if value is an integer
   */
  static isInt(value: any): boolean {
    return Number.isInteger(value);
  }

  /**
   * Validate if value is a boolean
   */
  static isBoolean(value: any): boolean {
    return typeof value === "boolean";
  }

  /**
   * Validate if value is an email
   */
  static isEmail(value: any): boolean {
    if (typeof value !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Validate if value is a URL
   */
  static isURL(value: any): boolean {
    if (typeof value !== "string") return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate if value is not empty
   */
  static isNotEmpty(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }

  /**
   * Validate string length
   */
  static minLength(value: any, min: number): boolean {
    if (typeof value !== "string") return false;
    return value.length >= min;
  }

  static maxLength(value: any, max: number): boolean {
    if (typeof value !== "string") return false;
    return value.length <= max;
  }

  /**
   * Validate number range
   */
  static min(value: any, min: number): boolean {
    if (typeof value !== "number") return false;
    return value >= min;
  }

  static max(value: any, max: number): boolean {
    if (typeof value !== "number") return false;
    return value <= max;
  }

  /**
   * Validate if value matches pattern
   */
  static matches(value: any, pattern: RegExp): boolean {
    if (typeof value !== "string") return false;
    return pattern.test(value);
  }

  /**
   * Validate if value is in array
   */
  static isIn(value: any, validValues: any[]): boolean {
    return validValues.includes(value);
  }

  /**
   * Validate if value is a date
   */
  static isDate(value: any): boolean {
    if (value instanceof Date) return !isNaN(value.getTime());
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  }

  /**
   * Validate if value is an array
   */
  static isArray(value: any): boolean {
    return Array.isArray(value);
  }

  /**
   * Validate if value is an object
   */
  static isObject(value: any): boolean {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}

/**
 * Validation metadata storage
 */
const VALIDATION_METADATA = Symbol("validation:metadata");

export interface FieldValidation {
  property: string;
  validators: Array<{
    name: string;
    validator: (value: any) => boolean;
    message: string;
    args?: any[];
  }>;
}

/**
 * Store validation metadata for a class property
 */
function addValidation(
  target: any,
  propertyKey: string,
  validator: (value: any) => boolean,
  message: string,
  name: string,
  args?: any[]
): void {
  const validations: FieldValidation[] =
    Reflect.getMetadata(VALIDATION_METADATA, target) || [];

  let fieldValidation = validations.find((v) => v.property === propertyKey);
  if (!fieldValidation) {
    fieldValidation = { property: propertyKey, validators: [] };
    validations.push(fieldValidation);
  }

  fieldValidation.validators.push({ name, validator, message, args });
  Reflect.defineMetadata(VALIDATION_METADATA, validations, target);
}

/**
 * Validation decorators
 */
export function IsString(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      ValidationService.isString,
      message || `${propertyKey} must be a string`,
      "IsString"
    );
  };
}

export function IsNumber(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      ValidationService.isNumber,
      message || `${propertyKey} must be a number`,
      "IsNumber"
    );
  };
}

export function IsInt(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      ValidationService.isInt,
      message || `${propertyKey} must be an integer`,
      "IsInt"
    );
  };
}

export function IsBoolean(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      ValidationService.isBoolean,
      message || `${propertyKey} must be a boolean`,
      "IsBoolean"
    );
  };
}

export function IsEmail(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      ValidationService.isEmail,
      message || `${propertyKey} must be a valid email`,
      "IsEmail"
    );
  };
}

export function IsURL(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      ValidationService.isURL,
      message || `${propertyKey} must be a valid URL`,
      "IsURL"
    );
  };
}

export function IsNotEmpty(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      ValidationService.isNotEmpty,
      message || `${propertyKey} should not be empty`,
      "IsNotEmpty"
    );
  };
}

export function MinLength(min: number, message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      (value) => ValidationService.minLength(value, min),
      message || `${propertyKey} must be at least ${min} characters`,
      "MinLength",
      [min]
    );
  };
}

export function MaxLength(max: number, message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      (value) => ValidationService.maxLength(value, max),
      message || `${propertyKey} must be at most ${max} characters`,
      "MaxLength",
      [max]
    );
  };
}

export function Min(min: number, message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      (value) => ValidationService.min(value, min),
      message || `${propertyKey} must be at least ${min}`,
      "Min",
      [min]
    );
  };
}

export function Max(max: number, message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      (value) => ValidationService.max(value, max),
      message || `${propertyKey} must be at most ${max}`,
      "Max",
      [max]
    );
  };
}

export function Matches(pattern: RegExp, message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      (value) => ValidationService.matches(value, pattern),
      message || `${propertyKey} must match pattern ${pattern}`,
      "Matches",
      [pattern]
    );
  };
}

export function IsIn(validValues: any[], message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      (value) => ValidationService.isIn(value, validValues),
      message || `${propertyKey} must be one of: ${validValues.join(", ")}`,
      "IsIn",
      [validValues]
    );
  };
}

export function IsDate(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      ValidationService.isDate,
      message || `${propertyKey} must be a valid date`,
      "IsDate"
    );
  };
}

export function IsArray(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      ValidationService.isArray,
      message || `${propertyKey} must be an array`,
      "IsArray"
    );
  };
}

export function IsObject(message?: string) {
  return function (target: any, propertyKey: string) {
    addValidation(
      target,
      propertyKey,
      ValidationService.isObject,
      message || `${propertyKey} must be an object`,
      "IsObject"
    );
  };
}

/**
 * Optional decorator - allows undefined/null values
 */
export function IsOptional() {
  return function (target: any, propertyKey: string) {
    // Mark field as optional - will skip validation if undefined/null
    const optionalMetadata =
      Reflect.getMetadata("validation:optional", target) || [];
    optionalMetadata.push(propertyKey);
    Reflect.defineMetadata("validation:optional", optionalMetadata, target);
  };
}

/**
 * Validate an object against its validation decorators
 */
export function validate(object: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const validations: FieldValidation[] =
    Reflect.getMetadata(VALIDATION_METADATA, object) || [];
  const optionalFields: string[] =
    Reflect.getMetadata("validation:optional", object) || [];

  for (const fieldValidation of validations) {
    const value = (object as any)[fieldValidation.property];

    // Skip validation for optional fields if value is undefined/null
    if (
      optionalFields.includes(fieldValidation.property) &&
      (value === undefined || value === null)
    ) {
      continue;
    }

    const constraints: Record<string, string> = {};

    for (const { validator, message, name } of fieldValidation.validators) {
      if (!validator(value)) {
        constraints[name] = message;
      }
    }

    if (Object.keys(constraints).length > 0) {
      errors.push({
        property: fieldValidation.property,
        constraints,
      });
    }
  }

  return errors;
}

/**
 * ValidationPipe - Auto-validate request body, query, params
 */
export class ValidationPipe implements PipeTransform {
  constructor(private options: ValidationPipeOptions = {}) {}

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    // Skip validation if no metatype or it's a primitive type
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    // Create instance of the DTO class
    const object = this.toClass(metadata.metatype, value);

    // Validate the object
    const errors = validate(object);

    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    return this.options.transform ? object : value;
  }

  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private toClass(metatype: any, plain: any): any {
    if (typeof plain !== "object" || plain === null) {
      return plain;
    }

    const instance = new metatype();
    Object.assign(instance, plain);
    return instance;
  }
}

/**
 * Validation Exception
 */
export class ValidationException extends Error {
  constructor(public validationErrors: ValidationError[]) {
    super("Validation failed");
    this.name = "ValidationException";
  }

  getErrors(): ValidationError[] {
    return this.validationErrors;
  }

  toJSON() {
    return {
      statusCode: 400,
      message: "Validation failed",
      errors: this.validationErrors,
    };
  }
}
