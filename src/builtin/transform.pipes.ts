/**
 * Transform Pipes - Auto-convert types
 */

import { PipeTransform, ArgumentMetadata } from "./validation.pipe";
import { BadRequestException } from "./exception.filter";

/**
 * ParseIntPipe - Convert string to integer
 */
export class ParseIntPipe implements PipeTransform<string, number> {
  constructor(private options?: { min?: number; max?: number }) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException(
        `Validation failed (numeric string expected) for ${
          metadata.data || metadata.type
        }`
      );
    }

    if (this.options?.min !== undefined && val < this.options.min) {
      throw new BadRequestException(
        `Value must be at least ${this.options.min}`
      );
    }

    if (this.options?.max !== undefined && val > this.options.max) {
      throw new BadRequestException(
        `Value must be at most ${this.options.max}`
      );
    }

    return val;
  }
}

/**
 * ParseFloatPipe - Convert string to float
 */
export class ParseFloatPipe implements PipeTransform<string, number> {
  constructor(private options?: { min?: number; max?: number }) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseFloat(value);

    if (isNaN(val)) {
      throw new BadRequestException(
        `Validation failed (numeric string expected) for ${
          metadata.data || metadata.type
        }`
      );
    }

    if (this.options?.min !== undefined && val < this.options.min) {
      throw new BadRequestException(
        `Value must be at least ${this.options.min}`
      );
    }

    if (this.options?.max !== undefined && val > this.options.max) {
      throw new BadRequestException(
        `Value must be at most ${this.options.max}`
      );
    }

    return val;
  }
}

/**
 * ParseBoolPipe - Convert string to boolean
 */
export class ParseBoolPipe implements PipeTransform<string, boolean> {
  transform(value: string, metadata: ArgumentMetadata): boolean {
    if (value === "true" || value === "1" || value === "yes") {
      return true;
    }

    if (value === "false" || value === "0" || value === "no") {
      return false;
    }

    throw new BadRequestException(
      `Validation failed (boolean string expected) for ${
        metadata.data || metadata.type
      }`
    );
  }
}

/**
 * ParseArrayPipe - Convert string to array
 */
export class ParseArrayPipe implements PipeTransform<string, any[]> {
  constructor(
    private options?: {
      separator?: string;
      items?: "string" | "number" | "boolean";
    }
  ) {}

  transform(value: string, _metadata: ArgumentMetadata): any[] {
    const separator = this.options?.separator || ",";

    if (!value) {
      return [];
    }

    const items = value.split(separator).map((item) => item.trim());

    if (this.options?.items === "number") {
      return items.map((item) => {
        const num = parseFloat(item);
        if (isNaN(num)) {
          throw new BadRequestException(
            `Array contains non-numeric value: ${item}`
          );
        }
        return num;
      });
    }

    if (this.options?.items === "boolean") {
      return items.map((item) => {
        if (item === "true" || item === "1") return true;
        if (item === "false" || item === "0") return false;
        throw new BadRequestException(
          `Array contains non-boolean value: ${item}`
        );
      });
    }

    return items;
  }
}

/**
 * ParseUUIDPipe - Validate and parse UUID
 */
export class ParseUUIDPipe implements PipeTransform<string, string> {
  constructor(private version?: 3 | 4 | 5) {}

  transform(value: string, metadata: ArgumentMetadata): string {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      throw new BadRequestException(
        `Validation failed (uuid expected) for ${
          metadata.data || metadata.type
        }`
      );
    }

    if (this.version) {
      const versionChar = value.charAt(14);
      if (versionChar !== this.version.toString()) {
        throw new BadRequestException(
          `Validation failed (uuid v${this.version} expected)`
        );
      }
    }

    return value.toLowerCase();
  }
}

/**
 * ParseDatePipe - Parse date strings
 */
export class ParseDatePipe implements PipeTransform<string, Date> {
  constructor(private options?: { format?: "iso" | "timestamp" }) {}

  transform(value: string, metadata: ArgumentMetadata): Date {
    if (this.options?.format === "timestamp") {
      const timestamp = parseInt(value, 10);
      if (isNaN(timestamp)) {
        throw new BadRequestException(
          `Validation failed (timestamp expected) for ${
            metadata.data || metadata.type
          }`
        );
      }
      return new Date(timestamp);
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        `Validation failed (date string expected) for ${
          metadata.data || metadata.type
        }`
      );
    }

    return date;
  }
}

/**
 * ParseEnumPipe - Validate enum values
 */
export class ParseEnumPipe<T = any> implements PipeTransform<string, T> {
  constructor(private enumType: any) {}

  transform(value: string, _metadata: ArgumentMetadata): T {
    const enumValues = Object.values(this.enumType);

    if (!enumValues.includes(value)) {
      throw new BadRequestException(
        `Validation failed (value must be one of: ${enumValues.join(", ")})`
      );
    }

    return value as T;
  }
}

/**
 * ParseJsonPipe - Parse JSON string
 */
export class ParseJsonPipe implements PipeTransform<string, any> {
  transform(value: string, metadata: ArgumentMetadata): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new BadRequestException(
        `Validation failed (valid JSON expected) for ${
          metadata.data || metadata.type
        }`
      );
    }
  }
}

/**
 * DefaultValuePipe - Provide default value if undefined
 */
export class DefaultValuePipe<T = any>
  implements PipeTransform<T | undefined, T>
{
  constructor(private defaultValue: T) {}

  transform(value: T | undefined): T {
    return value !== undefined ? value : this.defaultValue;
  }
}

/**
 * Pipe chain - Execute multiple pipes in sequence
 */
export class PipeChain implements PipeTransform {
  constructor(private pipes: PipeTransform[]) {}

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    let result = value;

    for (const pipe of this.pipes) {
      result = await pipe.transform(result, metadata);
    }

    return result;
  }
}

/**
 * Create a pipe chain
 */
export function chain(...pipes: PipeTransform[]): PipeChain {
  return new PipeChain(pipes);
}
