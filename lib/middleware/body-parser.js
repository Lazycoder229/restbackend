// Middleware for parsing HTTP request bodies.
// Provides two parsers: `json()` for application/json and `urlencoded()` for form data.
// These functions attach a parsed `req.body` object for easier data access in routes.

function json(options = {}) {
  return (req, res, next) => {
    // Only parse for POST and PUT requests since they usually contain a body
    if (req.method !== "POST" && req.method !== "PUT") {
      return next();
    }

    // Check if the request content type is JSON
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("application/json")) {
      return next();
    }

    let data = "";

    // Listen for incoming data chunks
    req.on("data", (chunk) => {
      data += chunk.toString();
    });

    // When all data is received, try to parse it as JSON
    req.on("end", () => {
      try {
        req.body = JSON.parse(data); // Attach the parsed object to req.body
        next(); // Continue to the next middleware or route
      } catch (err) {
        // If JSON parsing fails, return a 400 Bad Request error
        err.status = 400;
        next(err);
      }
    });

    // Handle unexpected stream errors
    req.on("error", next);
  };
}

function urlencoded(options = {}) {
  return (req, res, next) => {
    // Only parse for POST and PUT requests
    if (req.method !== "POST" && req.method !== "PUT") {
      return next();
    }

    // Check if the content type is URL-encoded form data
    const contentType = req.headers["content-type"];
    if (
      !contentType ||
      !contentType.includes("application/x-www-form-urlencoded")
    ) {
      return next();
    }

    let data = "";

    // Collect data chunks from the request body
    req.on("data", (chunk) => {
      data += chunk.toString();
    });

    // Parse the URL-encoded string into an object
    req.on("end", () => {
      const parsed = {};
      data.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        parsed[decodeURIComponent(key)] = decodeURIComponent(value || "");
      });
      req.body = parsed; // Attach parsed data to req.body
      next(); // Continue to next middleware or route
    });

    // Handle stream errors
    req.on("error", next);
  };
}

module.exports = { json, urlencoded };

// Summary:
// - json(): Parses incoming JSON request bodies and attaches the result to req.body.
// - urlencoded(): Parses application/x-www-form-urlencoded bodies and attaches the result to req.body.
// - Both middleware functions check the request method and content type before parsing.
// - If parsing fails, the middleware passes an error to the next function for centralized error handling.
