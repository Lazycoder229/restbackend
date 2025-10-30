const response = {
  status(code) {
    this.statusCode = code;
    return this;
  },

  send(body) {
    if (typeof body === "object") {
      this.json(body);
    } else if (typeof body === "string") {
      if (!this.getHeader("Content-Type")) {
        this.setHeader("Content-Type", "text/html");
      }
      this.end(body);
    } else {
      this.end(String(body));
    }
    return this;
  },

  json(obj) {
    if (!this.getHeader("Content-Type")) {
      this.setHeader("Content-Type", "application/json");
    }
    this.end(JSON.stringify(obj));
    return this;
  },

  redirect(statusOrUrl, url) {
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
  },

  set(field, value) {
    if (typeof field === "object") {
      Object.keys(field).forEach((key) => {
        this.setHeader(key, field[key]);
      });
    } else {
      this.setHeader(field, value);
    }
    return this;
  },

  get(field) {
    return this.getHeader(field);
  },

  type(type) {
    const contentTypes = {
      html: "text/html",
      json: "application/json",
      text: "text/plain",
      xml: "application/xml",
    };

    const contentType = contentTypes[type] || type;
    this.setHeader("Content-Type", contentType);
    return this;
  },
  render(view, options = {}, callback) {
    const app = this.app;
    const viewsPath = app.get("views") || "./views";
    const defaultEngine = app.get("view engine");

    let ext = path.extname(view);
    if (!ext) {
      ext = "." + defaultEngine;
      view += ext;
    }

    const engine = app.engines[ext];
    if (!engine) {
      const error = new Error(`No engine found for extension: ${ext}`);
      return callback ? callback(error) : this.status(500).send(error.message);
    }

    const filepath = path.join(viewsPath, view);

    // Check cache first
    const cachedTemplate = app.viewCache.get(filepath);

    if (cachedTemplate) {
      return engine(cachedTemplate, options, (err, rendered) => {
        if (err)
          return callback ? callback(err) : this.status(500).send(err.message);
        if (callback) return callback(null, rendered);
        this.send(rendered);
      });
    }

    // Read from file system
    fs.readFile(filepath, "utf8", (err, str) => {
      if (err) {
        return callback ? callback(err) : this.status(500).send(err.message);
      }

      // Cache the template
      app.viewCache.set(filepath, str);

      // Watch for changes in development
      if (process.env.NODE_ENV !== "production") {
        app.viewCache.watch(filepath);
      }

      engine(str, options, (err, rendered) => {
        if (err)
          return callback ? callback(err) : this.status(500).send(err.message);
        if (callback) return callback(null, rendered);
        this.send(rendered);
      });
    });
  },
};

module.exports = response;
