import { Link, useLocation } from "react-router-dom";

/** 未声明的子路径，便于对照 Wujie 同步过来的未知路由 */
export const NoSubRouteMatch = () => {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">
      <p className="text-amber-300 mb-4">子应用内未配置该路径</p>
      <pre className="text-xs bg-zinc-900 p-4 rounded-lg border border-zinc-800 overflow-x-auto mb-6">
        {loc.pathname}
        {loc.search}
        {loc.hash}
      </pre>
      <Link to="/" className="text-indigo-400 hover:text-indigo-300 underline text-sm">
        返回 /
      </Link>
    </div>
  );
};
