import { useEffect } from "react";
import { useWujieStore } from "@/stores";
import { publicClient } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchTransactions } from "@/api/audit";

const App = () => {
  const wujieWeb3Date = useWujieStore((state) => state.wujieWeb3Date);
  const wujieAfterMount = useWujieStore((state) => state.wujieAfterMount);
  const { address } = wujieWeb3Date;

  const { data: txCount } = useQuery({
    queryKey: ["txCount", address],
    queryFn: () =>
      publicClient.getTransactionCount({ address: address as `0x${string}` }),
    enabled: !!address,
  });

  const { data: txList, isLoading } = useQuery({
    queryKey: ["transactions", address],
    queryFn: () => fetchTransactions(address!),
    enabled: !!address,
  });

  useEffect(() => {
    wujieAfterMount?.();
  }, [wujieAfterMount]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 头部状态区 */}
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            安全审计中心
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            实时扫描链上指纹，评估账户风险等级
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            当前审计地址
          </span>
          <p className="text-sm font-mono text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mt-1">
            {address
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : "未连接钱包"}
          </p>
        </div>
      </section>

      {/* 数据概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase">
            历史交互强度
          </p>
          <p className="text-3xl font-black text-gray-900 mt-2">
            {txCount ?? 0}
          </p>
          <p className="text-xs text-emerald-500 font-medium mt-1">活跃账户</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase">
            风险合约授权
          </p>
          <p className="text-3xl font-black text-gray-900 mt-2">0</p>
          <p className="text-xs text-gray-300 font-medium mt-1">未检测到威胁</p>
        </div>
      </div>

      {/* 交易列表区 */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">历史足迹扫描</h3>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>

        <div className="p-2">
          {isLoading ? (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-400 animate-pulse">
                正在深度扫描链上数据...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-4">交易哈希</th>
                    <th className="px-6 py-4">交易金额</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {txList?.map((tx: { hash: string; value: string }) => (
                    <tr
                      key={tx.hash}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">
                          {tx.hash.slice(0, 14)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">
                          {parseFloat(tx.value) / 1e18}{" "}
                          <span className="text-gray-400 font-normal">ETH</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors">
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default App;
