const crypto = require("crypto");

/**
 * In-memory session store.
 * This class holds session data temporarily using a JavaScript Map.
 * Each session is identified by a unique session ID (sid).
 */
class SessionStore {
  constructor() {
    this.sessions = new Map(); // Stores sessions in memory
  }

  /**
   * Retrieves a session by its ID.
   * @param {string} sid - The session ID.
   * @param {Function} callback - Callback function (err, session).
   */
  get(sid, callback) {
    const session = this.sessions.get(sid);
    callback(null, session);
  }

  /**
   * Stores or updates a session in memory.
   * @param {string} sid - The session ID.
   * @param {object} session - The session data.
   * @param {Function} callback - Callback function (err).
   */
  set(sid, session, callback) {
    this.sessions.set(sid, session);
    callback(null);
  }

  /**
   * Deletes a session from the store.
   * @param {string} sid - The session ID.
   * @param {Function} callback - Callback function (err).
   */
  destroy(sid, callback) {
    this.sessions.delete(sid);
    callback(null);
  }

  /**
   * Updates the expiration time of an existing session.
   * @param {string} sid - The session ID.
   * @param {object} session - The session data containing updated cookie info.
   * @param {Function} callback - Callback function (err).
   */
  touch(sid, session, callback) {
    const existing = this.sessions.get(sid);
    if (existing) {
      existing.cookie.expires = session.cookie.expires;
    }
    callback(null);
  }
}

/**
 * Main session middleware factory.
 *
 * Provides session management similar to `express-session`.
 *
 * @param {object} options - Configuration options.
 * @returns {Function} Middleware function that handles session creation, loading, and saving.
 */
function session(options = {}) {
  const config = {
    secret: options.secret || "keyboard cat", // Used for signing or identifying sessions (not used here directly)
    name: options.name || "connect.sid", // Default session cookie name
    cookie: {
      path: "/",
      httpOnly: true, // Prevents JavaScript access to cookies
      secure: false, // Should be true in HTTPS production
      maxAge: 24 * 60 * 60 * 1000, // Default 24 hours
      ...options.cookie,
    },
    genid: options.genid || (() => crypto.randomBytes(16).toString("hex")), // Session ID generator
    resave: options.resave !== undefined ? options.resave : true, // Whether to save unmodified sessions
    saveUninitialized:
      options.saveUninitialized !== undefined
        ? options.saveUninitialized
        : true, // Whether to save new sessions with no data
    store: options.store || new SessionStore(), // Storage mechanism for sessions
  };

  /**
   * Middleware function to handle session operations per request.
   */
  return (req, res, next) => {
    // Extract session ID from cookie
    const cookieHeader = req.headers.cookie;
    let sid = null;

    if (cookieHeader) {
      const cookies = {};
      cookieHeader.split(";").forEach((cookie) => {
        const [name, value] = cookie.split("=");
        cookies[name.trim()] = value;
      });
      sid = cookies[config.name];
    }

    // Generate a new session ID if none exists
    req.sessionID = sid || config.genid();
    req.session = null;

    // Load session data from the store
    config.store.get(req.sessionID, (err, sess) => {
      if (err) return next(err);

      // Create a new session if none exists
      req.session = sess || { cookie: { ...config.cookie } };

      // Keep a copy of the original session for change tracking
      const originalSession = JSON.stringify(req.session);

      // Override the `res.end` method to save session data when response finishes
      const end = res.end;
      res.end = function (...args) {
        res.end = end;

        // Check if session data was modified
        const sessionModified = JSON.stringify(req.session) !== originalSession;

        // Skip saving if uninitialized and not modified
        if (!config.saveUninitialized && !sessionModified && !sid) {
          return end.apply(res, args);
        }

        // Save session if modified or resave is enabled
        if (config.resave || sessionModified) {
          // Construct the Set-Cookie header
          const cookieValue = req.sessionID;
          let cookieStr = `${config.name}=${cookieValue}`;

          if (config.cookie.maxAge) {
            const expires = new Date(Date.now() + config.cookie.maxAge);
            cookieStr += `; Expires=${expires.toUTCString()}`;
            cookieStr += `; Max-Age=${Math.floor(config.cookie.maxAge / 1000)}`;
          }
          if (config.cookie.path) cookieStr += `; Path=${config.cookie.path}`;
          if (config.cookie.httpOnly) cookieStr += `; HttpOnly`;
          if (config.cookie.secure) cookieStr += `; Secure`;
          if (config.cookie.sameSite)
            cookieStr += `; SameSite=${config.cookie.sameSite}`;

          // Send cookie to the client
          res.setHeader("Set-Cookie", cookieStr);

          // Persist session data in store
          config.store.set(req.sessionID, req.session, (err) => {
            if (err) console.error("Session save error:", err);
            end.apply(res, args);
          });
        } else {
          end.apply(res, args);
        }
      };

      // Attach helper methods for session management
      req.session.regenerate = function (callback) {
        config.store.destroy(req.sessionID, (err) => {
          if (err) return callback(err);
          req.sessionID = config.genid();
          req.session = { cookie: { ...config.cookie } };
          callback();
        });
      };

      req.session.destroy = function (callback) {
        config.store.destroy(req.sessionID, callback);
      };

      req.session.reload = function (callback) {
        config.store.get(req.sessionID, (err, sess) => {
          if (err) return callback(err);
          req.session = sess || { cookie: { ...config.cookie } };
          callback();
        });
      };

      req.session.save = function (callback) {
        config.store.set(req.sessionID, req.session, callback || (() => {}));
      };

      // Continue to next middleware or route
      next();
    });
  };
}

module.exports = session;
module.exports.SessionStore = SessionStore;

/**
 * This module provides session management middleware for custom frameworks.
 *
 * Features:
 * - Stores session data in memory by default (can be replaced with a custom store).
 * - Supports creation, loading, modification, and destruction of sessions.
 * - Manages cookies automatically with configurable options.
 * - Includes helper methods: `regenerate`, `destroy`, `reload`, `save`.
 * - Works similarly to `express-session`, but implemented in a lightweight form.
 *
 * Example usage:
 *   const session = require("./session");
 *   app.use(session({ secret: "mysecret", cookie: { secure: true } }));
 */
