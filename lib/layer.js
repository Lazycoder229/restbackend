class Layer {
  constructor(path, handler, options = {}) {
    this.path = path;
    this.handler = handler;
    this.method = options.method;
    this.keys = []; //  Initialize BEFORE calling pathToRegexp
    this.regexp = this.pathToRegexp(path, options.end);
  }

  match(url) {
    // Remove query string
    const pathname = url.split("?")[0];

    const matches = this.regexp.exec(pathname);

    if (!matches) {
      return false;
    }

    // Extract params
    const params = {};
    this.keys.forEach((key, i) => {
      params[key] = matches[i + 1];
    });

    return { params };
  }

  pathToRegexp(path, end = true) {
    // Handle exact strings
    if (path === "/" || path === "*") {
      return end ? /^\/$/ : /^\/.*$/;
    }

    // Extract parameter names
    const paramPattern = /:([^\/]+)/g;
    let match;
    while ((match = paramPattern.exec(path)) !== null) {
      this.keys.push(match[1]);
    }

    // Convert path to regex
    let pattern = path.replace(/\//g, "\\/").replace(/:([^\/]+)/g, "([^\\/]+)");

    if (end) {
      pattern = `^${pattern}$`;
    } else {
      pattern = `^${pattern}`;
    }

    return new RegExp(pattern);
  }
}

module.exports = Layer;
