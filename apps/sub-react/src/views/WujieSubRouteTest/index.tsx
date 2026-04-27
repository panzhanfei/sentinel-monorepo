import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AUDIT_REACT_HOST_PAGE_MODAL_CLOSED_EVENT } from "@/constants";
import { emitAuditHostPageModalToHost } from "@/utils";

/** 用于在 Wujie 宿主下验证子应用 history 子路由是否同步、刷新是否正常 */
const WujieSubRouteTest = () => {
  const { pathname, search, hash } = useLocation();
  const [hostModalClosedHint, setHostModalClosedHint] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const bus = window.$wujie?.bus;
    if (!bus) return;
    const onClosed = () => {
      setHostModalClosedHint(
        `宿主弹窗已关闭（${new Date().toLocaleTimeString()}）`,
      );
    };
    bus.$on(AUDIT_REACT_HOST_PAGE_MODAL_CLOSED_EVENT, onClosed);
    return () => {
      bus.$off(AUDIT_REACT_HOST_PAGE_MODAL_CLOSED_EVENT, onClosed);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">
      <div className="max-w-xl space-y-6">
        <h1 className="text-lg font-semibold text-emerald-400">
          Wujie 子路由测试页
        </h1>
        <p className="text-sm text-zinc-400">
          若宿主开启路由同步，从主应用进入子应用后，地址栏应能反映该路径；可直接在子应用端口访问本页做对照。
        </p>
        <dl className="space-y-2 text-sm border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
          <div>
            <dt className="text-zinc-500">react-router location.pathname</dt>
            <dd className="text-amber-200 break-all">{pathname}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">location.search / hash</dt>
            <dd className="break-all">
              {search || "(empty)"} / {hash || "(empty)"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">window.location.href</dt>
            <dd className="text-amber-200/90 break-all text-xs">
              {typeof window !== "undefined" ? window.location.href : "—"}
            </dd>
          </div>
        </dl>
        <div className="space-y-2">
          <button
            type="button"
            className="rounded-lg border border-emerald-700 bg-emerald-950/50 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-900/60"
            onClick={() =>
              emitAuditHostPageModalToHost({
                title: "审计子应用 · 宿主页面级弹窗",
              })
            }
          >
            打开宿主页面级弹窗（bus → Next）
          </button>
          {hostModalClosedHint ? (
            <p className="text-xs text-zinc-500">{hostModalClosedHint}</p>
          ) : null}
        </div>
        <Link
          to="/"
          className="inline-block text-sm text-indigo-400 hover:text-indigo-300 underline"
        >
          ← 返回审计首页（/）
        </Link>
      </div>
    </div>
  );
};

export { WujieSubRouteTest };
export default WujieSubRouteTest;
