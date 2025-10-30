const http = require("http");
const Router = require("./router");
const ViewCache = require("./view-cache");

/**
 * Application class
 * Provides a structure similar to Express.js for handling HTTP requests and responses.
 * Includes route handling, middleware management, and response helpers.
 */
class Application {
  constructor() {
    // Stores app-wide configuration settings
    this.settings = {};
    // Stores registered template engines
    this.engines = {};
    // Router instance for handling routes and middleware
    this._router = new Router();
    // View cache for template caching, enabled in production mode
    this.viewCache = new ViewCache({
      enabled: process.env.NODE_ENV === "production",
    });
  }

  /**
   * Starts the HTTP server and listens on the specified port.
   * Extends the request and response objects with helper methods.
   */
  listen(port, callback) {
    const server = http.createServer((req, res) => {
      const url = require("url");

      // ===== REQUEST EXTENSIONS =====

      // Parses and caches query parameters from the URL
      Object.defineProperty(req, "query", {
        get() {
          if (!this._query) {
            const parsed = url.parse(this.url, true);
            this._query = parsed.query;
          }
          return this._query;
        },
      });

      // Returns the path portion of the request URL
      Object.defineProperty(req, "path", {
        get() {
          return url.parse(this.url).pathname;
        },
      });

      // Returns the IP address of the client
      Object.defineProperty(req, "ip", {
        get() {
          return this.socket?.remoteAddress || "127.0.0.1";
        },
      });

      // Returns the hostname from the Host header
      Object.defineProperty(req, "hostname", {
        get() {
          return this.headers?.host?.split(":")[0] || "localhost";
        },
      });

      // Retrieves a specific header field
      req.get = function (field) {
        if (!this.headers) return undefined;
        const header = field.toLowerCase();
        switch (header) {
          case "referer":
          case "referrer":
            return this.headers.referer || this.headers.referrer;
          default:
            return this.headers[header];
        }
      };

      // Retrieves a parameter value from params, query, or body
      req.param = function (name, defaultValue) {
        return (
          this.params?.[name] ||
          this.query?.[name] ||
          this.body?.[name] ||
          defaultValue
        );
      };

      // ===== RESPONSE EXTENSIONS =====

      // Sets the HTTP status code
      res.status = function (code) {
        this.statusCode = code;
        return this;
      };

      // Sends a response body (automatically sets JSON if object)
      res.send = function (body) {
        if (typeof body === "object") {
          return this.json(body);
        }
        if (!this.getHeader("Content-Type")) {
          this.setHeader("Content-Type", "text/html");
        }
        this.end(body);
        return this;
      };

      // Sends a JSON response
      res.json = function (obj) {
        if (!this.getHeader("Content-Type")) {
          this.setHeader("Content-Type", "application/json");
        }
        this.end(JSON.stringify(obj));
        return this;
      };

      // Redirects to another URL with a given status code
      res.redirect = function (statusOrUrl, url) {
        let status = 302;
        let location;
        if (arguments.length === 1) {
          location = statusOrUrl;
        } else {
          status = statusOrUrl;
          location = url;
        }
        this.statusCode = status;
        this.setHeader("Location", location);
        this.end();
        return this;
      };

      // Sets one or multiple response headers
      res.set = function (field, value) {
        if (typeof field === "object") {
          Object.keys(field).forEach((key) => {
            this.setHeader(key, field[key]);
          });
        } else {
          this.setHeader(field, value);
        }
        return this;
      };

      // Retrieves a response header
      res.get = function (field) {
        return this.getHeader(field);
      };

      // Sets the Content-Type header
      res.type = function (type) {
        const contentTypes = {
          html: "text/html",
          json: "application/json",
          text: "text/plain",
          xml: "application/xml",
        };

        const contentType = contentTypes[type] || type;
        this.setHeader("Content-Type", contentType);
        return this;
      };

      // Attach application reference to request and response
      req.app = this;
      res.app = this;

      // Pass request and response to the router
      this.handle(req, res);
    });

    // Start listening on the given port
    return server.listen(port, callback);
  }

  /**
   * Handles an incoming request by passing it to the router.
   * Handles errors using custom or default error handlers.
   */
  handle(req, res) {
    this._router.handle(req, res, (err) => {
      if (err) {
        // Find registered error-handling middleware (4 args)
        const errorHandlers = this._router.stack.filter(
          (layer) => layer.handler.length === 4
        );

        if (errorHandlers.length > 0) {
          errorHandlers[0].handler(err, req, res, () => {
            this.defaultErrorHandler(err, req, res);
          });
        } else {
          this.defaultErrorHandler(err, req, res);
        }
      }
    });
  }

  /**
   * Default error handler used if no custom error middleware is found.
   */
  defaultErrorHandler(err, req, res) {
    const status = err.status || 500;
    res.status(status).json({
      error: {
        message: err.message,
        status: status,
      },
    });
  }

  /**
   * Registers a template engine for rendering views.
   */
  engine(ext, fn) {
    this.engines[ext] = fn;
    return this;
  }

  // ===== Route registration methods =====
  get(path, ...handlers) {
    this._router.get(path, ...handlers);
    return this;
  }

  post(path, ...handlers) {
    this._router.post(path, ...handlers);
    return this;
  }

  put(path, ...handlers) {
    this._router.put(path, ...handlers);
    return this;
  }

  delete(path, ...handlers) {
    this._router.delete(path, ...handlers);
    return this;
  }

  patch(path, ...handlers) {
    this._router.patch(path, ...handlers);
    return this;
  }

  /**
   * Registers middleware or mounts sub-routers.
   */
  use(...args) {
    this._router.use(...args);
    return this;
  }

  /**
   * Sets an application-level setting.
   */
  set(key, value) {
    this.settings[key] = value;
    return this;
  }

  /**
   * Retrieves an application setting by key.
   */
  getSetting(key) {
    return this.settings[key];
  }

  // ===== View cache management =====
  enableViewCache() {
    this.viewCache.enabled = true;
    return this;
  }

  disableViewCache() {
    this.viewCache.enabled = false;
    return this;
  }

  clearViewCache() {
    this.viewCache.clear();
    return this;
  }
}

module.exports = Application;
