"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WujieClient } from "./WujieWrapper";
import { MonitorSkeleton } from "./skeletons/monitor";
import {
  MONITOR_VUE_HOST_SYNC_EVENT,
  VUE_SUB_NAVIGATE_EVENT,
  hostPathToVueSubPath,
  vueSubPathToIframeHref,
} from "@/lib/wujieMonitorBus";
import { WUJIE_SUB_APP_URL } from "@/lib/subAppOrigins";

/**
 * Next `/monitor` 与 `/monitor/**` 驱动 Vue 子应用路由；保活 + bus，sync=false。
 */
export function MonitorVueHost() {
  const pathname = usePathname();
  const router = useRouter();
  const subPath = hostPathToVueSubPath(pathname);
  const [wujieEntryUrl] = useState(() =>
    vueSubPathToIframeHref(subPath, WUJIE_SUB_APP_URL.vue),
  );

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const onChildPath = (payload: unknown) => {
      const path =
        payload &&
        typeof payload === "object" &&
        "path" in payload &&
        typeof (payload as { path: unknown }).path === "string"
          ? (payload as { path: string }).path
          : "/";
      const target = path === "/" ? "/monitor" : `/monitor${path}`;
      if (target === pathnameRef.current) return;
      router.push(target);
    };

    let cancelled = false;
    void import("wujie").then(({ bus }) => {
      if (cancelled || !bus) return;
      bus.$on(MONITOR_VUE_HOST_SYNC_EVENT, onChildPath);
    });

    return () => {
      cancelled = true;
      void import("wujie").then(({ bus }) => {
        bus?.$off(MONITOR_VUE_HOST_SYNC_EVENT, onChildPath);
      });
    };
  }, [router]);

  useEffect(() => {
    const run = () => {
      void import("wujie").then(({ bus }) => {
        bus?.$emit(VUE_SUB_NAVIGATE_EVENT, subPath);
      });
    };
    const t = window.setTimeout(run, 0);
    return () => window.clearTimeout(t);
  }, [subPath]);

  return (
    <div className="relative h-full w-full">
      <WujieClient
        name="vue3"
        url={wujieEntryUrl}
        width="100%"
        height="100%"
        alive={true}
        sync={false}
        fallback={<MonitorSkeleton />}
      />
    </div>
  );
}
