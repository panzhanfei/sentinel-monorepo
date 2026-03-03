"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/app/src/components";

const DashboardContent = dynamic(() => import("./DashboardContent"), {
  ssr: false,
  loading: () => <Skeleton />,
});

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardContent />
    </div>
  );
}
