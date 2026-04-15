"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

export const HeroSection = () => {
  return (
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
  );
}
