import { useEffect } from "react";
import { useWujieStore } from "@/stores";
import { useAuditDashboardData } from "@/views/AuditDashboard/useData";

export const useAppData = () => {
  const wujieAfterMount = useWujieStore((s) => s.wujieAfterMount);

  useEffect(() => {
    wujieAfterMount?.();
  }, [wujieAfterMount]);

  return useAuditDashboardData();
}
