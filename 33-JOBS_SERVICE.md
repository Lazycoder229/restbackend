# Jobs Service Documentation

## Overview

The JobQueue provides background job processing with priorities, delays, retries, and status tracking for async tasks in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Job Status](#job-status)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { JobQueue, JobStatus } from "./builtin/jobs.service";
```

---

## Basic Usage

### Create Job Queue

```typescript
const emailQueue = new JobQueue("emails");

// Register processor
emailQueue.process("send-email", async (job) => {
  await emailService.send(job.data.to, job.data.subject, job.data.body);
});

// Add job
await emailQueue.add("send-email", {
  to: "user@example.com",
  subject: "Welcome",
  body: "Welcome to our platform!",
});
```

---

## API Reference

### JobQueue

#### `add(name: string, data: T, options?): Promise<Job<T>>`

Add job to queue.

```typescript
await queue.add(
  "process-order",
  { orderId: 123 },
  {
    priority: 10,
    delay: 5000, // Delay 5 seconds
    attempts: 3, // Retry up to 3 times
  }
);
```

#### `process(name: string, processor: JobProcessor<T>): void`

Register job processor.

```typescript
queue.process("send-email", async (job) => {
  console.log("Processing:", job.data);
  // Process job
});
```

---

## Job Status

- `WAITING`: Job is waiting to be processed
- `ACTIVE`: Job is currently being processed
- `COMPLETED`: Job completed successfully
- `FAILED`: Job failed after all retries
- `DELAYED`: Job is delayed

---

## Examples

### Email Queue

```typescript
const emailQueue = new JobQueue("emails");

emailQueue.process("welcome-email", async (job) => {
  await emailService.sendWelcome(job.data.email, job.data.name);
});

emailQueue.process("notification-email", async (job) => {
  await emailService.sendNotification(job.data.userId, job.data.message);
});

// Add jobs
await emailQueue.add("welcome-email", {
  email: "user@example.com",
  name: "John",
});

await emailQueue.add(
  "notification-email",
  {
    userId: 123,
    message: "You have a new message",
  },
  { delay: 60000 }
); // Send after 1 minute
```

### Image Processing Queue

```typescript
const imageQueue = new JobQueue("images");

imageQueue.process("resize", async (job) => {
  const { imagePath, width, height } = job.data;
  await imageService.resize(imagePath, width, height);
});

await imageQueue.add(
  "resize",
  {
    imagePath: "/uploads/photo.jpg",
    width: 800,
    height: 600,
  },
  {
    priority: 5,
    attempts: 2,
  }
);
```

---

## Related Documentation

- [Config Service](./CONFIG_SERVICE.md)
- [Logger](./LOGGER.md)

---

**Last Updated**: December 4, 2025
