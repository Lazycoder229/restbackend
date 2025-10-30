const myFramework = require("./index");
const cluster = myFramework.cluster;

const app = myFramework();

// Production middleware stack
app.use(
  myFramework.helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  myFramework.cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
    credentials: true,
  })
);

app.use(myFramework.compression({ level: 6 }));
app.use(myFramework.logger("combined"));

const limiter = myFramework.rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP",
});
app.use(limiter);

app.use(myFramework.json({ limit: "10mb" }));
app.use(myFramework.static("./public"));

// Enable view caching in production
app.enableViewCache();

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Your routes here
app.get("/", (req, res) => {
  res.send("Production Server Running");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start with clustering
const clusterManager = cluster({
  workers: require("os").cpus().length,
  respawn: true,
  onWorkerStart: (worker) => {
    console.log(`Worker ${worker.process.pid} started`);
  },
  onWorkerExit: (worker, code, signal) => {
    console.error(`Worker ${worker.process.pid} died`);
  },
});

clusterManager.start(app, process.env.PORT || 3000);
// Export the app for testing or further configuration
module.exports = app;
// This code sets up a production-ready server using a custom framework.
// It includes middleware for security, CORS, compression, logging, rate limiting, and static file serving.
// The server listens on a specified port and supports clustering to utilize multiple CPU cores.
// It also includes a health check endpoint and error handling middleware.
// The code is designed to be modular and can be extended with additional routes or middleware as needed.
