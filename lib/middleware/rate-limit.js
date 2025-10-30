class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.max = options.max || 100;
    this.message =
      options.message || "Too many requests, please try again later.";
    this.statusCode = options.statusCode || 429;
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.handler = options.handler || this.defaultHandler.bind(this);
    this.skip = options.skip || (() => false);
    this.store = new Map();

    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), this.windowMs);
  }

  defaultHandler(req, res) {
    res.status(this.statusCode).json({
      error: this.message,
      retryAfter: Math.ceil(this.windowMs / 1000),
    });
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now - data.resetTime > this.windowMs) {
        this.store.delete(key);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      if (this.skip(req)) {
        return next();
      }

      const key = this.keyGenerator(req);
      const now = Date.now();
      const record = this.store.get(key);

      if (!record) {
        this.store.set(key, {
          count: 1,
          resetTime: now,
        });
        return next();
      }

      // Reset if window has passed
      if (now - record.resetTime > this.windowMs) {
        record.count = 1;
        record.resetTime = now;
        return next();
      }

      // Increment count
      record.count++;

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", this.max);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, this.max - record.count)
      );
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(record.resetTime + this.windowMs).toISOString()
      );

      // Check if limit exceeded
      if (record.count > this.max) {
        res.setHeader("Retry-After", Math.ceil(this.windowMs / 1000));
        return this.handler(req, res, next);
      }

      next();
    };
  }
}

function rateLimit(options) {
  const limiter = new RateLimiter(options);
  return limiter.middleware();
}

module.exports = rateLimit;
// This module provides a rate limiting middleware for rest.js applications.
// It allows you to limit the number of requests a client can make in a specified time window.
// The `RateLimiter` class manages the rate limiting logic, while the `rateLimit` function returns the middleware function.
// You can customize options like the time window, maximum requests, error messages, and key generation for rate limiting.
// The middleware sets appropriate headers for rate limiting and handles requests that exceed the limit by returning a 429 status code with a retry-after header.
// It also includes a cleanup mechanism to remove old entries from the store periodically.
// This module provides a rate limiting middleware for Express.js applications.
// It allows you to limit the number of requests a client can make in a specified time window.
// The `RateLimiter` class manages the rate limiting logic, while the `rateLimit` function returns the middleware function.
// You can customize options like the time window, maximum requests, error messages, and key generation for rate limiting.
// The middleware sets appropriate headers for rate limiting and handles requests that exceed the limit by returning a 429 status code with a retry-after header.
// It also includes a cleanup mechanism to remove old entries from the store periodically.
