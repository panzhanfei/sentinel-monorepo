// server/src/routes/chat.ts

import express from 'express';
import {
  createSession,
  chatStream,
  getChatMessages,
} from '@/modules/chat/controller';

const router = express.Router();

router.get('/chat/stream', chatStream);
router.get('/chat/messages', getChatMessages);
router.post('/chat/session', createSession);

export default router;
