"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

export type RiskLevel = "low" | "medium" | "high";

interface RiskContextType {
  riskLevel: RiskLevel;
  setRiskLevel: (level: RiskLevel) => void;
  triggerHighRisk: (duration?: number) => void;
}

const RiskContext = createContext<RiskContextType | undefined>(undefined);

export const RiskProvider = ({ children }: { children: ReactNode }) => {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("low");

  // 封装一个高危自动恢复逻辑
  const triggerHighRisk = useCallback((duration = 8000) => {
    setRiskLevel("high");
    setTimeout(() => setRiskLevel("low"), duration);
  }, []);

  return (
    <RiskContext.Provider value={{ riskLevel, setRiskLevel, triggerHighRisk }}>
      {children}
    </RiskContext.Provider>
  );
};

export const useRisk = () => {
  const context = useContext(RiskContext);
  if (!context) throw new Error("useRisk must be used within RiskProvider");
  return context;
};
