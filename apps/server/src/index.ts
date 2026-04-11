import 'module-alias/register';
import cluster from 'node:cluster';
import os from 'node:os';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from '@/config';
import { startScan } from '@/workers/scanner';
import router from '@/routes';
import { errorHandler } from '@/middlewares';

const PORT = env.PORT;

function startWorker(mode: 'standalone' | 'cluster-worker' = 'standalone') {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  app.use(router);
  app.use(errorHandler);

  app.listen(PORT, () => {
    if (mode === 'cluster-worker') {
      console.log(
        `[Cluster] worker pid=${process.pid} listening on http://localhost:${PORT}`
      );
    } else {
      console.log(`Server is running on http://localhost:${PORT}`);
    }
    startScan().catch((err) => {
      console.error('❌ Worker 启动发生致命错误:', err);
    });
  });
}

/** 仅生产环境启用 Node cluster；开发/测试保持单进程便于调试与热重载 */
const useCluster = env.NODE_ENV === 'production';

if (useCluster) {
  if (cluster.isPrimary) {
    let respawnWorkers = true;
    const stopCluster = () => {
      respawnWorkers = false;
      for (const w of Object.values(cluster.workers ?? {})) {
        w?.kill('SIGTERM');
      }
    };
    process.once('SIGTERM', stopCluster);
    process.once('SIGINT', stopCluster);

    const count = env.CLUSTER_WORKERS ?? os.availableParallelism();
    console.log(
      `[Cluster] primary pid=${process.pid}, forking ${count} workers`
    );
    for (let i = 0; i < count; i++) {
      cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
      if (worker.exitedAfterDisconnect || !respawnWorkers) {
        return;
      }
      const reason = signal ?? code ?? 'unknown';
      console.warn(
        `[Cluster] worker pid=${worker.process.pid} exited (${reason}), respawning`
      );
      cluster.fork();
    });
  } else {
    startWorker('cluster-worker');
  }
} else {
  startWorker();
}
