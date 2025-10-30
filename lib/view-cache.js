const fs = require("fs");
const path = require("path");

class ViewCache {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.cache = new Map();
    this.maxSize = options.maxSize || 100;
    this.maxAge = options.maxAge || 3600000; // 1 hour
  }

  get(filepath) {
    if (!this.enabled) return null;

    const cached = this.cache.get(filepath);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(filepath);
      return null;
    }

    // Update access time for LRU
    cached.lastAccess = Date.now();
    return cached.content;
  }

  set(filepath, content) {
    if (!this.enabled) return;

    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(filepath, {
      content,
      timestamp: Date.now(),
      lastAccess: Date.now(),
    });
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccess < oldestTime) {
        oldestTime = value.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  clear() {
    this.cache.clear();
  }

  delete(filepath) {
    this.cache.delete(filepath);
  }

  size() {
    return this.cache.size;
  }

  // Watch for file changes and invalidate cache
  watch(filepath) {
    if (!this.enabled) return;

    try {
      fs.watch(filepath, (eventType) => {
        if (eventType === "change") {
          this.delete(filepath);
        }
      });
    } catch (err) {
      console.error(`Failed to watch file: ${filepath}`, err);
    }
  }
}

module.exports = ViewCache;
// Usage example:
// const ViewCache = require('./view-cache');
// const cache = new ViewCache({ enabled: true, maxSize: 50, maxAge: 60000 });  // cache.set('/path/to/view.html', '<html>...</html>');
// const content = cache.get('/path/to/view.html');  // Retrieve cached content
// cache.watch('/path/to/view.html');  // Watch for changes to the file
// cache.clear();  // Clear the cache
// console.log(cache.size());  // Get the current size of the cache
// cache.delete('/path/to/view.html');  // Delete a specific cached item
// cache.set('/path/to/view.html', '<html>...</html>');  // Set a new cached item
// console.log(cache.get('/path/to/view.html'));  // Get the content of the cached item
// cache.evictLRU();  // Manually evict the least recently used item from the cache
// console.log(cache.size());  // Check the size of the cache after eviction
