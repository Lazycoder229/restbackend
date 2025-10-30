const fs = require("fs");
const path = require("path");

/**
 * A basic map of common file extensions to their corresponding MIME types.
 * Used to set the correct "Content-Type" header when serving files.
 */
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/**
 * Middleware function for serving static files.
 *
 * @param {string} root - The root directory from which to serve static assets.
 * @returns {Function} Middleware that serves static files when matching a request path.
 *
 * This function acts similarly to Express's `express.static()` middleware:
 * - It only handles `GET` and `HEAD` requests.
 * - It resolves the requested path relative to the specified root directory.
 * - If the file exists, it reads it and sends it as a response with the correct MIME type.
 * - If the file does not exist or an error occurs, it calls `next()` to allow other middleware or routes to handle the request.
 */
function serveStatic(root) {
  return (req, res, next) => {
    // Only serve static files for GET and HEAD requests
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    // Resolve the requested file path relative to the root directory
    const filePath = path.join(root, req.path);
    const ext = path.extname(filePath); // Extract file extension (e.g., .html, .css)

    // Attempt to read the file from disk
    fs.readFile(filePath, (err, data) => {
      if (err) {
        // If the file doesn't exist or cannot be read, delegate to the next middleware
        return next();
      }

      // Determine and set the appropriate MIME type for the file
      const contentType = mimeTypes[ext] || "application/octet-stream";
      res.setHeader("Content-Type", contentType);

      // Send the file contents as the response
      res.end(data);
    });
  };
}

module.exports = serveStatic;

/**
 * This middleware provides a simple static file server for custom frameworks.
 *
 * Features:
 * - Serves files from a given root directory (e.g., public, assets, uploads).
 * - Automatically determines MIME types based on file extensions.
 * - Supports GET and HEAD HTTP methods.
 * - Falls back to the next middleware when a file isn’t found.
 *
 * Example usage:
 *   const serveStatic = require("./serve-static");
 *   app.use(serveStatic("public"));
 */
