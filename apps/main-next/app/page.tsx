"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { checkSessionAction } from "@/actions/auth";
import { LoginSkeleton } from "@/app/src/components/LoginSkeleton";

export default function IndexPage() {
  const router = useRouter();
  const { isConnected, address, status } = useAccount();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 等待 wagmi 加载完毕，避免 status 抖动
      if (status === "connecting" || status === "reconnecting") return;

      const { hasSession } = await checkSessionAction();

      if (hasSession && isConnected && address) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
      // 稍微延迟一点关闭，视觉更平滑
      setTimeout(() => setLoading(false), 300);
    };
    init();
  }, [isConnected, address, status, router]);

  // 渲染骨架图
  return <LoginSkeleton />;
}
