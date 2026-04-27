"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WujieClient } from "./WujieWrapper";
import { AuditSkeleton } from "@/components";
import {
  AUDIT_REACT_HOST_SYNC_EVENT,
  REACT_SUB_NAVIGATE_EVENT,
  hostPathToReactSubPath,
  reactSubPathToIframeHref,
} from "./wujieAuditBus";
import { useWujieHostPageModal } from "./useWujieHostPageModal";

/**
 * Next `/audit` 与 `/audit/**` 驱动子应用路由；保活模式下子应用 url 变更不生效，故用 Wujie bus 同步。
 * 关闭 Wujie sync，避免子路由被写入 `?react19=` 查询串，与 App Router 路径冲突。
 */
export const AuditReactHost = ({
  wujieReactBase,
}: {
  /** 由 Server Layout 根据 Host 解析，避免本地 next start 仍指向生产子域 */
  wujieReactBase: string;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const subPath = hostPathToReactSubPath(pathname);
  /** 仅首次进入 /audit 树时确定入口，后续只走 bus，避免改 url 触发子应用重载与骨架屏 */
  const [wujieEntryUrl] = useState(
    () => reactSubPathToIframeHref(subPath, wujieReactBase),
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
      const target = path === "/" ? "/audit" : `/audit${path}`;
      if (target === pathnameRef.current) return;
      router.push(target);
    };

    let cancelled = false;
    void import("wujie").then(({ bus }) => {
      if (cancelled || !bus) return;
      bus.$on(AUDIT_REACT_HOST_SYNC_EVENT, onChildPath);
    });

    return () => {
      cancelled = true;
      void import("wujie").then(({ bus }) => {
        bus?.$off(AUDIT_REACT_HOST_SYNC_EVENT, onChildPath);
      });
    };
  }, [router]);

  useEffect(() => {
    const run = () => {
      void import("wujie").then(({ bus }) => {
        bus?.$emit(REACT_SUB_NAVIGATE_EVENT, subPath);
      });
    };
    const t = window.setTimeout(run, 0);
    return () => window.clearTimeout(t);
  }, [subPath]);

  const hostPageModal = useWujieHostPageModal("audit");

  return (
    <div className="relative w-full h-full">
      {hostPageModal}
      <WujieClient
        name="react19"
        url={wujieEntryUrl}
        width="100%"
        height="100%"
        alive={true}
        sync={false}
        fallback={<AuditSkeleton />}
      />
    </div>
  );
};
