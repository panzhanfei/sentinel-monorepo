"use client";
import { useState } from "react";
import { authFetch } from "@/app/src/utils/authFetch";

export default function DeepScanControl({ address }: { address: string }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  // 轮询函数：每秒查一次进度
  const checkStatus = async () => {
    const res = await authFetch(`/api/scan/status?address=${address}`);
    const data = await res.json();

    setProgress(data.progress);
    setStatus(data.status);

    if (data.status === "completed") {
      setLoading(false); // 停止 loading
      return true; // 结束轮询
    }
    return false;
  };

  const startScan = async () => {
    setLoading(true);
    // 1. 触发后端扫描
    await authFetch("/api/scan/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    // 2. 开启轮询
    const timer = setInterval(async () => {
      const isDone = await checkStatus();
      if (isDone) clearInterval(timer);
    }, 1000);
  };

  return (
    <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">深度安全扫描 (AI 驱动)</h3>
        <button
          onClick={startScan}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium ${loading ? "bg-gray-700" : "bg-blue-600 hover:bg-blue-500"} text-white transition-all`}
        >
          {loading ? "正在分析..." : "开始扫描"}
        </button>
      </div>

      {/* 进度条 UI */}
      {(loading || progress > 0) && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              状态: <b className="text-blue-400">{status}</b>
            </span>
            <span className="text-blue-400 font-mono">{progress}%</span>
          </div>
          {/* 进度条底座 */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            {/* 进度条填充 */}
            <div
              className="h-full bg-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 italic">
            正在调用 AI 猎人 Agent 分析合约字节码相似度...
          </p>
        </div>
      )}
    </div>
  );
}
