import express from 'express';
import * as ChatController from '@/controllers/chat';
import { asyncHandler } from '@/middlewares';

const router = express.Router();

router.get('/chat/stream', asyncHandler(ChatController.chatStream));
router.get(
  '/chat/messages',
  asyncHandler(ChatController.getChatMessages)
);
router.post(
  '/chat/session',
  asyncHandler(ChatController.createSession)
);

export default router;
