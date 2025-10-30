function helmet(options = {}) {
  const defaults = {
    contentSecurityPolicy: true,
    dnsPrefetchControl: true,
    frameguard: true,
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    xssFilter: true,
  };

  const config = { ...defaults, ...options };

  const middlewares = [];

  // Content Security Policy
  if (config.contentSecurityPolicy) {
    middlewares.push((req, res, next) => {
      const directives = config.contentSecurityPolicy.directives || {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
      };

      const csp = Object.entries(directives)
        .map(([key, values]) => {
          const directive = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
          return `${directive} ${values.join(" ")}`;
        })
        .join("; ");

      res.setHeader("Content-Security-Policy", csp);
      next();
    });
  }

  // DNS Prefetch Control
  if (config.dnsPrefetchControl) {
    middlewares.push((req, res, next) => {
      res.setHeader("X-DNS-Prefetch-Control", "off");
      next();
    });
  }

  // Frameguard (X-Frame-Options)
  if (config.frameguard) {
    middlewares.push((req, res, next) => {
      const action =
        typeof config.frameguard === "object"
          ? config.frameguard.action
          : "SAMEORIGIN";
      res.setHeader("X-Frame-Options", action);
      next();
    });
  }

  // Hide X-Powered-By
  if (config.hidePoweredBy) {
    middlewares.push((req, res, next) => {
      res.removeHeader("X-Powered-By");
      next();
    });
  }

  // HTTP Strict Transport Security
  if (config.hsts) {
    middlewares.push((req, res, next) => {
      const maxAge =
        typeof config.hsts === "object" ? config.hsts.maxAge : 15552000; // 180 days
      let value = `max-age=${maxAge}`;

      if (config.hsts.includeSubDomains !== false) {
        value += "; includeSubDomains";
      }
      if (config.hsts.preload) {
        value += "; preload";
      }

      res.setHeader("Strict-Transport-Security", value);
      next();
    });
  }

  // IE No Open
  if (config.ieNoOpen) {
    middlewares.push((req, res, next) => {
      res.setHeader("X-Download-Options", "noopen");
      next();
    });
  }

  // X-Content-Type-Options
  if (config.noSniff) {
    middlewares.push((req, res, next) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      next();
    });
  }

  // XSS Filter
  if (config.xssFilter) {
    middlewares.push((req, res, next) => {
      res.setHeader("X-XSS-Protection", "1; mode=block");
      next();
    });
  }

  // Combine all middlewares
  return (req, res, next) => {
    let idx = 0;
    const run = () => {
      if (idx >= middlewares.length) return next();
      middlewares[idx++](req, res, run);
    };
    run();
  };
}

module.exports = helmet;
// This middleware provides security headers for HTTP responses.
// It includes options for Content Security Policy, DNS Prefetch Control, Frameguard, X-Powered-By header removal, HSTS, IE No Open, X-Content-Type-Options, and XSS Filter.
// Each option can be enabled or configured through the `options` parameter.
// The middleware sets appropriate headers based on the configuration and processes requests in sequence.
