"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";

export const useWeb3Sync = () => {
  const { address, isConnected, chain } = useAccount();
  const chainId = chain?.id;
  const chainName = chain?.name;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncAddress = async () => {
      try {
        const { bus } = await import("wujie");
        if (bus && typeof bus.$emit === "function") {
          bus.$emit("web3-data-change", {
            address,
            isConnected,
            chain:
              chainId !== undefined
                ? { id: chainId, name: chainName ?? "" }
                : undefined,
          });
        } else {
          console.warn("[Host] ⚠️ Wujie Bus 尚未准备就绪，稍后重试");
        }
      } catch (error) {
        console.error("[Host] ❌ 同步地址时发生错误:", error);
      }
    };

    const timer = setTimeout(syncAddress, 100);
    return () => clearTimeout(timer);
  }, [address, isConnected, chainId, chainName]);
};
