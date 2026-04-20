"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import {
  AUDIT_REACT_HOST_PAGE_MODAL_CLOSED_EVENT,
  AUDIT_REACT_HOST_PAGE_MODAL_OPEN_EVENT,
} from "./wujieAuditBus";
import type { IWujieHostPageModalOpenPayload } from "./wujieHostPageModal";
import {
  MONITOR_VUE_HOST_PAGE_MODAL_CLOSED_EVENT,
  MONITOR_VUE_HOST_PAGE_MODAL_OPEN_EVENT,
} from "./wujieMonitorBus";

const parseOpenPayload = (payload: unknown): IWujieHostPageModalOpenPayload => {
  if (!payload || typeof payload !== "object") return {};
  const title = (payload as { title?: unknown }).title;
  return typeof title === "string" ? { title } : {};
};

/** 监听 Wujie bus，在宿主根文档挂载全屏层（可盖住侧栏）。 */
export const useWujieHostPageModal = (
  channel: "audit" | "monitor",
): ReactElement | null => {
  const [open, setOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string | undefined>();

  const openEvent =
    channel === "audit"
      ? AUDIT_REACT_HOST_PAGE_MODAL_OPEN_EVENT
      : MONITOR_VUE_HOST_PAGE_MODAL_OPEN_EVENT;
  const closedEvent =
    channel === "audit"
      ? AUDIT_REACT_HOST_PAGE_MODAL_CLOSED_EVENT
      : MONITOR_VUE_HOST_PAGE_MODAL_CLOSED_EVENT;

  useEffect(() => {
    let cancelled = false;

    const onOpenRequest = (payload: unknown) => {
      if (cancelled) return;
      const { title } = parseOpenPayload(payload);
      setModalTitle(title);
      setOpen(true);
    };

    void import("wujie").then(({ bus }) => {
      if (cancelled || !bus) return;
      bus.$on(openEvent, onOpenRequest);
    });

    return () => {
      cancelled = true;
      void import("wujie").then(({ bus }) => {
        bus?.$off(openEvent, onOpenRequest);
      });
    };
  }, [openEvent]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setModalTitle(undefined);
    void import("wujie").then(({ bus }) => {
      bus?.$emit(closedEvent, {});
    });
  }, [closedEvent]);

  if (typeof document === "undefined" || !open) {
    return null;
  }

  const defaultTitle =
    channel === "audit" ? "子应用（审计）" : "子应用（监控）";

  return createPortal(
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wujie-host-page-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/60"
        aria-label="关闭"
        onClick={closeModal}
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="wujie-host-page-modal-title"
            className="text-lg font-semibold text-slate-100"
          >
            {modalTitle ?? defaultTitle}
          </h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            onClick={closeModal}
          >
            关闭
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          由子应用经 Wujie bus 请求打开；遮罩与关闭在宿主文档内完成。
        </p>
      </div>
    </div>,
    document.body,
  );
};
