# CI/CD and Benchmarking Guide

## GitHub Actions CI/CD

### What's Included

Two GitHub Actions workflows have been set up:

#### 1. **CI Workflow** (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches:

- ✅ **Multi-Node Testing** - Tests on Node 16, 18, and 20
- ✅ **Multi-OS Testing** - Tests on Ubuntu, Windows, and macOS
- ✅ **Build Verification** - Ensures TypeScript compiles
- ✅ **Test Suite** - Runs all Jest tests
- ✅ **Coverage Report** - Generates and uploads to Codecov
- ✅ **Benchmark** - Runs performance tests and archives results
- ✅ **Artifact Storage** - Saves build artifacts and benchmark results

#### 2. **Release Workflow** (`.github/workflows/release.yml`)

Runs when you push a version tag (e.g., `v0.1.0`):

- ✅ **Automated Testing** - Runs full test suite
- ✅ **Build** - Compiles TypeScript
- ✅ **NPM Publish** - Automatically publishes to npm
- ✅ **GitHub Release** - Creates GitHub release with changelog

### Setup Steps

#### 1. Enable GitHub Actions

GitHub Actions should work automatically once you push the `.github/workflows/` files to your repository.

#### 2. Add Secrets (for npm publishing)

Go to your GitHub repository settings:

1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Add new repository secret:
   - **Name**: `NPM_TOKEN`
   - **Value**: Your npm access token (get from https://www.npmjs.com/settings/YOUR_USERNAME/tokens)

#### 3. Optional: Codecov Integration

For coverage reports:

1. Sign up at https://codecov.io with your GitHub account
2. Add your repository
3. No additional secrets needed - Codecov Action handles authentication

### Triggering Workflows

**CI Workflow:**

```bash
git add .
git commit -m "Your changes"
git push origin main
```

**Release Workflow:**

```bash
# Update version in package.json first
npm version 0.2.0  # or patch/minor/major

# Push the tag
git push origin v0.2.0
```

### Viewing Results

- **CI Status**: Visible on pull requests and commit status
- **Artifacts**: Download from Actions tab → Select workflow run → Artifacts section
- **Coverage**: View at https://codecov.io/gh/Lazycoder229/restbackend

---

## Performance Benchmarking

### Quick Start

Run benchmarks locally:

```bash
npm run benchmark
```

This will:

1. Start RestJS server on port 3001
2. Start Express server on port 3002
3. Start Fastify server on port 3003
4. Run load tests on all three frameworks
5. Generate comparison reports

### What Gets Tested

**Three test routes:**

1. **Simple JSON** - `/api/hello` - Basic response
2. **Complex JSON** - `/api/json` - Nested objects with dates and arrays
3. **Dynamic Route** - `/api/params/123` - Route parameters

**Test configuration:**

- Duration: 10 seconds per route per framework
- Connections: 100 concurrent
- Pipelining: 10 requests per connection
- Tool: [autocannon](https://github.com/mcollina/autocannon)

### Understanding Results

Results show:

- **Req/sec**: Throughput (higher = better)
- **Latency**: Response time in ms (lower = better)
- **Throughput**: MB/s data transfer (higher = better)
- **Total Requests**: Requests completed in 10 seconds

### Example Output

```
═══════════════════════════════════════════════════════
                  BENCHMARK RESULTS
═══════════════════════════════════════════════════════

Route: /api/hello
─────────────────────────────────────────────────────────

🥇 Fastify
   Requests/sec: 45234.12
   Latency: 2.15 ms
   Throughput: 8.52 MB/s

🥈 RestJS
   Requests/sec: 38921.45
   Latency: 2.51 ms
   Throughput: 7.34 MB/s

🥉 Express
   Requests/sec: 32145.78
   Latency: 3.05 ms
   Throughput: 6.05 MB/s
```

### Interpreting Results

**Expected performance:**

- **Fastify** - Fastest (optimized for speed)
- **RestJS** - Competitive (with DI overhead)
- **Express** - Baseline (most popular)

**Notes:**

- RestJS includes dependency injection overhead
- Decorators add minimal runtime cost
- Real apps depend on business logic more than framework
- These tests measure raw framework performance

### Benchmark Files

All benchmark files are in `benchmark/`:

```
benchmark/
├── restjs-server.ts      # RestJS test server
├── express-server.js     # Express test server
├── fastify-server.js     # Fastify test server
├── run-benchmarks.js     # Benchmark runner script
├── tsconfig.json         # TypeScript config for benchmark
├── README.md             # Benchmark documentation
└── results/              # Auto-generated results
    ├── *.json            # Raw JSON data
    └── *.md              # Markdown reports
```

### CI Integration

Benchmarks run automatically in CI:

- Triggered on every push to main/develop
- Results saved as artifacts
- Download from GitHub Actions tab

### Custom Benchmarks

Add your own test routes:

```typescript
// benchmark/restjs-server.ts
@Controller("/api")
class BenchmarkController {
  @Get("/custom")
  customRoute(): any {
    // Your test logic
    return { data: "test" };
  }
}
```

Then update `run-benchmarks.js`:

```javascript
const routes = ["/api/hello", "/api/json", "/api/params/123", "/api/custom"];
```

---

## Troubleshooting

### CI Fails on Windows

If tests fail on Windows but pass locally:

- Check line endings (Git autocrlf settings)
- Verify paths use correct separators

### Benchmark Ports Already in Use

If ports 3001-3003 are busy:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID [PID] /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### NPM Publish Fails

Common issues:

- Check NPM_TOKEN is set correctly
- Ensure version number is incremented
- Verify you have publish rights to package

---

## Best Practices

### Before Pushing

```bash
# Run tests
npm test

# Check build
npm run build

# Run benchmarks
npm run benchmark
```

### Creating Releases

1. Update CHANGELOG.md
2. Bump version: `npm version [patch|minor|major]`
3. Push commits: `git push`
4. Push tags: `git push --tags`
5. GitHub Actions handles the rest!

### Monitoring

- Check CI status before merging PRs
- Review benchmark results for performance regressions
- Monitor test coverage trends

---

## Questions?

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more development guidelines.
