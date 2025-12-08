import * as fs from "fs";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";

export interface HotReloadOptions {
  enabled?: boolean;
  watchPaths?: string[];
  ignore?: string[];
  debounceMs?: number;
  onReload?: () => void;
  // New nodemon-like options
  execCommand?: string; // Command to run (e.g., "node dist/index.js")
  buildCommand?: string; // Build command to run before restart (e.g., "npm run build")
  buildWatch?: boolean; // Use build watch mode (e.g., "tsc --watch")
  ext?: string; // File extensions to watch (e.g., "ts,js,json")
  delay?: number; // Delay before restart in ms
  verbose?: boolean; // Show detailed logs
  legacyWatch?: boolean; // Use fs.watchFile instead of fs.watch
  signal?: NodeJS.Signals; // Signal to send to process (default: SIGTERM)
  stdout?: boolean; // Pipe stdout from child process
  stderr?: boolean; // Pipe stderr from child process
  env?: Record<string, string>; // Environment variables
  buildTimeout?: number; // Max time to wait for build (default: 30000ms)
}

export class HotReloadManager {
  private watchers: fs.FSWatcher[] = [];
  private fileWatchers: Map<string, NodeJS.Timeout> = new Map();
  private restartCallback: () => void;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private isReloading = false;
  private childProcess: ChildProcess | null = null;
  private buildProcess: ChildProcess | null = null;
  private isBuilding = false;
  private buildQueue: Array<{ filename: string; eventType: string }> = [];
  private restartAttempts = 0;
  private lastRestartTime = 0;
  private crashCount = 0;
  private readonly MAX_CRASHES = 5;
  private readonly CRASH_WINDOW = 10000; // 10 seconds

  constructor(private options: HotReloadOptions, restartCallback: () => void) {
    this.restartCallback = restartCallback;
    this.setupProcessHandlers();
  }

  start(): void {
    if (!this.options.enabled) return;

    const watchPaths = this.options.watchPaths || ["src"];
    const ignorePaths = this.options.ignore || [
      "node_modules",
      "dist",
      ".git",
      "*.log",
      "*.lock",
    ];

    this.log("🔥 Hot reload enabled - watching for changes...");
    this.log(`📁 Watching: ${watchPaths.join(", ")}`);

    watchPaths.forEach((watchPath: string) => {
      if (!fs.existsSync(watchPath)) {
        console.warn(`⚠️  Watch path does not exist: ${watchPath}`);
        return;
      }

      if (this.options.legacyWatch) {
        this.watchRecursivelyLegacy(watchPath, ignorePaths);
      } else {
        this.watchRecursively(watchPath, ignorePaths);
      }
    });

    // Start build watch mode if enabled
    if (this.options.buildWatch && this.options.buildCommand) {
      this.startBuildWatch();
    }

    // Start the child process if execCommand is provided
    if (this.options.execCommand) {
      // If using build watch mode, wait a bit for initial build
      if (this.options.buildWatch) {
        setTimeout(() => this.startChildProcess(), 3000);
      } else if (this.options.buildCommand) {
        // Run initial build then start
        this.runBuild().then((success) => {
          if (success) {
            this.startChildProcess();
          } else {
            console.error("❌ Initial build failed");
          }
        });
      } else {
        this.startChildProcess();
      }
    }
  }

  private startBuildWatch(): void {
    if (!this.options.buildCommand) return;

    this.log(`👀 Starting build watch: ${this.options.buildCommand}`);
    const [command, ...args] = this.options.buildCommand.split(" ");

    this.buildProcess = spawn(command, args, {
      stdio: this.options.verbose ? "inherit" : "pipe",
      env: { ...process.env, ...this.options.env },
      shell: true,
    });

    if (!this.options.verbose) {
      this.buildProcess.stdout?.on("data", (data) => {
        const output = data.toString();
        // Look for common build success patterns
        if (
          output.includes("Compilation complete") ||
          output.includes("Found 0 errors") ||
          output.includes("Watching for file changes")
        ) {
          this.logVerbose("✅ Build watch compilation complete");
        }
      });

      this.buildProcess.stderr?.on("data", (data) => {
        const error = data.toString();
        if (error.includes("error")) {
          console.error("❌ Build watch error:", error);
        }
      });
    }

    this.buildProcess.on("exit", (code) => {
      if (code !== 0) {
        console.error(`❌ Build watch exited with code ${code}`);
      }
    });
  }

  private watchRecursively(
    watchPath: string,
    ignorePaths: string[]
  ): void {
    try {
      const watcher = fs.watch(
        watchPath,
        { recursive: true, persistent: true },
        (eventType, filename) => {
          if (!filename) return;

          const fullPath = path.join(watchPath, filename);
          
          // Check if file should be ignored
          if (this.shouldIgnore(filename, ignorePaths)) return;

          this.logVerbose(`📝 ${eventType}: ${filename}`);
          this.scheduleReload(filename, eventType);
        }
      );

      watcher.on("error", (error) => {
        console.error(`❌ Watcher error for ${watchPath}:`, error.message);
        // Try to restart the watcher
        setTimeout(() => this.watchRecursively(watchPath, ignorePaths), 1000);
      });

      this.watchers.push(watcher);
    } catch (error) {
      console.error(`❌ Failed to watch ${watchPath}:`, error);
    }
  }

  private watchRecursivelyLegacy(
    dirPath: string,
    ignorePaths: string[]
  ): void {
    if (!fs.existsSync(dirPath)) return;

    const stats = fs.statSync(dirPath);
    if (stats.isDirectory()) {
      fs.readdirSync(dirPath).forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (!this.shouldIgnore(file, ignorePaths)) {
          this.watchRecursivelyLegacy(fullPath, ignorePaths);
        }
      });
    } else if (this.isWatchableFile(dirPath)) {
      fs.watchFile(dirPath, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          this.scheduleReload(dirPath, "change");
        }
      });
    }
  }

  private shouldIgnore(filename: string, ignorePaths: string[]): boolean {
    return ignorePaths.some(
      (ignore) =>
        filename.includes(ignore) ||
        filename.startsWith(".") ||
        !this.isWatchableFile(filename)
    );
  }

  private isWatchableFile(filename: string): boolean {
    const ext = path.extname(filename).slice(1);
    const watchExts = this.options.ext
      ? this.options.ext.split(",")
      : ["ts", "js", "json", "mjs", "cjs"];
    return watchExts.includes(ext);
  }

  private scheduleReload(filename: string, eventType: string): void {
    if (this.isReloading) return;

    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Debounce: wait for more changes
    const debounceMs = this.options.debounceMs || 300;
    this.debounceTimeout = setTimeout(() => {
      this.reload(filename, eventType);
    }, debounceMs);
  }

  private async reload(filename: string, eventType: string): Promise<void> {
    // Prevent rapid restarts
    const now = Date.now();
    if (now - this.lastRestartTime < 1000) {
      this.logVerbose("⏭️  Skipping restart (too soon)");
      return;
    }

    // If already building, queue this reload
    if (this.isBuilding) {
      this.buildQueue.push({ filename, eventType });
      this.logVerbose(`📋 Queued reload for: ${filename}`);
      return;
    }

    this.isReloading = true;
    this.restartAttempts++;

    console.log(`\n${"=".repeat(50)}`);
    this.log(`🔄 File ${eventType}: ${filename}`);
    this.log(`♻️  Restarting (attempt #${this.restartAttempts})...`);

    // Kill existing child process if running
    if (this.childProcess) {
      await this.killChildProcess();
    }

    // Run build command if specified
    if (this.options.buildCommand && !this.options.buildWatch) {
      const buildSuccess = await this.runBuild();
      if (!buildSuccess) {
        this.log("❌ Build failed, skipping restart");
        this.isReloading = false;
        // Process queued reloads
        this.processQueue();
        return;
      }
    }

    // Clear require cache for TypeScript/JavaScript files
    this.clearRequireCache();

    // Call custom onReload hook if provided
    if (this.options.onReload) {
      try {
        await this.options.onReload();
      } catch (error) {
        console.error("❌ onReload hook failed:", error);
      }
    }

    // Add configurable delay before restart
    const delay = this.options.delay || 100;
    setTimeout(() => {
      this.lastRestartTime = Date.now();

      if (this.options.execCommand) {
        this.startChildProcess();
      } else {
        this.restartCallback();
      }

      this.isReloading = false;
      this.log(`✅ Restart complete\n${"=".repeat(50)}\n`);

      // Process queued reloads
      this.processQueue();
    }, delay);
  }

  private async runBuild(): Promise<boolean> {
    if (!this.options.buildCommand) return true;

    this.isBuilding = true;
    this.log(`🔨 Building: ${this.options.buildCommand}`);

    return new Promise((resolve) => {
      const [command, ...args] = this.options.buildCommand!.split(" ");
      const buildTimeout = this.options.buildTimeout || 30000;

      const timeout = setTimeout(() => {
        this.log("⚠️  Build timeout, killing process");
        this.buildProcess?.kill("SIGKILL");
        this.isBuilding = false;
        resolve(false);
      }, buildTimeout);

      this.buildProcess = spawn(command, args, {
        stdio: this.options.verbose ? "inherit" : "pipe",
        env: { ...process.env, ...this.options.env },
        shell: true,
      });

      let output = "";
      if (!this.options.verbose && this.buildProcess.stdout) {
        this.buildProcess.stdout.on("data", (data) => {
          output += data.toString();
        });
      }

      if (!this.options.verbose && this.buildProcess.stderr) {
        this.buildProcess.stderr.on("data", (data) => {
          output += data.toString();
        });
      }

      this.buildProcess.on("exit", (code) => {
        clearTimeout(timeout);
        this.buildProcess = null;
        this.isBuilding = false;

        if (code === 0) {
          this.log("✅ Build successful");
          resolve(true);
        } else {
          this.log(`❌ Build failed with code ${code}`);
          if (!this.options.verbose && output) {
            console.error(output);
          }
          resolve(false);
        }
      });

      this.buildProcess.on("error", (error) => {
        clearTimeout(timeout);
        this.isBuilding = false;
        console.error("❌ Build error:", error.message);
        resolve(false);
      });
    });
  }

  private processQueue(): void {
    if (this.buildQueue.length === 0) return;

    // Get the most recent change from queue
    const lastChange = this.buildQueue[this.buildQueue.length - 1];
    this.buildQueue = [];

    this.logVerbose(`📋 Processing queued reload: ${lastChange.filename}`);
    this.scheduleReload(lastChange.filename, lastChange.eventType);
  }

  private startChildProcess(): void {
    if (!this.options.execCommand) return;

    const [command, ...args] = this.options.execCommand.split(" ");

    this.log(`🚀 Starting: ${this.options.execCommand}`);

    this.childProcess = spawn(command, args, {
      stdio: [
        "inherit",
        this.options.stdout !== false ? "inherit" : "ignore",
        this.options.stderr !== false ? "inherit" : "ignore",
      ],
      env: { ...process.env, ...this.options.env },
      shell: true,
    });

    this.childProcess.on("exit", (code, signal) => {
      this.logVerbose(`👋 Process exited (code: ${code}, signal: ${signal})`);
      
      if (code !== 0 && code !== null) {
        this.crashCount++;
        if (this.crashCount >= this.MAX_CRASHES) {
          console.error(`❌ Process crashed ${this.MAX_CRASHES} times. Stopping hot reload.`);
          this.stop();
        }
      }
      
      // Reset crash count after window
      setTimeout(() => {
        this.crashCount = Math.max(0, this.crashCount - 1);
      }, this.CRASH_WINDOW);
    });

    this.childProcess.on("error", (error) => {
      console.error("❌ Failed to start process:", error.message);
    });
  }

  private async killChildProcess(): Promise<void> {
    if (!this.childProcess) return;

    return new Promise((resolve) => {
      const signal = this.options.signal || "SIGTERM";
      const timeout = setTimeout(() => {
        this.logVerbose("⚠️  Force killing process (SIGKILL)");
        this.childProcess?.kill("SIGKILL");
        resolve();
      }, 5000);

      this.childProcess!.once("exit", () => {
        clearTimeout(timeout);
        this.childProcess = null;
        resolve();
      });

      this.logVerbose(`🛑 Sending ${signal} to process`);
      this.childProcess!.kill(signal);
    });
  }

  private clearRequireCache(): void {
    // Clear all cached modules except node_modules
    Object.keys(require.cache).forEach((id) => {
      if (!id.includes("node_modules")) {
        delete require.cache[id];
      }
    });
  }

  private setupProcessHandlers(): void {
    const cleanup = async () => {
      this.log("\n👋 Shutting down hot reload...");
      await this.stop();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("SIGHUP", cleanup);
  }

  private log(message: string): void {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  private logVerbose(message: string): void {
    if (this.options.verbose) {
      this.log(message);
    }
  }

  async stop(): Promise<void> {
    // Kill child process first
    if (this.childProcess) {
      await this.killChildProcess();
    }

    // Kill build process
    if (this.buildProcess) {
      this.log("🛑 Stopping build process");
      this.buildProcess.kill("SIGTERM");
      this.buildProcess = null;
    }

    // Close all watchers
    this.watchers.forEach((watcher) => watcher.close());
    this.watchers = [];

    // Clear legacy watchers
    this.fileWatchers.forEach((timeout) => clearTimeout(timeout));
    this.fileWatchers.clear();

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.log("✅ Hot reload stopped");
  }
}

// Example usage for NestJS-like framework:
// 
// Option 1: Manual build on each change (like nodemon)
// const hotReload = new HotReloadManager(
//   {
//     enabled: true,
//     watchPaths: ["src"],
//     ext: "ts,js,json",
//     buildCommand: "npm run build",  // or "tsc" or "nest build"
//     execCommand: "node dist/main.js",
//     buildTimeout: 30000,
//     verbose: true,
//     delay: 1000,
//     env: { NODE_ENV: "development" }
//   },
//   () => {
//     console.log("Application restarted!");
//   }
// );
// 
// Option 2: Use TypeScript watch mode (faster, recommended)
// const hotReload = new HotReloadManager(
//   {
//     enabled: true,
//     watchPaths: ["dist"], // Watch the compiled output
//     ignore: ["node_modules", "src", ".git"], // Ignore source files
//     ext: "js,json",
//     buildCommand: "tsc --watch", // or "nest start --watch"
//     buildWatch: true, // Keep build process running
//     execCommand: "node dist/main.js",
//     verbose: true,
//     delay: 500,
//     env: { NODE_ENV: "development" }
//   },
//   () => {
//     console.log("Application restarted!");
//   }
// );
// 
// hotReload.start();
