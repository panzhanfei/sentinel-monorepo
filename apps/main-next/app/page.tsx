"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Globe, ArrowRight, Github } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 font-sans">
      {/* 导航栏 */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              S
            </div>
            <span className="text-xl font-black tracking-tighter">
              SENTINEL
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            {/* Security 链接直接指向文档页的审计逻辑章节 */}
            <Link href="/docs#security" className="hover:text-white transition">
              Security
            </Link>
            <Link
              href="/docs"
              className="hover:text-white transition flex items-center gap-1"
            >
              Docs{" "}
              <span className="text-[10px] px-1 bg-white/10 rounded tracking-tighter text-indigo-400 font-bold border border-indigo-500/30">
                API
              </span>
            </Link>
            <Link
              href="/dashboard"
              className="bg-white text-slate-950 px-5 py-2 rounded-full font-bold hover:bg-indigo-50 transition shadow-lg shadow-white/5"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-150 bg-indigo-600/10 blur-[120px] rounded-full -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div {...fadeInUp}>
            <span className="px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-6 inline-block">
              Web3 Asset Security 2.0
            </span>
            <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-linear-to-b from-white to-slate-500">
              Watch Your Assets <br />{" "}
              <span className="text-indigo-500 text-glow">In Real-Time</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
              全链哨兵 Sentinel：基于多智能体 AI
              驱动的资产审计系统。秒级识别授权风险，为您的 Web3 投资保驾护航。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="group w-full sm:w-auto bg-indigo-600 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
              >
                Start Monitoring{" "}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="/docs"
                className="w-full sm:w-auto border border-white/10 px-8 py-4 rounded-2xl font-bold hover:bg-white/5 transition text-center"
              >
                Documentation
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 特性展示 */}
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

      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div>
            <div className="mb-4 font-black text-2xl tracking-tighter text-indigo-500">
              SENTINEL
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 Sentinel Protocol. Built for the Decentralized Future.
            </p>
          </div>
          <div className="flex gap-6 text-slate-400">
            <Github className="w-5 h-5 hover:text-white cursor-pointer transition" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
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
