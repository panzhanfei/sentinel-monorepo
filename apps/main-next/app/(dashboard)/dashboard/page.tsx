"use client";
import dynamic from "next/dynamic";
import { DashboardSkeleton } from "@/app/src/components";

const DashboardContent = dynamic(() => import("./DashboardContent"), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
});

export default function DashboardPage() {
  return (
    <div className="h-full overflow-auto bg-slate-50">
      <DashboardContent />
    </div>
  );
}
