"use client";

import { useEffect, useRef } from "react";
import { tryRefreshSession } from "@/utils/authFetch";

const LEAD_MS = 2 * 60 * 1000;

type SessionJson = {
  authenticated?: boolean;
  accessExpiresAtSec?: number | null;
};

export const SessionRefreshScheduler = () => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedulingRef = useRef(false);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleNext = async () => {
      if (schedulingRef.current) return;
      schedulingRef.current = true;
      try {
        clearTimer();
        const res = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await res.json().catch(() => ({}))) as SessionJson;
        if (!data.authenticated || data.accessExpiresAtSec == null) return;

        const expMs = data.accessExpiresAtSec * 1000;
        const untilExpiry = expMs - Date.now();

        if (untilExpiry <= LEAD_MS) {
          const ok = await tryRefreshSession();
          if (ok) {
            schedulingRef.current = false;
            await scheduleNext();
          }
          return;
        }

        const delay = untilExpiry - LEAD_MS;
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          void (async () => {
            const ok = await tryRefreshSession();
            if (ok) await scheduleNext();
          })();
        }, delay);
      } finally {
        schedulingRef.current = false;
      }
    };

    void scheduleNext();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void scheduleNext();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimer();
    };
  }, []);

  return null;
}
