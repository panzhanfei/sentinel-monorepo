"use client";

import { useAccount, useDisconnect } from "wagmi";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { logout } from "@/actions/auth";

export const AuthGuard = () => {
  const { status } = useAccount();
  const { disconnect } = useDisconnect(); // 确保强制断开同步
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const protectedRoutes = ["/dashboard", "/monitor", "/audit"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route),
    );

    // 如果不在受保护页面，不执行逻辑
    if (!isProtectedRoute) return;

    // 当钱包状态变为断开时
    if (status === "disconnected") {
      console.warn("🛡️ AuthGuard: Wallet disconnected, cleaning up session...");

      const performLogout = async () => {
        try {
          // 1. 调用 Server Action 清除 Cookie/Session
          await logout();

          // 2. 强制断开 wagmi 内部连接（双保险）
          disconnect();

          // 3. 这里的强制跳转非常重要，防止用户停留在受保护页面操作残留数据
          router.replace("/login");
        } catch (error) {
          console.error("Logout flow failed:", error);
        }
      };

      performLogout();
    }
  }, [status, pathname, router, disconnect]);

  return null;
};
