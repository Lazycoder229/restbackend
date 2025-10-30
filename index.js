const Application = require("./lib/apppication");
const Router = require("./lib/router");
const bodyParser = require("./lib/middleware/body-parser");
const serveStatic = require("./lib/middleware/static");
const cookieParser = require("./lib/middleware/cookie-parser");
const cors = require("./lib/middleware/cors");
const compression = require("./lib/middleware/compression");
const rateLimit = require("./lib/middleware/rate-limit");
const session = require("./lib/middleware/session");
const helmet = require("./lib/middleware/helmet");
const logger = require("./lib/middleware/logger");
const upload = require("./lib/middleware/upload");
const WebSocketServer = require("./lib/websocket");
const createCluster = require("./lib/cluster");

function createApplication() {
  return new Application();
}

// Export main function
module.exports = createApplication;

// Export Router
module.exports.Router = Router;

// Export built-in middleware
module.exports.json = bodyParser.json;
module.exports.urlencoded = bodyParser.urlencoded;
module.exports.static = serveStatic;
module.exports.cookieParser = cookieParser;
module.exports.cors = cors;
module.exports.compression = compression;
module.exports.rateLimit = rateLimit;
module.exports.session = session;
module.exports.helmet = helmet;
module.exports.logger = logger;
module.exports.upload = upload;

// Export WebSocket
module.exports.WebSocketServer = WebSocketServer;

// Export Cluster
module.exports.cluster = createCluster;
