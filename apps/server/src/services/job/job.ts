import { prisma, type Prisma } from '@sentinel/database';

export class JobService {
  static async createJob(address: string) {
    const user = await prisma.user.upsert({
      where: { address: address.toLowerCase() },
      update: {},
      create: { address: address.toLowerCase() },
    });

    return await prisma.job.create({
      data: {
        userId: user.id,
        type: 'SCAN_SECURITY',
        status: 'PENDING',
        progress: 0,
      },
    });
  }

  static async updateJob(jobId: string, data: Prisma.JobUpdateInput) {
    return await prisma.job.update({
      where: { id: jobId },
      data,
    });
  }

  static async getJobById(jobId: string) {
    return await prisma.job.findUnique({
      where: { id: jobId },
      include: { user: true },
    });
  }

  static async getLatestJob(address: string) {
    return await prisma.job.findFirst({
      where: {
        user: { address: address.toLowerCase() },
        // status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 用于对话场景：只认最近一次成功扫描，避免把 PENDING 任务当成「无数据」误判 */
  static async getLatestCompletedJob(address: string) {
    return await prisma.job.findFirst({
      where: {
        user: { address: address.toLowerCase() },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
