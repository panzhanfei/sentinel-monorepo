import { Router } from 'express';
import * as UserController from '@/controllers/user';
import { asyncHandler } from '@/middlewares';

const router = Router();

router.get(
  '/user/telegram-chat-id',
  asyncHandler(UserController.getTelegramChatId)
);
router.patch(
  '/user/telegram-chat-id',
  asyncHandler(UserController.updateTelegramChatId)
);

export default router;
