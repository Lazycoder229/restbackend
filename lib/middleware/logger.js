function logger(format = "combined", options = {}) {
  const formats = {
    combined:
      ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    common:
      ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length]',
    dev: ":method :url :status :response-time ms - :res[content-length]",
    short:
      ":remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms",
    tiny: ":method :url :status :res[content-length] - :response-time ms",
  };

  const formatString = formats[format] || format;
  const stream = options.stream || process.stdout;
  const skip = options.skip || (() => false);

  // Token replacers
  const tokens = {
    "remote-addr": (req) => req.ip || req.socket?.remoteAddress || "-",
    "remote-user": (req) => req.user?.name || "-",
    date: () => new Date().toISOString(),
    method: (req) => req.method,
    url: (req) => req.url,
    "http-version": (req) => `${req.httpVersionMajor}.${req.httpVersionMinor}`,
    status: (req, res) => res.statusCode,
    referrer: (req) => req.headers?.referer || req.headers?.referrer || "-",
    "user-agent": (req) => req.headers?.["user-agent"] || "-", // ✅ Fixed: Added dot before bracket
    "response-time": (req, res) => res._responseTime?.toFixed(3) || "-",
  };

  // Dynamic token for res headers
  const resHeaderRegex = /:res\[([^\]]+)\]/g;

  return (req, res, next) => {
    if (skip(req, res)) {
      return next();
    }

    const startTime = Date.now();

    // Capture original end
    const originalEnd = res.end;

    // Flag to prevent double logging
    let logged = false;

    res.end = function (chunk, encoding, callback) {
      // Restore original immediately
      res.end = originalEnd;

      // Calculate response time
      res._responseTime = Date.now() - startTime;

      // Log only once
      if (!logged) {
        logged = true;

        try {
          // Build log string
          let logString = formatString;

          // Replace standard tokens
          Object.entries(tokens).forEach(([token, fn]) => {
            const regex = new RegExp(`:${token}`, "g");
            logString = logString.replace(regex, () => {
              try {
                return fn(req, res) || "-";
              } catch (e) {
                return "-";
              }
            });
          });

          // Replace response header tokens
          logString = logString.replace(resHeaderRegex, (match, header) => {
            return res.getHeader(header) || "-";
          });

          // Color code for dev format
          if (format === "dev") {
            const status = res.statusCode;
            const color =
              status >= 500
                ? "\x1b[31m" // red
                : status >= 400
                ? "\x1b[33m" // yellow
                : status >= 300
                ? "\x1b[36m" // cyan
                : status >= 200
                ? "\x1b[32m" // green
                : "\x1b[0m"; // no color

            logString = logString.replace(
              String(status),
              `${color}${status}\x1b[0m`
            );
          }

          // Write log
          stream.write(logString + "\n");
        } catch (err) {
          console.error("Logger error:", err);
        }
      }

      // Call original end with all arguments
      return originalEnd.call(this, chunk, encoding, callback);
    };

    next();
  };
}

module.exports = logger; //  Fixed: Removed the backslash
