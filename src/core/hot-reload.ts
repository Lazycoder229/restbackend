import * as fs from "fs";
import * as path from "path";

export interface HotReloadOptions {
  enabled?: boolean;
  watchPaths?: string[];
  ignore?: string[];
  debounceMs?: number;
  onReload?: () => void;
}

export class HotReloadManager {
  private watchers: fs.FSWatcher[] = [];
  private restartCallback: () => void;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private isReloading = false;

  constructor(private options: HotReloadOptions, restartCallback: () => void) {
    this.restartCallback = restartCallback;
  }

  start(): void {
    if (!this.options.enabled) return;

    const watchPaths = this.options.watchPaths || ["src"];
    const ignorePaths = this.options.ignore || [
      "node_modules",
      "dist",
      ".git",
      "*.log",
    ];

    console.log("🔥 Hot reload enabled - watching for changes...");

    watchPaths.forEach((watchPath: string) => {
      if (!fs.existsSync(watchPath)) {
        console.warn(`⚠️  Watch path does not exist: ${watchPath}`);
        return;
      }

      const watcher = fs.watch(
        watchPath,
        { recursive: true },
        (_eventType, filename) => {
          if (!filename) return;

          // Check if file should be ignored
          const shouldIgnore = ignorePaths.some(
            (ignore) =>
              filename.includes(ignore) ||
              filename.startsWith(".") ||
              !this.isWatchableFile(filename)
          );

          if (shouldIgnore) return;

          this.scheduleReload(filename);
        }
      );

      this.watchers.push(watcher);
    });
  }

  private isWatchableFile(filename: string): boolean {
    const ext = path.extname(filename);
    return [".ts", ".js", ".json"].includes(ext);
  }

  private scheduleReload(filename: string): void {
    if (this.isReloading) return;

    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Debounce: wait for more changes (configurable, default 300ms)
    const debounceMs = this.options.debounceMs || 300;
    this.debounceTimeout = setTimeout(() => {
      this.reload(filename);
    }, debounceMs);
  }

  private reload(filename: string): void {
    this.isReloading = true;

    console.log(`\n🔄 File changed: ${filename}`);
    console.log("♻️  Reloading application...\n");

    // Clear require cache for TypeScript/JavaScript files
    this.clearRequireCache();

    // Call custom onReload hook if provided
    if (this.options.onReload) {
      this.options.onReload();
    }

    // Call restart callback
    setTimeout(() => {
      this.restartCallback();
      this.isReloading = false;
    }, 100);
  }

  private clearRequireCache(): void {
    // Clear all cached modules except node_modules
    Object.keys(require.cache).forEach((id) => {
      if (!id.includes("node_modules")) {
        delete require.cache[id];
      }
    });
  }

  stop(): void {
    this.watchers.forEach((watcher) => watcher.close());
    this.watchers = [];

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }
}
