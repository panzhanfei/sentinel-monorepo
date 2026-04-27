import { Request, Response } from 'express';
import { UserService } from '@/services';
import { HttpError, sendSuccess } from '@/utils';

export const getTelegramChatId = async (req: Request, res: Response) => {
  if (!req.user?.sub) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }
  const telegramChatId = await UserService.getTelegramChatIdByAddress(
    req.user.sub
  );
  sendSuccess(res, { telegramChatId });
};

export const updateTelegramChatId = async (req: Request, res: Response) => {
  if (!req.user?.sub) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }
  if (!('telegramChatId' in req.body)) {
    throw new HttpError(
      400,
      'telegramChatId is required',
      'TELEGRAM_CHAT_ID_REQUIRED'
    );
  }
  const raw = req.body.telegramChatId;
  if (raw !== null && typeof raw !== 'string') {
    throw new HttpError(
      400,
      'telegramChatId must be string or null',
      'INVALID_TELEGRAM_CHAT_ID'
    );
  }
  const normalized =
    raw === null || raw.trim() === '' ? null : raw.trim();

  const result = await UserService.updateTelegramChatIdByAddress(
    req.user.sub,
    normalized
  );
  sendSuccess(res, result);
};
