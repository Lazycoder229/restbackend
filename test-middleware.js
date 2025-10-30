const myFramework = require("./index");

// Test configuration - change these to test different middleware
const TESTS = {
  helmet: true, // ✅ Set to true to test
  cors: true, // ✅ Set to true to test
  logger: true, // ❌ Set to false to skip
  compression: true,
  bodyParser: true,
  cookieParser: true,
  session: true,
  static: true,
  rateLimit: true,
};

const app = myFramework();

// Debug middleware - shows request flow
app.use((req, res, next) => {
  console.log(`\n Incoming: ${req.method} ${req.url}`);
  next();
});

// Test 1: Helmet
if (TESTS.helmet) {
  console.log("Testing: Helmet");
  app.use(myFramework.helmet());
  console.log("Helmet added");
}

// Test 2: CORS
if (TESTS.cors) {
  console.log("Testing: CORS");
  app.use(
    myFramework.cors({
      origin: ["http://localhost:3000"],
      credentials: true,
    })
  );
  console.log("CORS added");
}

// Test 3: Logger
if (TESTS.logger) {
  console.log("Testing: Logger");
  app.use(myFramework.logger("dev"));
  console.log(" Logger added");
}

// Test 4: Compression
if (TESTS.compression) {
  console.log("Testing: Compression");
  app.use(myFramework.compression());
  console.log(" Compression added");
}

// Test 5: Body Parser
if (TESTS.bodyParser) {
  console.log("Testing: Body Parser");
  app.use(myFramework.json());
  app.use(myFramework.urlencoded());
  console.log("Body Parser added");
}

// Test 6: Cookie Parser
if (TESTS.cookieParser) {
  console.log("Testing: Cookie Parser");
  app.use(myFramework.cookieParser());
  console.log("Cookie Parser added");
}

// Test 7: Session
if (TESTS.session) {
  console.log("Testing: Session");
  app.use(
    myFramework.session({
      secret: "my-secret-key",
      resave: false,
      saveUninitialized: false,
    })
  );
  console.log("Session added");
}

// Test 8: Static Files
if (TESTS.static) {
  console.log(" Testing: Static Files");
  app.use(myFramework.static("./public"));
  console.log("Static Files added");
}

// Test 9: Rate Limiter
if (TESTS.rateLimit) {
  console.log(" Testing: Rate Limiter");
  const limiter = myFramework.rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });
  app.use("/api/", limiter);
  console.log("Rate Limiter added");
}

// Checkpoint middleware
app.use((req, res, next) => {
  console.log(" Passed all middleware, reaching routes");
  next();
});

// Routes
app.get("/", (req, res) => {
  console.log(" Route handler executed");
  res.send("Hello World!");
});

app.get("/api/test", (req, res) => {
  console.log(" API route handler executed");
  res.json({ message: "API works!" });
});

// 404 handler
app.use((req, res) => {
  console.log(" 404 - Not Found");
  res.status(404).send("Not Found");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(" Error caught:", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(3000, () => {
  console.log("\n Server on http://localhost:3000");
  console.log(" Active middleware:");
  Object.entries(TESTS).forEach(([name, active]) => {
    console.log(`   ${active ? "Pass" : "Failed"} ${name}`);
  });
  console.log("\n Test with: curl http://localhost:3000/\n");
});
