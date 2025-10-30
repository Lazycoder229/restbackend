const zlib = require("zlib");

function compression(options = {}) {
  const defaults = {
    threshold: 1024, // Don't compress responses smaller than 1KB
    level: 6, // Compression level (0-9)
    filter: (req, res) => {
      // Don't compress if no-transform cache-control
      if (res.getHeader("Cache-Control")?.includes("no-transform")) {
        return false;
      }
      // Use compression for text-based content
      const type = res.getHeader("Content-Type") || "";
      return /json|text|javascript|xml/.test(type);
    },
  };

  const config = { ...defaults, ...options };

  return (req, res, next) => {
    const acceptEncoding = req.headers["accept-encoding"] || "";

    // Check if client accepts gzip
    if (!acceptEncoding.includes("gzip")) {
      return next();
    }

    // Store original methods
    const originalEnd = res.end;
    const originalWrite = res.write;
    let chunks = [];

    // Override write method
    res.write = function (chunk, encoding) {
      if (chunk) {
        chunks.push(Buffer.from(chunk, encoding));
      }
      return true;
    };

    // Override end method
    res.end = function (chunk, encoding) {
      if (chunk) {
        chunks.push(Buffer.from(chunk, encoding));
      }

      const buffer = Buffer.concat(chunks);

      // Check if should compress
      if (buffer.length < config.threshold || !config.filter(req, res)) {
        res.write = originalWrite;
        res.end = originalEnd;
        return originalEnd.call(res, buffer);
      }

      // Compress the response
      zlib.gzip(buffer, { level: config.level }, (err, compressed) => {
        if (err) {
          res.write = originalWrite;
          res.end = originalEnd;
          return originalEnd.call(res, buffer);
        }

        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Content-Length", compressed.length);
        res.removeHeader("Content-Length"); // Let Node.js set it

        res.write = originalWrite;
        res.end = originalEnd;
        originalEnd.call(res, compressed);
      });
    };

    next();
  };
}

module.exports = compression;
// This middleware compresses HTTP responses using gzip if the client supports it.
// It checks the `Accept-Encoding` header to determine if gzip is supported.
// If the response size is below a specified threshold or if the content type is not suitable for compression, it sends the response uncompressed.
// Otherwise, it compresses the response and sets appropriate headers.
