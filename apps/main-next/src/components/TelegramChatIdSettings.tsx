"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { authFetch } from "@/utils/authFetch";

export const TelegramChatIdSettings = () => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!panelOpen) return;
    let cancelled = false;
    setError(null);
    setLoading(true);
    (async () => {
      try {
        const res = await authFetch("/api/user/telegram-chat-id", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          data?: { telegramChatId?: string | null };
          error?: { message?: string };
        };
        if (!res.ok || data.success === false) {
          if (!cancelled) {
            const msg =
              data.error?.message ??
              (typeof (data as { error?: string }).error === "string"
                ? (data as { error: string }).error
                : null);
            setError(msg ?? "无法加载 Telegram Chat ID");
          }
          return;
        }
        if (!cancelled) {
          const id = data.data?.telegramChatId;
          setValue(typeof id === "string" ? id : "");
        }
      } catch {
        if (!cancelled) setError("网络错误");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [panelOpen]);

  const handleCancel = () => {
    setPanelOpen(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const trimmed = value.trim();
      const res = await authFetch("/api/user/telegram-chat-id", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramChatId: trimmed === "" ? null : trimmed,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: { telegramChatId?: string | null };
        error?: { message?: string };
      };
      if (!res.ok || data.success === false) {
        const msg =
          data.error?.message ??
          (typeof (data as { error?: string }).error === "string"
            ? (data as { error: string }).error
            : null);
        setError(msg ?? "保存失败");
        return;
      }
      const id = data.data?.telegramChatId;
      setValue(typeof id === "string" ? id : "");
      setPanelOpen(false);
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide bg-slate-800/80 hover:bg-slate-700/90 border border-white/10 text-slate-200 transition-colors"
      >
        <Send className="w-3.5 h-3.5 text-sky-400" />
        Telegram 预警
      </button>

      {panelOpen && (
        <div className="absolute top-full right-0 mt-2 w-[min(100vw-2rem,320px)] p-4 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl z-50">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
            Telegram Chat ID
          </p>
          {loading ? (
            <p className="text-xs text-slate-400 py-2">加载中…</p>
          ) : (
            <>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="个人或频道 Chat ID"
                className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-white/10 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
              {error && (
                <p className="text-xs text-rose-400 mt-2">{error}</p>
              )}
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50"
                >
                  {saving ? "保存中…" : "保存"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
