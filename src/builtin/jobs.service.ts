/**
 * Job queue system for background tasks
 */

/**
 * Job status
 */
export enum JobStatus {
  WAITING = "waiting",
  ACTIVE = "active",
  COMPLETED = "completed",
  FAILED = "failed",
  DELAYED = "delayed",
}

/**
 * Job interface
 */
export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  priority: number;
  delay: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

/**
 * Job processor function
 */
export type JobProcessor<T = any> = (job: Job<T>) => Promise<void>;

/**
 * Job queue
 */
export class JobQueue<T = any> {
  private jobs = new Map<string, Job<T>>();
  private processors = new Map<string, JobProcessor<T>>();
  private processing = false;

  constructor(private name: string) {}

  /**
   * Add job to queue
   */
  async add(
    name: string,
    data: T,
    options: {
      priority?: number;
      delay?: number;
      attempts?: number;
    } = {}
  ): Promise<Job<T>> {
    const job: Job<T> = {
      id: this.generateId(),
      name,
      data,
      status: options.delay ? JobStatus.DELAYED : JobStatus.WAITING,
      attempts: 0,
      maxAttempts: options.attempts || 3,
      priority: options.priority || 0,
      delay: options.delay || 0,
      createdAt: new Date(),
    };

    this.jobs.set(job.id, job);

    if (options.delay) {
      setTimeout(() => {
        const j = this.jobs.get(job.id);
        if (j && j.status === JobStatus.DELAYED) {
          j.status = JobStatus.WAITING;
        }
        this.process();
      }, options.delay);
    } else {
      this.process();
    }

    return job;
  }

  /**
   * Register job processor
   */
  process(name: string, processor: JobProcessor<T>): void;
  process(): void;
  process(
    nameOrProcessor?: string | JobProcessor<T>,
    processor?: JobProcessor<T>
  ): void {
    if (typeof nameOrProcessor === "string" && processor) {
      this.processors.set(nameOrProcessor, processor);
      return;
    }

    if (this.processing) return;
    this.processing = true;

    setImmediate(() => this.processNextJob());
  }

  /**
   * Process next job
   */
  private async processNextJob(): Promise<void> {
    const job = this.getNextJob();

    if (!job) {
      this.processing = false;
      return;
    }

    const processor = this.processors.get(job.name);

    if (!processor) {
      console.error(`No processor for job: ${job.name}`);
      this.processing = false;
      return;
    }

    job.status = JobStatus.ACTIVE;
    job.processedAt = new Date();
    job.attempts++;

    try {
      await processor(job);
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      this.jobs.delete(job.id);
    } catch (error: any) {
      job.error = error.message;

      if (job.attempts >= job.maxAttempts) {
        job.status = JobStatus.FAILED;
        job.failedAt = new Date();
      } else {
        job.status = JobStatus.WAITING;
      }
    }

    this.processing = false;
    this.process();
  }

  /**
   * Get next job
   */
  private getNextJob(): Job<T> | undefined {
    const waiting = Array.from(this.jobs.values())
      .filter((j) => j.status === JobStatus.WAITING)
      .sort((a, b) => b.priority - a.priority);

    return waiting[0];
  }

  /**
   * Get job by ID
   */
  getJob(id: string): Job<T> | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      waiting: jobs.filter((j) => j.status === JobStatus.WAITING).length,
      active: jobs.filter((j) => j.status === JobStatus.ACTIVE).length,
      completed: jobs.filter((j) => j.status === JobStatus.COMPLETED).length,
      failed: jobs.filter((j) => j.status === JobStatus.FAILED).length,
      delayed: jobs.filter((j) => j.status === JobStatus.DELAYED).length,
    };
  }

  /**
   * Generate job ID
   */
  private generateId(): string {
    return `${this.name}:${Date.now()}:${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
}

/**
 * Processor decorator
 */
export const PROCESSOR_METADATA = Symbol("processor");

export function Processor(queueName: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(PROCESSOR_METADATA, queueName, target);
  };
}

/**
 * Process decorator
 */
export const PROCESS_METADATA = Symbol("process");

export function Process(jobName: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const processes =
      Reflect.getMetadata(PROCESS_METADATA, target.constructor) || [];
    processes.push({ jobName, handler: propertyKey });
    Reflect.defineMetadata(PROCESS_METADATA, processes, target.constructor);
  };
}

/**
 * Cron job scheduler
 */
export class CronScheduler {
  private jobs = new Map<
    string,
    { pattern: string; handler: () => Promise<void>; timer?: NodeJS.Timeout }
  >();

  /**
   * Schedule cron job
   */
  schedule(name: string, pattern: string, handler: () => Promise<void>): void {
    const interval = this.parsePattern(pattern);

    const timer = setInterval(async () => {
      try {
        await handler();
      } catch (error) {
        console.error(`Cron job ${name} failed:`, error);
      }
    }, interval);

    this.jobs.set(name, { pattern, handler, timer });
  }

  /**
   * Cancel cron job
   */
  cancel(name: string): void {
    const job = this.jobs.get(name);
    if (job?.timer) {
      clearInterval(job.timer);
      this.jobs.delete(name);
    }
  }

  /**
   * Parse cron pattern (simplified)
   */
  private parsePattern(pattern: string): number {
    // Simplified: support seconds only for now
    // Format: "*/5 * * * * *" = every 5 seconds
    const parts = pattern.split(" ");

    if (parts[0].startsWith("*/")) {
      const seconds = parseInt(parts[0].substring(2));
      return seconds * 1000;
    }

    // Default to 1 minute
    return 60000;
  }

  /**
   * Get all scheduled jobs
   */
  getJobs() {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      pattern: job.pattern,
    }));
  }
}

/**
 * Cron decorator
 *
 * @example
 * ```typescript
 * class TasksService {
 *   @Cron('* /5 * * * *') // Every 5 minutes
 *   async cleanupOldData() {
 *     // Cleanup logic
 *   }
 * }
 * ```
 */
export const CRON_METADATA = Symbol("cron");

export function Cron(pattern: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const crons = Reflect.getMetadata(CRON_METADATA, target.constructor) || [];
    crons.push({ pattern, handler: propertyKey });
    Reflect.defineMetadata(CRON_METADATA, crons, target.constructor);
  };
}

/**
 * Create job queue
 */
export function createJobQueue<T = any>(name: string): JobQueue<T> {
  return new JobQueue<T>(name);
}

/**
 * Create cron scheduler
 */
export function createCronScheduler(): CronScheduler {
  return new CronScheduler();
}
