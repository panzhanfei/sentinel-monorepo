import {
  createPublicClient,
  http,
  erc20Abi,
  Address,
  parseAbiItem,
  BlockNumber,
} from 'viem';
import { mainnet } from 'viem/chains';
import { SUPPORTED_TOKENS, COMMON_SPENDERS } from './constants';
export { type Address } from 'viem';

export interface AllowanceResult {
  tokenSymbol: string;
  tokenAddress: string;
  spenderName: string;
  spenderAddress: string;
  allowance: string; // 处理后的字符串
  rawAllowance: string; // 原始 BigInt 字符串
}

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('http://127.0.0.1:8545'),
  // transport: http(process.env.RPC_URL || 'http://127.0.0.1:8545'),
});

/**
 * 批量审计指定地址的所有有效授权
 * @param userAddress 要审计的地址
 * @param fromBlock 起始区块，默认自动计算最近 maxBlocksToScan 个块
 * @param maxBlocksToScan 最多扫描的区块数量，默认 10000
 * @param chunkSize 每次查询的区块范围大小，必须 ≤ RPC 限制（例如 QuickNode 免费版为 5）
 */
export async function batchAuditAllowances(
  userAddress: Address,
  fromBlock?: BlockNumber,
  maxBlocksToScan = 10000n,
  chunkSize = 5n // ⚠️ 关键修改：将块范围限制在 5 以内
): Promise<AllowanceResult[]> {
  const latestBlock = await publicClient.getBlockNumber();
  let startBlock: BlockNumber;

  if (fromBlock !== undefined) {
    startBlock = fromBlock;
  } else {
    // 默认扫描最近 maxBlocksToScan 个块
    startBlock =
      latestBlock > maxBlocksToScan ? latestBlock - maxBlocksToScan + 1n : 0n;
    console.log(
      `[batchAuditAllowances] 自动设置起始块: ${startBlock} (latest=${latestBlock})`
    );
  }

  // 分块查询 Approval 事件
  const approvalLogs = [];
  let currentFrom = startBlock;

  while (currentFrom <= latestBlock) {
    const toBlock = currentFrom + chunkSize - 1n;
    const safeToBlock = toBlock > latestBlock ? latestBlock : toBlock;

    console.log(
      `[batchAuditAllowances] 查询区块范围: ${currentFrom} 到 ${safeToBlock} (跨度 ${safeToBlock - currentFrom + 1n} 块)`
    );
    try {
      const chunkLogs = await publicClient.getLogs({
        event: parseAbiItem(
          'event Approval(address indexed owner, address indexed spender, uint256 value)'
        ),
        args: { owner: userAddress },
        fromBlock: currentFrom,
        toBlock: safeToBlock,
      });
      approvalLogs.push(...chunkLogs);
      console.log(
        `[batchAuditAllowances] 本块范围找到 ${chunkLogs.length} 条日志`
      );
    } catch (error) {
      console.error(
        `[batchAuditAllowances] 区块范围 ${currentFrom}-${safeToBlock} 查询失败:`,
        error
      );
      // 可选择继续或抛出，这里抛出以便调试
      throw error;
    }

    if (safeToBlock === latestBlock) break;
    currentFrom = safeToBlock + 1n;
  }

  console.log(
    `[batchAuditAllowances] 总共找到 ${approvalLogs.length} 条 Approval 日志`
  );

  // 后续步骤（构建扫描队列、去重、multicall）保持不变
  // ... (从你的原代码中复制后续部分，保持完整)
  // 注意：以下代码段需完整粘贴，此处省略以节省篇幅，但你应保留原有所有逻辑
  const discoveredPairs = approvalLogs.map((log) => ({
    tokenAddress: log.address,
    spenderAddress: log.args.spender as Address,
  }));

  const scanQueue = [];
  for (const pair of discoveredPairs) {
    scanQueue.push({
      address: pair.tokenAddress,
      spenderAddress: pair.spenderAddress,
      spenderName: 'Unknown / Custom Contract',
    });
  }
  for (const token of SUPPORTED_TOKENS) {
    for (const spender of COMMON_SPENDERS) {
      scanQueue.push({
        address: token.address as Address,
        spenderAddress: spender.address as Address,
        spenderName: spender.name,
      });
    }
  }
  const uniqueQueue = scanQueue.filter(
    (v, i, a) =>
      a.findIndex(
        (t) => t.address === v.address && t.spenderAddress === v.spenderAddress
      ) === i
  );

  const finalResults: AllowanceResult[] = [];
  const MULTICALL_CHUNK_SIZE = 50;

  for (let i = 0; i < uniqueQueue.length; i += MULTICALL_CHUNK_SIZE) {
    const chunk = uniqueQueue.slice(i, i + MULTICALL_CHUNK_SIZE);
    const results = await publicClient.multicall({
      contracts: chunk.flatMap((c) => [
        {
          address: c.address,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [userAddress, c.spenderAddress],
        },
        { address: c.address, abi: erc20Abi, functionName: 'symbol' },
        { address: c.address, abi: erc20Abi, functionName: 'decimals' },
      ]),
    });

    for (let j = 0; j < chunk.length; j++) {
      const baseIdx = j * 3;
      const allowanceRes = results[baseIdx];
      const symbolRes = results[baseIdx + 1];
      const decimalRes = results[baseIdx + 2];

      if (
        allowanceRes.status === 'success' &&
        BigInt(allowanceRes.result as bigint) > 0n
      ) {
        const symbol =
          symbolRes.status === 'success' ? String(symbolRes.result) : 'UNKNOWN';
        const decimals =
          decimalRes.status === 'success' ? Number(decimalRes.result) : 18;
        const rawValue = allowanceRes.result as bigint;

        finalResults.push({
          tokenSymbol: symbol,
          tokenAddress: chunk[j].address,
          spenderName: chunk[j].spenderName,
          spenderAddress: chunk[j].spenderAddress,
          allowance: (Number(rawValue) / 10 ** decimals).toString(),
          rawAllowance: rawValue.toString(),
        });
      }
    }
  }

  console.log(
    `[batchAuditAllowances] 最终找到 ${finalResults.length} 条有效授权`
  );
  return finalResults;
}
