import { Request, Response } from 'express';
import { UserService } from '@/services/user';

export const getTelegramChatId = async (req: Request, res: Response) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const telegramChatId = await UserService.getTelegramChatIdByAddress(
      req.user.sub
    );
    res.json({ telegramChatId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const updateTelegramChatId = async (req: Request, res: Response) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!('telegramChatId' in req.body)) {
      return res.status(400).json({ error: 'telegramChatId is required' });
    }
    const raw = req.body.telegramChatId;
    if (raw !== null && typeof raw !== 'string') {
      return res
        .status(400)
        .json({ error: 'telegramChatId must be string or null' });
    }
    const normalized =
      raw === null || raw.trim() === '' ? null : raw.trim();

    const result = await UserService.updateTelegramChatIdByAddress(
      req.user.sub,
      normalized
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
