import { Request, Response } from 'express';
import { AuthService } from '@/services';

const authService = new AuthService();

export const getNonce = async (req: Request, res: Response) => {
  const { address } = req.query; // 从 Query 参数获取地址

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    const nonce = await authService.generateNonce(address);
    res.json({ nonce });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
