"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDisconnect } from "wagmi";
import { logout } from "@/app/actions";
import { isProtectedRoute } from "@/proxy/authRoutes";

/** 与 `MonitorVueHost` / `AuditReactHost` 中 WujieClient `name` 一致；登出时须销毁保活实例以停止子应用内轮询 */
const WUJIE_SUB_APP_NAMES = ["vue3", "react19"] as const;

const destroyWujieSubApps = async () => {
  try {
    const { destroyApp } = await import("wujie-react");
    for (const name of WUJIE_SUB_APP_NAMES) {
      try {
        destroyApp(name);
      } catch {
        /* 未启动过该子应用时无界可能抛错，忽略 */
      }
    }
  } catch {
    /* 未使用微前端或未加载 wujie-react */
  }
};

/** 与微前端子应用约定：BFF 401 时子应用向宿主发此事件 */
export const AUTH_SESSION_INVALID_EVENT = "auth-session-invalid";

export type AuthSessionInvalidPayload = { reason?: string };

export const useKickOutSession = () => {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const inFlightRef = useRef(false);

  const kickOut = useCallback(
    async (reason?: string) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await logout();
        disconnect();
        await destroyWujieSubApps();
        const path =
          typeof window !== "undefined" ? window.location.pathname : "/";
        const loginUrl = new URL("/login", window.location.origin);
        if (isProtectedRoute(path)) {
          loginUrl.searchParams.set("from", path);
        }
        if (reason) {
          loginUrl.searchParams.set("reason", reason);
        }
        router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      } catch (e) {
        console.error("kickOutSession failed:", e);
      } finally {
        // 成功跳转后仍需释放，否则根布局不卸载时无法再次踢出
        queueMicrotask(() => {
          inFlightRef.current = false;
        });
      }
    },
    [router, disconnect],
  );

  return kickOut;
}
