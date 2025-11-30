# 🔄 CI/CD & Automation Guide

**Automate testing, deployment, and releases with GitHub Actions.**

> This guide covers the complete CI/CD pipeline for RestJS - from automated testing on every commit to automatic npm publishing on releases.

---

## 📑 Table of Contents

<details open>
<summary><strong>CI/CD Topics</strong></summary>

### Getting Started

- [Overview](#overview) - What's automated
- [Quick Setup](#quick-setup) - 5-minute setup
- [Workflows Explained](#workflows-explained) - Understand each workflow

### Workflows

- [CI Workflow](#ci-workflow) - Continuous Integration
- [Release Workflow](#release-workflow) - Automated releases
- [Custom Workflows](#custom-workflows) - Add your own

### Configuration

- [Secrets Management](#secrets-management) - API keys & tokens
- [Environment Variables](#environment-variables) - Configuration
- [Triggers](#triggers) - When workflows run

### Advanced

- [Deployment Strategies](#deployment-strategies) - Blue-green, canary
- [Monitoring CI](#monitoring-ci) - Track pipeline health
- [Troubleshooting](#troubleshooting) - Common issues

</details>

---

## 🎯 Overview

<details open>
<summary><strong>What's Automated in RestJS?</strong></summary>

RestJS comes with **production-ready CI/CD pipelines** that automate your entire development workflow:

### Automated Workflows

```
┌──────────────────────────────────────────────────────────┐
│                    Development Flow                       │
└──────────────────────────────────────────────────────────┘

1. You push code
   ↓
2. CI Workflow runs (auto)
   ├─ Lint code
   ├─ Run tests (Node 16, 18, 20)
   ├─ Test on 3 OS (Ubuntu, Windows, macOS)
   ├─ Build TypeScript
   ├─ Run benchmarks
   └─ Upload coverage
   ↓
3. You create release tag (v1.0.0)
   ↓
4. Release Workflow runs (auto)
   ├─ Run full test suite
   ├─ Build production bundle
   ├─ Publish to npm
   ├─ Create GitHub release
   └─ Generate changelog
   ↓
5. Package available on npm! 🎉
```

### What You Get Out of the Box

#### ✅ Continuous Integration (CI)

<details>
<summary><strong>See CI features</strong></summary>

**Runs on:** Every push and pull request

**Tests across:**

- ✅ Node.js versions: 16, 18, 20
- ✅ Operating systems: Ubuntu, Windows, macOS
- ✅ All 12 combinations (3 Node × 3 OS)

**Checks:**

- ✅ TypeScript compilation
- ✅ Unit tests
- ✅ Integration tests
- ✅ Code coverage
- ✅ Performance benchmarks
- ✅ Build artifacts

**Reports:**

- ✅ Test results in PR
- ✅ Coverage on Codecov
- ✅ Benchmark comparison
- ✅ Build status badge

</details>

#### ✅ Continuous Deployment (CD)

<details>
<summary><strong>See CD features</strong></summary>

**Runs on:** Version tag push (e.g., `v1.2.3`)

**Automated steps:**

- ✅ Version validation
- ✅ Full test suite
- ✅ Production build
- ✅ npm package publish
- ✅ GitHub release creation
- ✅ Changelog generation
- ✅ Docker image build (optional)
- ✅ Documentation deploy (optional)

**Safety features:**

- ✅ Only runs on tags
- ✅ Tests must pass
- ✅ Manual approval option
- ✅ Rollback capability

</details>

</details>

---

## ⚡ Quick Setup

<details open>
<summary><strong>Set up CI/CD in 5 minutes</strong></summary>

### Step 1: GitHub Actions Files (Already Included!)

RestJS includes pre-configured workflows in `.github/workflows/`:

```
.github/
  workflows/
    ├── ci.yml       # Continuous Integration
    └── release.yml  # Automated Releases
```

✅ **No configuration needed** - works out of the box!

### Step 2: Add npm Token (For Publishing)

<details>
<summary><strong>How to get npm token</strong></summary>

1. **Go to npm:**

   - Visit https://www.npmjs.com/
   - Log in to your account

2. **Generate token:**

   - Click profile picture → "Access Tokens"
   - Click "Generate New Token"
   - Select "Automation" type
   - Copy the token (shows only once!)

3. **Add to GitHub:**
   - Go to your repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: (paste your token)
   - Click "Add secret"

</details>

### Step 3: Enable Workflows

```bash
# Push workflows to GitHub (if not already)
git add .github/
git commit -m "Add CI/CD workflows"
git push origin main
```

✅ **Done!** Workflows will run automatically on next push.

### Step 4: Verify Setup

<details>
<summary><strong>Test your CI pipeline</strong></summary>

```bash
# Make a small change
echo "# CI Test" >> README.md
git add README.md
git commit -m "Test CI pipeline"
git push origin main

# Then check:
# 1. Go to your GitHub repo
# 2. Click "Actions" tab
# 3. See your workflow running! 🎉
```

**Expected result:**

- ✅ Workflow starts automatically
- ✅ Tests run on 3 Node versions
- ✅ Tests run on 3 operating systems
- ✅ Build completes successfully
- ✅ Green checkmark appears

</details>

</details>

---

## 🔧 Workflows Explained

### 1. CI Workflow (`ci.yml`)

<details>
<summary><strong>What happens in CI workflow?</strong></summary>

**Trigger:** Push or PR to `main` or `develop`

**Matrix Strategy:**

```yaml
strategy:
  matrix:
    node-version: [16, 18, 20]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

**Steps:**

1. **Checkout code** - Clone repository

   ```yaml
   - uses: actions/checkout@v3
   ```

2. **Setup Node.js** - Install specified version

   ```yaml
   - uses: actions/setup-node@v3
     with:
       node-version: ${{ matrix.node-version }}
   ```

3. **Install dependencies**

   ```yaml
   - run: npm ci
   ```

4. **Lint code** (optional)

   ```yaml
   - run: npm run lint
   ```

5. **Build TypeScript**

   ```yaml
   - run: npm run build
   ```

6. **Run tests**

   ```yaml
   - run: npm test
   ```

7. **Upload coverage**

   ```yaml
   - uses: codecov/codecov-action@v3
   ```

8. **Run benchmarks**

   ```yaml
   - run: npm run benchmark
   ```

9. **Archive artifacts**
   ```yaml
   - uses: actions/upload-artifact@v3
     with:
       name: dist-${{ matrix.os }}-node${{ matrix.node-version }}
       path: dist/
   ```

**Total time:** ~2-5 minutes per matrix combination

</details>

### 2. Release Workflow (`release.yml`)

<details>
<summary><strong>What happens in release workflow?</strong></summary>

**Trigger:** Push version tag (e.g., `v1.2.3`, `v2.0.0-beta.1`)

**Steps:**

1. **Checkout code**
2. **Setup Node.js**
3. **Install dependencies**
4. **Run tests** (safety check)
5. **Build production bundle**
6. **Publish to npm**
   ```yaml
   - run: npm publish
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```
7. **Create GitHub Release**
   ```yaml
   - uses: softprops/action-gh-release@v1
     with:
       generate_release_notes: true
   ```

**Total time:** ~3-7 minutes

</details>

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
