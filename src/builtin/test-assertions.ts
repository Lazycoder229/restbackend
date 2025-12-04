/**
 * Test assertion utilities for FynixJS
 */

/**
 * HTTP response assertion helpers
 */
export class ResponseAssertions {
  /**
   * Assert status code
   */
  static expectStatus(actual: number, expected: number): void {
    if (actual !== expected) {
      throw new Error(`Expected status ${expected}, but got ${actual}`);
    }
  }

  /**
   * Assert status is 2xx
   */
  static expectSuccess(status: number): void {
    if (status < 200 || status >= 300) {
      throw new Error(`Expected successful status (2xx), but got ${status}`);
    }
  }

  /**
   * Assert status is 4xx
   */
  static expectClientError(status: number): void {
    if (status < 400 || status >= 500) {
      throw new Error(`Expected client error (4xx), but got ${status}`);
    }
  }

  /**
   * Assert status is 5xx
   */
  static expectServerError(status: number): void {
    if (status < 500 || status >= 600) {
      throw new Error(`Expected server error (5xx), but got ${status}`);
    }
  }

  /**
   * Assert header exists
   */
  static expectHeader(
    headers: Record<string, any>,
    name: string,
    value?: string
  ): void {
    const actualValue = headers[name] || headers[name.toLowerCase()];

    if (actualValue === undefined) {
      throw new Error(`Expected header '${name}' to exist`);
    }

    if (value !== undefined && actualValue !== value) {
      throw new Error(
        `Expected header '${name}' to be '${value}', but got '${actualValue}'`
      );
    }
  }

  /**
   * Assert header does not exist
   */
  static expectNoHeader(headers: Record<string, any>, name: string): void {
    const actualValue = headers[name] || headers[name.toLowerCase()];

    if (actualValue !== undefined) {
      throw new Error(`Expected header '${name}' to not exist`);
    }
  }

  /**
   * Assert content-type
   */
  static expectContentType(
    headers: Record<string, any>,
    expected: string
  ): void {
    const contentType =
      headers["content-type"] || headers["Content-Type"] || "";

    if (!contentType.includes(expected)) {
      throw new Error(
        `Expected content-type to contain '${expected}', but got '${contentType}'`
      );
    }
  }

  /**
   * Assert JSON response
   */
  static expectJson(headers: Record<string, any>): void {
    this.expectContentType(headers, "application/json");
  }

  /**
   * Assert body matches
   */
  static expectBody(actual: any, expected: any): void {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);

    if (actualStr !== expectedStr) {
      throw new Error(`Expected body ${expectedStr}, but got ${actualStr}`);
    }
  }

  /**
   * Assert body contains
   */
  static expectBodyContains(body: any, key: string, value?: any): void {
    if (typeof body !== "object" || body === null) {
      throw new Error("Body is not an object");
    }

    if (!(key in body)) {
      throw new Error(`Expected body to contain key '${key}'`);
    }

    if (value !== undefined && body[key] !== value) {
      throw new Error(
        `Expected body['${key}'] to be ${JSON.stringify(
          value
        )}, but got ${JSON.stringify(body[key])}`
      );
    }
  }

  /**
   * Assert body matches partial
   */
  static expectBodyPartial(actual: any, partial: any): void {
    for (const key in partial) {
      if (actual[key] !== partial[key]) {
        throw new Error(
          `Expected body['${key}'] to be ${JSON.stringify(
            partial[key]
          )}, but got ${JSON.stringify(actual[key])}`
        );
      }
    }
  }

  /**
   * Assert array length
   */
  static expectArrayLength(array: any[], length: number): void {
    if (!Array.isArray(array)) {
      throw new Error("Expected an array");
    }

    if (array.length !== length) {
      throw new Error(
        `Expected array length to be ${length}, but got ${array.length}`
      );
    }
  }

  /**
   * Assert property exists
   */
  static expectProperty(obj: any, property: string): void {
    if (typeof obj !== "object" || obj === null) {
      throw new Error("Expected an object");
    }

    if (!(property in obj)) {
      throw new Error(`Expected property '${property}' to exist`);
    }
  }

  /**
   * Assert property type
   */
  static expectPropertyType(obj: any, property: string, type: string): void {
    this.expectProperty(obj, property);

    const actualType = typeof obj[property];
    if (actualType !== type) {
      throw new Error(
        `Expected property '${property}' to be type '${type}', but got '${actualType}'`
      );
    }
  }
}

/**
 * Fluent assertion builder
 */
export class Expect<T> {
  constructor(private value: T) {}

  /**
   * Assert equality
   */
  toBe(expected: T): this {
    if (this.value !== expected) {
      throw new Error(
        `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(
          this.value
        )}`
      );
    }
    return this;
  }

  /**
   * Assert deep equality
   */
  toEqual(expected: T): this {
    const actualStr = JSON.stringify(this.value);
    const expectedStr = JSON.stringify(expected);

    if (actualStr !== expectedStr) {
      throw new Error(`Expected ${expectedStr}, but got ${actualStr}`);
    }
    return this;
  }

  /**
   * Assert truthy
   */
  toBeTruthy(): this {
    if (!this.value) {
      throw new Error(`Expected truthy value, but got ${this.value}`);
    }
    return this;
  }

  /**
   * Assert falsy
   */
  toBeFalsy(): this {
    if (this.value) {
      throw new Error(`Expected falsy value, but got ${this.value}`);
    }
    return this;
  }

  /**
   * Assert null
   */
  toBeNull(): this {
    if (this.value !== null) {
      throw new Error(`Expected null, but got ${this.value}`);
    }
    return this;
  }

  /**
   * Assert undefined
   */
  toBeUndefined(): this {
    if (this.value !== undefined) {
      throw new Error(`Expected undefined, but got ${this.value}`);
    }
    return this;
  }

  /**
   * Assert defined
   */
  toBeDefined(): this {
    if (this.value === undefined) {
      throw new Error("Expected value to be defined");
    }
    return this;
  }

  /**
   * Assert greater than
   */
  toBeGreaterThan(expected: number): this {
    if (typeof this.value !== "number") {
      throw new Error("Value must be a number");
    }

    if (this.value <= expected) {
      throw new Error(`Expected ${this.value} to be greater than ${expected}`);
    }
    return this;
  }

  /**
   * Assert less than
   */
  toBeLessThan(expected: number): this {
    if (typeof this.value !== "number") {
      throw new Error("Value must be a number");
    }

    if (this.value >= expected) {
      throw new Error(`Expected ${this.value} to be less than ${expected}`);
    }
    return this;
  }

  /**
   * Assert contains
   */
  toContain(item: any): this {
    if (Array.isArray(this.value)) {
      if (!this.value.includes(item)) {
        throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
      }
    } else if (typeof this.value === "string") {
      if (!this.value.includes(item)) {
        throw new Error(`Expected string to contain '${item}'`);
      }
    } else {
      throw new Error("Value must be an array or string");
    }
    return this;
  }

  /**
   * Assert length
   */
  toHaveLength(length: number): this {
    const actual = Array.isArray(this.value)
      ? this.value.length
      : typeof this.value === "string"
      ? this.value.length
      : undefined;

    if (actual === undefined) {
      throw new Error("Value must have a length property");
    }

    if (actual !== length) {
      throw new Error(`Expected length to be ${length}, but got ${actual}`);
    }
    return this;
  }

  /**
   * Assert property exists
   */
  toHaveProperty(property: string, value?: any): this {
    if (typeof this.value !== "object" || this.value === null) {
      throw new Error("Value must be an object");
    }

    if (!(property in this.value)) {
      throw new Error(`Expected property '${property}' to exist`);
    }

    if (value !== undefined && (this.value as any)[property] !== value) {
      throw new Error(
        `Expected property '${property}' to be ${JSON.stringify(
          value
        )}, but got ${JSON.stringify((this.value as any)[property])}`
      );
    }
    return this;
  }

  /**
   * Assert instance of
   */
  toBeInstanceOf(constructor: any): this {
    if (!(this.value instanceof constructor)) {
      throw new Error(
        `Expected instance of ${constructor.name}, but got ${typeof this.value}`
      );
    }
    return this;
  }

  /**
   * Assert throws
   */
  toThrow(expected?: string | RegExp): this {
    if (typeof this.value !== "function") {
      throw new Error("Value must be a function");
    }

    try {
      (this.value as any)();
      throw new Error("Expected function to throw");
    } catch (error: any) {
      if (expected) {
        if (typeof expected === "string") {
          if (!error.message.includes(expected)) {
            throw new Error(
              `Expected error message to contain '${expected}', but got '${error.message}'`
            );
          }
        } else {
          if (!expected.test(error.message)) {
            throw new Error(
              `Expected error message to match ${expected}, but got '${error.message}'`
            );
          }
        }
      }
    }
    return this;
  }
}

/**
 * Create expectation
 */
export function expect<T>(value: T): Expect<T> {
  return new Expect(value);
}

/**
 * Test suite utilities
 */
export interface TestSuite {
  describe: (name: string, fn: () => void) => void;
  it: (name: string, fn: () => void | Promise<void>) => void;
  beforeEach: (fn: () => void | Promise<void>) => void;
  afterEach: (fn: () => void | Promise<void>) => void;
  beforeAll: (fn: () => void | Promise<void>) => void;
  afterAll: (fn: () => void | Promise<void>) => void;
}

/**
 * Export assertion utilities
 */
export const assertions = ResponseAssertions;
