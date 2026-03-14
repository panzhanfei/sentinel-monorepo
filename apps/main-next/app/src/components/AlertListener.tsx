"use client";

import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Toaster, toast } from "react-hot-toast";
import { RiskSphere } from "./RiskSphere";
import { useRisk } from "@/app/context";

export const AlertProvider: React.FC = () => {
  const { riskLevel, setRiskLevel, triggerHighRisk } = useRisk();

  useEffect(() => {
    const eventSource = new EventSource("/api/events/watch");

    // 封装一个炫酷的自定义弹窗函数
    const notify = (
      title: string,
      message: string,
      type: "success" | "error",
    ) => {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-slate-900/80 backdrop-blur-md border-b-2 ${
              type === "success"
                ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
            } pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p
                    className={`text-sm font-bold ${type === "success" ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {title}
                  </p>
                  <p className="mt-1 text-xs text-slate-300 font-mono">
                    {message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-slate-700">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-xs font-medium text-slate-400 hover:text-slate-100 focus:outline-none"
              >
                关闭
              </button>
            </div>
          </div>
        ),
        { duration: 5000 },
      );
    };

    eventSource.addEventListener("transfer", (e) => {
      const data = JSON.parse(e.data);
      setRiskLevel("low");
      notify("交易监控", `检测到转账: ${data.value} ETH`, "success");
    });

    eventSource.addEventListener("approval", (e) => {
      const data = JSON.parse(e.data);
      triggerHighRisk(8000);
      notify(
        "风险预警",
        `发现授权变更: ${data.spender.slice(0, 10)}...`,
        "error",
      );
    });

    return () => eventSource.close();
  }, [setRiskLevel, triggerHighRisk]);

  return (
    <>
      {/* 3.1 3D 背景层 */}
      <div
        className="fixed inset-0 bg-[#020202]"
        style={{ zIndex: -1 }} // 使用 style 确保层级最低
      >
        <Canvas
          shadows
          camera={{ position: [0, 0, 5], fov: 60 }}
          // 加上 gl 配置，提升渲染质量
          gl={{ antialias: true, alpha: true }}
        >
          <RiskSphere riskLevel={riskLevel} />
        </Canvas>
      </div>

      {/* 3.2 弹窗容器层 */}
      <Toaster
        position="top-right"
        containerStyle={{
          top: 40,
          right: 40,
        }}
        toastOptions={
          {
            // 这里可以留空，因为我们用了 toast.custom
          }
        }
      />
    </>
  );
};
