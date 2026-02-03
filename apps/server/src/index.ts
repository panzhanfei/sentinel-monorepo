import 'module-alias/register';
import express from 'express';
import { env } from '@/config';
import router from '@/routes';

const app = express();
const PORT = env.PORT;

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use(router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
