import 'module-alias/register';
import express from 'express';
import { env } from '@/config';
import { startWorker } from '@/workers/scanner';
import router from '@/routes';

const app = express();
const PORT = env.PORT;

app.use(router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  startWorker().catch((err) => {
    console.error('❌ Worker 启动发生致命错误:', err);
  });
});
