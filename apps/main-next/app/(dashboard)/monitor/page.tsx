"use client";

import { WujieClient, MonitorSkeleton } from "@/app/src/components";
import { WUJIE_SUB_APP_URL } from "@/lib/subAppOrigins";

const Monitor = () => {
  return (
    <div className="relative w-full h-full">
      <WujieClient
        name="vue3"
        url={WUJIE_SUB_APP_URL.vue}
        width="100%"
        height="100%"
        alive={true}
        fallback={<MonitorSkeleton />}
      />
    </div>
  );
};

export default Monitor;
