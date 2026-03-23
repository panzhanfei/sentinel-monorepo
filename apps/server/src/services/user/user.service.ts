import { prisma } from '@/client/prisma.client';

export class UserService {
  static async getTelegramChatIdByAddress(address: string) {
    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      select: { telegramChatId: true },
    });
    return user?.telegramChatId ?? null;
  }

  static async updateTelegramChatIdByAddress(
    address: string,
    telegramChatId: string | null
  ) {
    const addr = address.toLowerCase();
    return prisma.user.upsert({
      where: { address: addr },
      create: { address: addr, telegramChatId: telegramChatId },
      update: { telegramChatId: telegramChatId },
      select: { telegramChatId: true },
    });
  }
}
