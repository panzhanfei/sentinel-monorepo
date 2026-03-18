"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import Cookies from "js-cookie";
export const useWeb3Sync = () => {
  const { address, isConnected, chain } = useAccount();

  const syncAddress = async () => {
    try {
      const { bus } = await import("wujie");
      const token = Cookies.get("token");
      if (bus && typeof bus.$emit === "function") {
        bus.$emit("web3-data-change", { address, isConnected, chain, token });
      } else {
        console.warn("[Host] ⚠️ Wujie Bus 尚未准备就绪，稍后重试");
      }
    } catch (error) {
      console.error("[Host] ❌ 同步地址时发生错误:", error);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(syncAddress, 100);
    return () => clearTimeout(timer);
  }, [address, isConnected, chain]);
};
