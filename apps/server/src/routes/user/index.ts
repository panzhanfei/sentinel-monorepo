import { Router } from 'express';
import * as UserController from '@/controllers/user';

const router = Router();

router.get('/user/telegram-chat-id', UserController.getTelegramChatId);
router.patch('/user/telegram-chat-id', UserController.updateTelegramChatId);

export default router;
