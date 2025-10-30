function cookieParser() {
  return (req, res, next) => {
    const cookieHeader = req.headers.cookie;
    req.cookies = {};

    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [name, ...rest] = cookie.split("=");
        req.cookies[name.trim()] = decodeURIComponent(rest.join("="));
      });
    }

    // Add cookie setter to response
    res.cookie = function (name, value, options = {}) {
      let cookie = `${name}=${encodeURIComponent(value)}`;

      if (options.maxAge) {
        cookie += `; Max-Age=${options.maxAge}`;
      }
      if (options.path) {
        cookie += `; Path=${options.path}`;
      }
      if (options.httpOnly) {
        cookie += "; HttpOnly";
      }
      if (options.secure) {
        cookie += "; Secure";
      }

      const existing = this.getHeader("Set-Cookie") || [];
      const cookies = Array.isArray(existing) ? existing : [existing];
      cookies.push(cookie);
      this.setHeader("Set-Cookie", cookies);

      return this;
    };

    next();
  };
}

module.exports = cookieParser;
// This middleware parses cookies from the request headers and adds them to the `req.cookies` object.
// It also provides a `res.cookie` method to set cookies in the response headers.
// The `res.cookie` method allows setting options like `maxAge`, `path`, `httpOnly`, and `secure`.
