import { prisma, type Prisma } from '@sentinel/database';

type AllowanceLike = {
  tokenAddress?: string;
  spenderAddress?: string;
};

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
    const job = await prisma.job.findFirst({
      where: {
        user: { address: address.toLowerCase() },
        // status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!job?.result || typeof job.result !== 'object') {
      return job;
    }

    const result = job.result as Record<string, unknown>;
    const allowances = Array.isArray(result.allowances)
      ? (result.allowances as AllowanceLike[])
      : null;

    // 仅对快照之后发生的“撤销动作”做过滤，避免旧快照刷新后重新出现。
    if (!allowances?.length) {
      return job;
    }

    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      select: { id: true },
    });
    if (!user) return job;

    const revoked = await prisma.revokedAllowance.findMany({
      where: {
        userId: user.id,
        createdAt: { gt: job.createdAt },
      },
      select: { tokenAddress: true, spenderAddress: true },
    });
    if (!revoked.length) return job;

    const hiddenKeys = new Set(
      revoked.map(
        (item) =>
          `${item.tokenAddress.toLowerCase()}::${item.spenderAddress.toLowerCase()}`
      )
    );

    const filteredAllowances = allowances.filter((item) => {
      const token = item.tokenAddress?.toLowerCase();
      const spender = item.spenderAddress?.toLowerCase();
      if (!token || !spender) return true;
      return !hiddenKeys.has(`${token}::${spender}`);
    });

    return {
      ...job,
      result: {
        ...result,
        allowances: filteredAllowances,
      },
    };
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

  static async markAllowanceRevoked(
    address: string,
    tokenAddress: string,
    spenderAddress: string
  ) {
    const normalizedAddress = address.toLowerCase();
    const normalizedToken = tokenAddress.toLowerCase();
    const normalizedSpender = spenderAddress.toLowerCase();

    const user = await prisma.user.upsert({
      where: { address: normalizedAddress },
      update: {},
      create: { address: normalizedAddress },
    });

    return await prisma.revokedAllowance.upsert({
      where: {
        userId_tokenAddress_spenderAddress: {
          userId: user.id,
          tokenAddress: normalizedToken,
          spenderAddress: normalizedSpender,
        },
      },
      update: {
        createdAt: new Date(),
      },
      create: {
        userId: user.id,
        tokenAddress: normalizedToken,
        spenderAddress: normalizedSpender,
      },
    });
  }
}
