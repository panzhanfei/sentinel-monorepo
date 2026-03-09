"use client";

import { WujieClient, MonitorSkeleton } from "@/app/src/components";

const Monitor = () => {
  return (
    <div className="relative w-full h-full">
      <WujieClient
        name="vue3"
        url="http://localhost:3002"
        width="100%"
        height="100%"
        alive={true}
        fallback={<MonitorSkeleton />}
      />
    </div>
  );
};

export default Monitor;
