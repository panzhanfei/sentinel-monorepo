import { StatCard } from "./StatCard";

interface OverviewCardsProps {
  txCount?: number;
  riskCount?: number;
}

function IntensityIcon() {
  return (
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13 10V3L4 14H11V21L20 10H13Z" />
      </svg>
    </div>
  );
}

export function OverviewCards({
  txCount,
  riskCount = 0,
}: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <StatCard
        label="History_Intensity"
        value={txCount ?? 0}
        decoration={<IntensityIcon />}
        footer={
          <div className="flex items-center gap-2 mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] text-emerald-500 font-bold uppercase">
              Active_Identity
            </p>
          </div>
        }
      />
      <StatCard
        label="Risk_Approvals"
        value={riskCount}
        valueClassName={riskCount > 0 ? "text-amber-400" : "text-zinc-500"}
        footer={
          <p className="text-[10px] text-zinc-600 font-bold mt-3 uppercase tracking-tighter">
            {riskCount > 0
              ? "Approval_Permit_Calls_In_Scan_Window"
              : "No_Approval_Pattern_Txs_In_Window"}
          </p>
        }
      />
    </div>
  );
}
