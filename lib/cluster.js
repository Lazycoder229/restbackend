const cluster = require("cluster");
const os = require("os");

class ClusterManager {
  constructor(options = {}) {
    this.workers = options.workers || os.cpus().length;
    this.respawn = options.respawn !== false;
    this.onWorkerStart = options.onWorkerStart || (() => {});
    this.onWorkerExit = options.onWorkerExit || (() => {});
  }

  start(app, port) {
    if (cluster.isMaster || cluster.isPrimary) {
      console.log(`Master ${process.pid} is running`);
      console.log(`Starting ${this.workers} workers...`);

      // Fork workers
      for (let i = 0; i < this.workers; i++) {
        this.forkWorker();
      }

      // Handle worker exit
      cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died (${signal || code})`);
        this.onWorkerExit(worker, code, signal);

        // Respawn worker
        if (this.respawn) {
          console.log("Starting new worker...");
          this.forkWorker();
        }
      });

      // Graceful shutdown
      process.on("SIGTERM", () => {
        console.log("SIGTERM received, shutting down gracefully");
        this.shutdown();
      });

      process.on("SIGINT", () => {
        console.log("SIGINT received, shutting down gracefully");
        this.shutdown();
      });
    } else {
      // Worker process
      app.listen(port, () => {
        console.log(`Worker ${process.pid} started on port ${port}`);
        this.onWorkerStart(cluster.worker);
      });

      // Handle worker messages
      process.on("message", (msg) => {
        if (msg === "shutdown") {
          console.log(`Worker ${process.pid} shutting down...`);
          process.exit(0);
        }
      });
    }
  }

  forkWorker() {
    const worker = cluster.fork();

    worker.on("online", () => {
      console.log(`Worker ${worker.process.pid} is online`);
    });

    return worker;
  }

  shutdown() {
    console.log("Shutting down all workers...");

    Object.values(cluster.workers || {}).forEach((worker) => {
      worker.send("shutdown");

      // Force kill after 10 seconds
      setTimeout(() => {
        if (!worker.isDead()) {
          worker.kill("SIGKILL");
        }
      }, 10000);
    });

    // Exit master after all workers are done
    setTimeout(() => {
      process.exit(0);
    }, 12000);
  }

  // Hot reload workers
  reload() {
    if (!cluster.isMaster && !cluster.isPrimary) {
      console.log("reload() can only be called from master process");
      return;
    }

    const workers = Object.values(cluster.workers || {});
    let index = 0;

    const reloadNext = () => {
      if (index >= workers.length) {
        console.log("All workers reloaded");
        return;
      }

      const worker = workers[index++];
      const newWorker = this.forkWorker();

      newWorker.once("listening", () => {
        worker.disconnect();

        setTimeout(() => {
          if (!worker.isDead()) {
            worker.kill();
          }
          reloadNext();
        }, 1000);
      });
    };

    reloadNext();
  }
}

function createCluster(options) {
  return new ClusterManager(options);
}

module.exports = createCluster;
module.exports.ClusterManager = ClusterManager;
// Usage example:
// const createCluster = require('./lib/cluster');
// const express = require('express');
// const app = express();
