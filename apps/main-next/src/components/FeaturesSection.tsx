"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Globe } from "lucide-react";

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-all group"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="text-amber-400" />}
            title="Real-time Tracking"
            description="基于 Multicall 技术，毫秒级同步您的 ETH、USDC 及各链代币余额变动。"
          />
          <FeatureCard
            icon={<ShieldCheck className="text-emerald-400" />}
            title="AI Deep Audit"
            description="多 AI 协作分工，自动扫描可疑合约授权（Allowance）并实时生成预警报告。"
          />
          <FeatureCard
            icon={<Globe className="text-indigo-400" />}
            title="Multi-chain Support"
            description="原生支持 Ethereum、Anvil Fork 及主流 L2 网络，实现全链资产统一看板。"
          />
        </div>
      </div>
    </section>
  );
}
