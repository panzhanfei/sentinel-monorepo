// apps/main-next/app/dashboard/page.tsx
"use client"; // Next.js App Router 必须声明

import { useEffect, useState } from "react";

const Dashboard = () => {
  const [balance, setBalance] = useState("0.00");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // 2. 静默刷新数据
    const refreshData = async () => {
      setIsRefreshing(true);
      try {
        // 模拟 API 请求，后续替换为你的 axios 调用
        setTimeout(() => {
          const mockFreshBalance = "24,580.12";
          setBalance(mockFreshBalance);
          sessionStorage.setItem("sentinel_total_balance", mockFreshBalance); // 更新缓存
          setIsRefreshing(false);
        }, 1500);
      } catch (e) {
        setIsRefreshing(false);
      }
    };

    refreshData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* 资产卡片部分 */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-400">总资产净值</span>
          {isRefreshing && (
            <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">
            ${balance}
          </h1>
          <span className="text-lg font-semibold text-emerald-500">+4.2%</span>
        </div>
      </section>

      {/* 核心功能区 - 简易网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 资产分布详情 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800">主流资产构成</h3>
          <div className="space-y-3">
            {[
              { name: "Ethereum", symbol: "ETH", val: "8.42", price: "$2,341" },
              {
                name: "USD Coin",
                symbol: "USDC",
                val: "5,000",
                price: "$1.00",
              },
            ].map((token) => (
              <div
                key={token.symbol}
                className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-full"></div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {token.symbol}
                    </div>
                    <div className="text-xs text-gray-400">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {token.val}
                  </div>
                  <div className="text-xs text-gray-400">{token.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最近安全活动 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800">安全审计快报</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500"></div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  钱包地址风险扫描完成
                </p>
                <p className="text-xs text-gray-400">10分钟前 · 状态: 安全</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-2 h-2 mt-2 rounded-full bg-amber-500"></div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  检测到 1 个异常授权合约
                </p>
                <p className="text-xs text-gray-400">2小时前 · 建议处理</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
