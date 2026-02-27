"use client";

import { useAccount } from "wagmi";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";

export const AuthGuard = () => {
  const { address, status } = useAccount();
  const pathname = usePathname();
  const isLoggingOut = useRef(false); // 防止重复执行

  useEffect(() => {
    // 1. 等待连接状态稳定（正在连接中不处理）
    if (status === "connecting" || status === "reconnecting") {
      return;
    }

    // 2. 只监控受保护路由
    const isProtectedRoute = ["/dashboard", "/monitor", "/audit"].some(
      (route) => pathname.startsWith(route),
    );

    // 3. 判断是否需要登出：受保护路由 + 未连接
    //    status 为 'disconnected' 或 'connected' 但 address 为空（极少情况）
    const shouldLogout =
      isProtectedRoute && (status !== "connected" || !address);

    if (shouldLogout && !isLoggingOut.current) {
      isLoggingOut.current = true;
      const forceLogout = async () => {
        try {
          await logout(); // 清除后端 session cookie
        } catch (error) {
          console.error("Logout failed:", error);
        } finally {
          // 硬跳转，彻底重置客户端状态
          window.location.href = "/login";
        }
      };
      forceLogout();
    }
  }, [address, status, pathname]);

  return null;
};
