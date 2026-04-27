import { AuditDashboard } from "@/views";
import { Link } from "react-router-dom";
import { useAppData } from "./useData";

/** 审计首页：保留原有 useAppData（含 Wujie afterMount 与 audit 数据流），仅挂载在此路由 */
const AuditHome = () => {
  const props = useAppData();
  return (
    <>
      <div className="fixed bottom-3 right-3 z-50 text-xs font-mono">
        <Link
          to="/wujie-sub-route-test"
          className="text-zinc-500 hover:text-emerald-400 underline decoration-zinc-600"
        >
          Wujie 子路由测试
        </Link>
      </div>
      <AuditDashboard {...props} />
    </>
  );
};

export { AuditHome };
export default AuditHome;
