// server/src/routes/chat.ts

import express from 'express';
import { createSession, chatStream } from '@/modules/chat/controller';

const router = express.Router();

router.get('/chat/stream', chatStream);
router.post('/chat/session', createSession);

export default router;
