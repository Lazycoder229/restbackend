const Layer = require("./layer");
const methods = ["get", "post", "put", "delete", "patch", "options", "head"];

class Router {
  constructor() {
    this.stack = [];
  }

  use(path, ...handlers) {
    // If only middleware function(s) passed, default to "/"
    if (typeof path === "function") {
      handlers = [path, ...handlers];
      path = "/";
    }

    handlers.forEach((handler) => {
      const layer = new Layer(path, handler, { end: false });
      this.stack.push(layer);
    });
  }

  handle(req, res, done) {
    let idx = 0;
    const stack = this.stack;

    const next = (err) => {
      if (idx >= stack.length) {
        return done(err);
      }

      const layer = stack[idx++];

      // Safe fallback: use req.url if req.path is missing
      const path = req.path || req.url;
      const match = layer.match(path);

      if (!match) return next(err);

      // Method check
      if (layer.method && layer.method !== req.method.toLowerCase()) {
        return next(err);
      }

      // Extract params
      req.params = match.params || {};

      try {
        // Handle errors only with 4-arg middleware
        if (err) {
          if (layer.handler.length === 4) {
            return layer.handler(err, req, res, next);
          }
          return next(err);
        }

        // If handler is another router or has `.handle`, treat as sub-router
        if (typeof layer.handler.handle === "function") {
          return layer.handler.handle(req, res, next);
        }

        // Normal middleware or route handler
        if (layer.handler.length < 4) {
          return layer.handler(req, res, next);
        }

        // Skip error middleware when no error
        return next();
      } catch (error) {
        next(error);
      }
    };

    next();
  }
}

// Register all HTTP methods dynamically
methods.forEach((method) => {
  Router.prototype[method] = function (path, ...handlers) {
    handlers.forEach((handler) => {
      const layer = new Layer(path, handler, { end: true, method });
      this.stack.push(layer);
    });
  };
});

module.exports = Router;
