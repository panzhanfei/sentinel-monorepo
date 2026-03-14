import 'module-alias/register';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from '@/config';
import { startScan } from '@/workers/scanner';
import router from '@/routes';

const app = express();
const PORT = env.PORT;
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  startScan().catch((err) => {
    console.error('❌ Worker 启动发生致命错误:', err);
  });
});
