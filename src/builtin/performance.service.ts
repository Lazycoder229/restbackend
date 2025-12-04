/**
 * Performance monitoring and health checks
 */

import { IncomingMessage, ServerResponse } from "http";
import * as os from "os";

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  uptime: number;
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private startTime = Date.now();

  /**
   * Track request
   */
  trackRequest(duration: number, error?: boolean): void {
    this.requestCount++;
    if (error) this.errorCount++;
    this.responseTimes.push(duration);

    // Keep only last 1000 requests
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  /**
   * Get metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      averageResponseTime: this.getAverage(),
      minResponseTime: Math.min(...this.responseTimes, Infinity),
      maxResponseTime: Math.max(...this.responseTimes, -Infinity),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get average response time
   */
  private getAverage(): number {
    if (this.responseTimes.length === 0) return 0;
    return (
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
    );
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
  }
}

/**
 * Performance monitoring interceptor
 */
export class PerformanceInterceptor {
  constructor(private monitor: PerformanceMonitor) {}

  async intercept(
    _req: IncomingMessage,
    res: ServerResponse,
    next: () => Promise<any>
  ): Promise<any> {
    const start = Date.now();

    try {
      const result = await next();
      const duration = Date.now() - start;
      this.monitor.trackRequest(duration, false);
      res.setHeader("X-Response-Time", `${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.monitor.trackRequest(duration, true);
      throw error;
    }
  }
}

/**
 * Health indicator
 */
export interface HealthIndicator {
  name: string;
  check(): Promise<{ status: "up" | "down"; details?: any }>;
}

/**
 * Database health indicator
 */
export class DatabaseHealthIndicator implements HealthIndicator {
  name = "database";

  constructor(private pool: any) {}

  async check(): Promise<{ status: "up" | "down"; details?: any }> {
    try {
      await this.pool.query("SELECT 1");
      return { status: "up" };
    } catch (error: any) {
      return {
        status: "down",
        details: { error: error.message },
      };
    }
  }
}

/**
 * Disk space health indicator
 */
export class DiskSpaceHealthIndicator implements HealthIndicator {
  name = "diskSpace";

  constructor(private threshold: number = 0.9) {}

  async check(): Promise<{ status: "up" | "down"; details?: any }> {
    try {
      const fs = require("fs");
      const stats = fs.statfsSync("/");
      const used = stats.blocks - stats.bfree;
      const total = stats.blocks;
      const usedPercent = used / total;

      if (usedPercent > this.threshold) {
        return {
          status: "down",
          details: {
            used: `${(usedPercent * 100).toFixed(2)}%`,
            threshold: `${(this.threshold * 100).toFixed(2)}%`,
          },
        };
      }

      return {
        status: "up",
        details: {
          used: `${(usedPercent * 100).toFixed(2)}%`,
        },
      };
    } catch (error) {
      return { status: "up" }; // Ignore if not available
    }
  }
}

/**
 * Memory health indicator
 */
export class MemoryHealthIndicator implements HealthIndicator {
  name = "memory";

  constructor(private threshold: number = 0.9) {}

  async check(): Promise<{ status: "up" | "down"; details?: any }> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedPercent = usedMem / totalMem;

    if (usedPercent > this.threshold) {
      return {
        status: "down",
        details: {
          used: `${(usedPercent * 100).toFixed(2)}%`,
          threshold: `${(this.threshold * 100).toFixed(2)}%`,
        },
      };
    }

    return {
      status: "up",
      details: {
        used: `${(usedPercent * 100).toFixed(2)}%`,
      },
    };
  }
}

/**
 * Health check service
 */
export class HealthCheckService {
  private indicators: HealthIndicator[] = [];

  /**
   * Register health indicator
   */
  registerIndicator(indicator: HealthIndicator): void {
    this.indicators.push(indicator);
  }

  /**
   * Check health
   */
  async check(): Promise<{
    status: "up" | "down";
    details: Record<string, any>;
  }> {
    const results: Record<string, any> = {};
    let overallStatus: "up" | "down" = "up";

    for (const indicator of this.indicators) {
      const result = await indicator.check();
      results[indicator.name] = result;

      if (result.status === "down") {
        overallStatus = "down";
      }
    }

    return {
      status: overallStatus,
      details: results,
    };
  }
}

/**
 * Prometheus metrics exporter
 */
export class PrometheusExporter {
  private metrics = new Map<string, number>();

  /**
   * Increment counter
   */
  increment(name: string, value: number = 1): void {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  /**
   * Set gauge
   */
  set(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  /**
   * Export metrics in Prometheus format
   */
  export(): string {
    let output = "";

    for (const [name, value] of this.metrics) {
      output += `# TYPE ${name} gauge\n`;
      output += `${name} ${value}\n`;
    }

    return output;
  }

  /**
   * Get metrics as JSON
   */
  toJSON(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

/**
 * Clustering support
 */
export class ClusterManager {
  private workers: any[] = [];

  /**
   * Start cluster with n workers
   */
  start(workerCount?: number): void {
    const cluster = require("cluster");
    const numCPUs = workerCount || os.cpus().length;

    if (cluster.isMaster || cluster.isPrimary) {
      console.log(`Master ${process.pid} is running`);

      for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        this.workers.push(worker);
      }

      cluster.on("exit", (worker: any, _code: number, _signal: string) => {
        console.log(`Worker ${worker.process.pid} died`);
        console.log("Starting a new worker");
        const newWorker = cluster.fork();
        this.workers.push(newWorker);
      });
    }
  }

  /**
   * Check if is master process
   */
  static isMaster(): boolean {
    const cluster = require("cluster");
    return cluster.isMaster || cluster.isPrimary;
  }

  /**
   * Check if is worker process
   */
  static isWorker(): boolean {
    const cluster = require("cluster");
    return cluster.isWorker;
  }

  /**
   * Get worker ID
   */
  static getWorkerId(): number | undefined {
    const cluster = require("cluster");
    return cluster.worker?.id;
  }
}

/**
 * Create performance monitor
 */
export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor();
}

/**
 * Create health check service
 */
export function createHealthCheckService(): HealthCheckService {
  return new HealthCheckService();
}

/**
 * Create Prometheus exporter
 */
export function createPrometheusExporter(): PrometheusExporter {
  return new PrometheusExporter();
}

/**
 * Create cluster manager
 */
export function createClusterManager(): ClusterManager {
  return new ClusterManager();
}
