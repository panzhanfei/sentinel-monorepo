"use client";

import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  AUTH_SESSION_INVALID_EVENT,
  type AuthSessionInvalidPayload,
  useKickOutSession,
} from "@/hooks/useKickOutSession";
import { isProtectedRoute } from "@/proxy/authRoutes";

export const AuthGuard = () => {
  const { status } = useAccount();
  const pathname = usePathname();
  const kickOut = useKickOutSession();

  // 子应用 BFF 401 → 宿主统一踢出
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    void import("wujie").then(({ bus }) => {
      const handler = (payload?: AuthSessionInvalidPayload) => {
        void kickOut(payload?.reason ?? "bff_unauthorized");
      };
      bus.$on(AUTH_SESSION_INVALID_EVENT, handler);
      cleanup = () => bus.$off(AUTH_SESSION_INVALID_EVENT, handler);
    });

    const onWindowEvent = (event: Event) => {
      const payload = (event as CustomEvent<AuthSessionInvalidPayload>).detail;
      void kickOut(payload?.reason ?? "bff_unauthorized");
    };
    window.addEventListener(AUTH_SESSION_INVALID_EVENT, onWindowEvent);

    return () => {
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, onWindowEvent);
      cleanup?.();
    };
  }, [kickOut]);

  // 受保护路由 + 钱包已断开（排除连接中/重连中，避免误踢）
  useEffect(() => {
    if (!isProtectedRoute(pathname)) return;
    if (status === "connecting" || status === "reconnecting") return;
    if (status !== "disconnected") return;

    void kickOut("wallet_disconnected");
  }, [status, pathname, kickOut]);

  return null;
};
