const url = require("url");

const request = {
  get query() {
    if (!this._query) {
      //  Add safety check
      if (!this.url) {
        return {};
      }
      const parsed = url.parse(this.url, true);
      this._query = parsed.query;
    }
    return this._query;
  },

  get path() {
    if (!this.url) return "/";
    return url.parse(this.url).pathname;
  },

  get hostname() {
    return this.headers?.host?.split(":")[0] || "localhost";
  },

  get ip() {
    return this.socket?.remoteAddress || "127.0.0.1";
  },

  get protocol() {
    return this.socket?.encrypted ? "https" : "http";
  },

  param(name, defaultValue) {
    return (
      this.params?.[name] ||
      this.query?.[name] ||
      this.body?.[name] ||
      defaultValue
    );
  },

  get(field) {
    if (!this.headers) return undefined;
    const header = field.toLowerCase();
    switch (header) {
      case "referer":
      case "referrer":
        return this.headers.referer || this.headers.referrer;
      default:
        return this.headers[header];
    }
  },
};

module.exports = request;
