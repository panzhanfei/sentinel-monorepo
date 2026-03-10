import {
  createPublicClient,
  http,
  erc20Abi,
  Address,
  parseAbiItem,
} from 'viem';
import { mainnet } from 'viem/chains';
import { SUPPORTED_TOKENS, COMMON_SPENDERS } from './constants';

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
  // transport: http(process.env.RPC_URL || 'http://127.0.0.1:8545'), // 确保连上 Anvil
});

export async function batchAuditAllowances(
  userAddress: Address
): Promise<AllowanceResult[]> {
  // --- 💡 第一步：动态发现 (智能扫描的核心) ---
  // 查找用户所有的 Approval 事件记录
  const approvalLogs = await publicClient.getLogs({
    event: parseAbiItem(
      'event Approval(address indexed owner, address indexed spender, uint256 value)'
    ),
    args: { owner: userAddress },
    // fromBlock: 0n, // 在 Anvil 上可以从 0 开始，主网建议限制范围
    fromBlock: 'latest',
  });

  // 提取所有交互过的【代币地址】和【被授权地址(Spender)】
  const discoveredPairs = approvalLogs.map((log) => ({
    tokenAddress: log.address,
    spenderAddress: log.args.spender as Address,
  }));

  // --- 💡 第二步：构造扫描队列 ---
  const scanQueue = [];

  // A. 加入动态发现的对
  for (const pair of discoveredPairs) {
    scanQueue.push({
      address: pair.tokenAddress,
      spenderAddress: pair.spenderAddress,
      spenderName: 'Unknown / Custom Contract',
    });
  }

  // B. (可选) 保留原有的常用列表兜底
  for (const token of SUPPORTED_TOKENS) {
    for (const spender of COMMON_SPENDERS) {
      scanQueue.push({
        address: token.address as Address,
        spenderAddress: spender.address as Address,
        spenderName: spender.name,
      });
    }
  }

  // 去重 (防止重复扫描)
  const uniqueQueue = scanQueue.filter(
    (v, i, a) =>
      a.findIndex(
        (t) => t.address === v.address && t.spenderAddress === v.spenderAddress
      ) === i
  );

  // --- 💡 第三步：执行 Multicall 批量查询 ---
  const finalResults: AllowanceResult[] = [];
  const CHUNK_SIZE = 50;

  for (let i = 0; i < uniqueQueue.length; i += CHUNK_SIZE) {
    const chunk = uniqueQueue.slice(i, i + CHUNK_SIZE);

    // 我们需要获取 token 的 symbol 和 decimals 才能正确显示
    // 实际生产环境建议用 multicall 同时查 symbol, decimals 和 allowance
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

  return finalResults;
}
