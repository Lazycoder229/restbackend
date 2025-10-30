function cors(options = {}) {
  const defaults = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "*",
    exposedHeaders: "",
    credentials: false,
    maxAge: null,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  const config = { ...defaults, ...options };

  return (req, res, next) => {
    // Handle origin
    let origin = config.origin;
    if (typeof origin === "function") {
      origin = origin(req.get("origin"));
    } else if (Array.isArray(origin)) {
      const requestOrigin = req.get("origin");
      origin = origin.includes(requestOrigin) ? requestOrigin : false;
    }

    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    // Handle credentials
    if (config.credentials) {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    // Handle exposed headers
    if (config.exposedHeaders) {
      res.setHeader("Access-Control-Expose-Headers", config.exposedHeaders);
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", config.methods);

      const requestHeaders = req.get("access-control-request-headers");
      if (requestHeaders) {
        res.setHeader(
          "Access-Control-Allow-Headers",
          config.allowedHeaders === "*" ? requestHeaders : config.allowedHeaders
        );
      }

      if (config.maxAge) {
        res.setHeader("Access-Control-Max-Age", config.maxAge);
      }

      if (!config.preflightContinue) {
        res.statusCode = config.optionsSuccessStatus;
        res.setHeader("Content-Length", "0");
        return res.end();
      }
    }

    next();
  };
}

module.exports = cors;
// This middleware function handles CORS (Cross-Origin Resource Sharing) requests.
// It sets appropriate headers based on the provided options, allowing or restricting access to resources from different origins.
// It supports preflight requests and can handle credentials, exposed headers, and custom methods.
// If the request is an OPTIONS request, it responds with the allowed methods and headers, and can optionally end the response.
