"use client";

import { useState } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ShieldCheck, ShieldAlert, Loader2, LogOut } from "lucide-react";
import { getLoginNonce, verifySignature } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { LoginSkeleton } from "@/app/src/components";

export default function LoginPage() {
  const router = useRouter();
  const { address, isConnected, status } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const [pageStatus, setPageStatus] = useState<
    "idle" | "loading" | "signing" | "verifying"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // 核心登录流程
  const handleAuth = async () => {
    if (!address || !isConnected) return;

    try {
      setError(null);
      setPageStatus("loading");

      // 1. 获取 Nonce (带限流保护)
      const nonce = await getLoginNonce(address);

      // 2. 请求钱包签名
      setPageStatus("signing");
      const signature = await signMessageAsync({ message: nonce });

      // 3. 提交后端验证并设置 HttpOnly Cookie
      setPageStatus("verifying");
      const result = await verifySignature(address, signature);

      if (result.success) {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "身份验证失败";
      setError(message);
      setPageStatus("idle");
    }
  };

  if (status === "connecting" || status === "reconnecting") {
    return <LoginSkeleton />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-black p-4">
      <div className="w-full max-w-md">
        {/* 装饰性 Logo */}
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-xl">
            <ShieldCheck className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Sentinel
            </h1>
            <p className="text-slate-400 mt-2">下一代 Web3 安全准入系统</p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center">
              <ConnectButton label="连接加密钱包" showBalance={false} />
            </div>

            {/* 逻辑触发区域 */}
            {isConnected && pageStatus === "idle" && (
              <button
                onClick={handleAuth}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all transform active:scale-[0.98] shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                验证身份并进入
              </button>
            )}

            {/* 加载状态显示 */}
            {pageStatus !== "idle" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-slate-300">
                  {pageStatus === "loading" && "正在获取安全凭证..."}
                  {pageStatus === "signing" && "请在钱包中确认签名..."}
                  {pageStatus === "verifying" && "正在校验加密签名..."}
                </p>
              </div>
            )}

            {/* 错误处理 */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* 断开连接按钮 */}
            {isConnected && pageStatus === "idle" && (
              <button
                onClick={() => disconnect()}
                className="w-full py-3 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                切换钱包
              </button>
            )}
          </div>
        </div>

        {/* 底部页脚 */}
        <p className="text-center mt-8 text-slate-600 text-xs">
          受保护的系统资源。所有访问将被审计。
        </p>
      </div>
    </div>
  );
}
