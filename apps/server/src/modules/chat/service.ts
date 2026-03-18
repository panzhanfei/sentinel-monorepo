import { prisma } from '@sentinel/database';

export class ChatService {
  static async createSession(userId: string, address: string) {
    return prisma.chatSession.create({
      data: {
        userId,
        address: address.toLowerCase(),
      },
    });
  }

  static async addMessage(
    sessionId: string,
    role: string,
    agent: string,
    content: string,
    status: string = 'done'
  ) {
    return prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        agent,
        content,
        status,
      },
    });
  }

  static async getMessages(sessionId: string) {
    return prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
