"use client";

import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Toaster, toast } from "react-hot-toast";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { RiskSphere } from "./RiskSphere";
import { useRisk } from "@/app/context";

/** 链上 value 为代币最小单位；该阈值按 18 位精度资产（如 ETH/WETH）估算「大额」 */
const LARGE_AMOUNT_WEI = 10n * 10n ** 18n;
const MAX_UINT256 = 2n ** 256n - 1n;

const parseWei = (raw: string) : bigint | null => {
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

const isLargeTransfer = (valueWei: bigint) : boolean => {
  return valueWei >= LARGE_AMOUNT_WEI;
}

const isHighRiskApproval = (valueWei: bigint) : boolean => {
  if (valueWei >= LARGE_AMOUNT_WEI) return true;
  return valueWei > MAX_UINT256 / 2n;
}

const weiHint = (wei: bigint) : string => {
  try {
    return `${formatEther(wei)}（按 18 位小数估算，具体代币请以合约 decimals 为准）`;
  } catch {
    return `${wei.toString()} wei`;
  }
}

const AUDIT_AI_STREAM_EVENT = "audit-ai-stream";

export const AlertProvider: React.FC = () => {
  const { riskLevel, setRiskLevel, triggerHighRisk } = useRisk();
  const { address } = useAccount();

  // 审计子应用 AI 流式问答时，与深度扫描一致将背景粒子切到 medium（黄/思考态）
  useEffect(() => {
    let cancelled = false;
    let busRef: {
      $off: (e: string, fn: (...args: unknown[]) => void) => void;
    } | null = null;

    const onAuditAiStream = (...args: unknown[]) => {
      if (cancelled) return;
      const payload = args[0] as { active?: boolean } | undefined;
      setRiskLevel(payload?.active ? "medium" : "low");
    };

    import("wujie")
      .then(({ bus }) => {
        if (cancelled || !bus) return;
        busRef = bus;
        bus.$on(AUDIT_AI_STREAM_EVENT, onAuditAiStream);
      })
      .catch(() => {
        /* 非微前端或未加载 wujie */
      });

    return () => {
      cancelled = true;
      busRef?.$off(AUDIT_AI_STREAM_EVENT, onAuditAiStream);
    };
  }, [setRiskLevel]);

  useEffect(() => {
    if (!address) return;
    const eventSource = new EventSource(
      `/api/events/watch?address=${encodeURIComponent(address)}`,
    );

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
      const wei = parseWei(data.value ?? "0");
      const large = wei !== null && isLargeTransfer(wei);
      const amountText = wei !== null ? weiHint(wei) : `value=${data.value}`;
      if (large) {
        triggerHighRisk(8000);
        notify("交易监控", `大额转账: ${amountText}`, "error");
      } else {
        setRiskLevel("low");
        notify("交易监控", `转账: ${amountText}`, "success");
      }
    });

    eventSource.addEventListener("approval", (e) => {
      const data = JSON.parse(e.data);
      const wei = parseWei(data.value ?? "0");
      const risky = wei !== null && isHighRiskApproval(wei);
      const spenderShort = `${data.spender.slice(0, 10)}...`;
      if (risky) {
        triggerHighRisk(8000);
        const detail =
          wei !== null && wei > MAX_UINT256 / 2n
            ? `Spender ${spenderShort}，无限或极高授权额度`
            : `Spender ${spenderShort}，额度 ${wei !== null ? weiHint(wei) : data.value}`;
        notify("风险预警", detail, "error");
      } else {
        setRiskLevel("low");
        notify(
          "授权监控",
          `额度较低: ${spenderShort}${wei !== null ? `，${weiHint(wei)}` : ""}`,
          "success",
        );
      }
    });

    return () => eventSource.close();
  }, [address, setRiskLevel, triggerHighRisk]);

  return (
    <>
      <div
        className="fixed inset-0 bg-[#020202] "
        style={{ zIndex: -1 }} // 使用 style 确保层级最低
      >
        <Canvas
          shadows
          camera={{ position: [0, 0, 5], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
        >
          <RiskSphere riskLevel={riskLevel} />
        </Canvas>
      </div>

      <Toaster
        position="top-right"
        containerStyle={{
          top: 40,
          right: 40,
        }}
        toastOptions={{}}
      />
    </>
  );
};
