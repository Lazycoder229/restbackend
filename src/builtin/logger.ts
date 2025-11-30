import { HttpException } from "../common/interfaces";

export interface LoggerOptions {
  level?: "debug" | "info" | "warn" | "error";
  timestamp?: boolean;
  colorize?: boolean;
}

export class Logger {
  private options: LoggerOptions;
  private context: string;

  constructor(context: string = "Application", options: LoggerOptions = {}) {
    this.context = context;
    this.options = {
      level: options.level || "info",
      timestamp: options.timestamp !== false,
      colorize: options.colorize !== false,
    };
  }

  private shouldLog(level: string): boolean {
    const levels = ["debug", "info", "warn", "error"];
    const currentLevel = levels.indexOf(this.options.level!);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= currentLevel;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = this.options.timestamp ? new Date().toISOString() : null;
    const color = this.getColor(level);
    const reset = "\x1b[0m";

    let formatted = "";

    if (this.options.colorize) {
      formatted += color;
    }

    if (timestamp) {
      formatted += `[${timestamp}] `;
    }

    formatted += `[${level.toUpperCase()}] `;
    formatted += `[${this.context}] `;
    formatted += message;

    if (this.options.colorize) {
      formatted += reset;
    }

    if (meta) {
      formatted += "\n" + JSON.stringify(meta, null, 2);
    }

    return formatted;
  }

  private getColor(level: string): string {
    const colors: Record<string, string> = {
      debug: "\x1b[36m", // Cyan
      info: "\x1b[32m", // Green
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
    };
    return colors[level] || "\x1b[0m";
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog("error")) {
      const meta =
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              ...(error as any),
            }
          : error;

      console.error(this.formatMessage("error", message, meta));
    }
  }

  log(message: string, meta?: any): void {
    this.info(message, meta);
  }
}

export class GlobalExceptionFilter {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("ExceptionFilter");
  }

  catch(error: Error | HttpException, req: any, res: any): void {
    let statusCode = 500;
    let message = "Internal server error";
    let details: any = undefined;

    if (this.isHttpException(error)) {
      statusCode = error.statusCode;
      message = error.message;
      details = error.details;
    } else if (error instanceof Error) {
      message = error.message;
      this.logger.error("Unhandled exception", error);
    }

    const response = {
      statusCode,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method,
    };

    // Don't expose internal errors in production
    if (
      process.env.NODE_ENV === "production" &&
      statusCode === 500 &&
      !(error as any).statusCode
    ) {
      response.message = "Internal server error";
    }

    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response));
  }

  private isHttpException(error: any): error is HttpException {
    return error && typeof error.statusCode === "number";
  }
}

export class LoggingInterceptor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("HTTP");
  }

  intercept(context: any, next: () => void): void {
    const req = context.req;
    const res = context.res;
    const start = Date.now();

    this.logger.info(`Incoming request: ${req.method} ${req.url}`, {
      ip: req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    const originalEnd = res.end;
    res.end = (...args: any[]) => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;
      const statusColor =
        statusCode >= 500
          ? "\x1b[31m" // Red
          : statusCode >= 400
          ? "\x1b[33m" // Yellow
          : "\x1b[32m"; // Green
      const reset = "\x1b[0m";

      this.logger.info(
        `Response: ${req.method} ${req.url} ${statusColor}${statusCode}${reset} - ${duration}ms`
      );

      return originalEnd.apply(res, args);
    };

    next();
  }
}
