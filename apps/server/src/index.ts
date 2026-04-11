import 'module-alias/register';
import cluster from 'node:cluster';
import os from 'node:os';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from '@/config';
import { redis } from '@/client';
import { prisma } from '@/client/prisma.client';
import { startScan, stopScan } from '@/workers/scanner';
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

  const server = app.listen(PORT, () => {
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

  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Server] 收到 ${signal}，优雅退出中...`);
    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    } catch (e) {
      console.error('[Server] HTTP 关闭失败:', e);
    }
    try {
      await stopScan();
    } catch (e) {
      console.error('[Server] 审计队列关闭失败:', e);
    }
    try {
      await redis.quit();
    } catch (e) {
      console.error('[Server] Redis 关闭失败:', e);
    }
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error('[Server] Prisma 断开失败:', e);
    }
    process.exit(0);
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

/** 仅生产环境启用 Node cluster；开发/测试保持单进程便于调试与热重载 */
const useCluster = env.NODE_ENV === 'production';

if (useCluster) {
  if (cluster.isPrimary) {
    let respawnWorkers = true;
    let primaryShuttingDown = false;
    const shutdownPrimary = async (signal: NodeJS.Signals) => {
      if (primaryShuttingDown) return;
      primaryShuttingDown = true;
      console.log(
        `[Cluster] primary 收到 ${signal}，停止拉起 worker 并通知子进程退出...`
      );
      respawnWorkers = false;
      const workers = Object.values(cluster.workers ?? {}).filter(
        (w): w is cluster.Worker => w != null
      );
      for (const w of workers) {
        w.kill('SIGTERM');
      }
      if (workers.length === 0) {
        process.exit(0);
        return;
      }
      await Promise.all(
        workers.map(
          (w) => new Promise<void>((resolve) => w.once('exit', () => resolve()))
        )
      );
      console.log('[Cluster] 全部 worker 已退出');
      process.exit(0);
    };
    process.once('SIGTERM', () => void shutdownPrimary('SIGTERM'));
    process.once('SIGINT', () => void shutdownPrimary('SIGINT'));

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
