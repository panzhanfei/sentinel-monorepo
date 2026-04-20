"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { useEffect, useState } from "react";

export const Web3ConnectKitButton = () => {
  const [isDelayedReady, setIsDelayedReady] = useState(false);

  // 只保留一个简单的延迟计时器，用于优化“闪现”体验
  useEffect(() => {
    const timer = setTimeout(() => setIsDelayedReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // 核心状态判断
        const isReady = mounted && authenticationStatus !== "loading";
        const isConnected = !!(
          isReady &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated")
        );

        // 骨架屏显示时机：组件未挂载 OR (未连接且还没到延迟时间)
        const showSkeleton = !isReady || (!isConnected && !isDelayedReady);

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {showSkeleton ? (
              // 骨架屏占位
              <div className="w-35 h-10 bg-slate-100 animate-pulse rounded-xl border border-slate-200/50" />
            ) : !isConnected ? (
              // 未连接状态
              <button
                onClick={openConnectModal}
                type="button"
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-500 transition-all active:scale-95 shadow-md shadow-indigo-100"
              >
                Connect Wallet
              </button>
            ) : chain.unsupported ? (
              // 错误网络
              <button
                onClick={openChainModal}
                className="bg-rose-500 text-white px-4 py-2 rounded-xl font-bold text-sm"
              >
                Wrong Network
              </button>
            ) : (
              // 已连接状态
              <div className="flex items-center gap-2">
                <button
                  onClick={openChainModal}
                  className="flex items-center bg-white border border-slate-200 p-2 rounded-xl hover:bg-slate-50 transition"
                >
                  {chain.hasIcon && chain.iconUrl && (
                    <div className="relative w-5 h-5 mr-1">
                      <Image
                        alt={chain.name ?? "Chain icon"}
                        src={chain.iconUrl}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    </div>
                  )}
                  <span className="text-sm font-bold text-slate-600">
                    {chain.name}
                  </span>
                </button>

                <button
                  onClick={openAccountModal}
                  className="bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                >
                  {account.displayName}
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
