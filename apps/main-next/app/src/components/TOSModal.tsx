"use client";

import { useState } from "react";

export const TOSModal = () => {
  const [showModal, setShowModal] = useState(false);

  const handleLaunchClick = () => {
    const hasAgreed = localStorage.getItem("sentinel_tos_agreed");
    if (hasAgreed === "true") {
      window.location.href = "/dashboard";
    } else {
      setShowModal(true);
    }
  };

  const confirmAgreement = () => {
    localStorage.setItem("sentinel_tos_agreed", "true");
    setShowModal(false);
    window.location.href = "/dashboard";
  };

  return (
    <>
      <button
        onClick={handleLaunchClick}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all *:active:scale-95 shadow-lg shadow-blue-900/20  cursor-pointer"
      >
        Launch App
      </button>

      {showModal && (
        /* 核心修复：确保 inset-0 且 z 轴写法正确 */
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 w-screen h-screen">
          {/* 点击遮罩层背景可以关闭（可选，看你需求） */}
          <div
            className="absolute inset-0"
            onClick={() => setShowModal(false)}
          />

          <div className="relative bg-slate-900 border border-slate-800 p-8 max-w-md w-full rounded-2xl shadow-2xl overflow-hidden">
            {/* 装饰性背景光，增加高级感 */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />

            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-500">🛡️</span> 使用条款与免责声明
            </h2>

            <div className="text-gray-400 text-sm space-y-3 mb-6 relative">
              <p>欢迎使用 Sentinel 协议。在进入 Dashboard 之前，请确认：</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>我理解 AI 诊断结果基于链上快照，可能存在误差。</li>
                <li>我理解 Sentinel 不对任何因合约漏洞导致的资产损失负责。</li>
                <li>我已阅读并同意 Sentinel 的《风险告知书》。</li>
              </ul>
            </div>

            <button
              onClick={confirmAgreement}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all transform active:scale-95 cursor-pointer"
            >
              我已阅读并同意进入
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 text-gray-500 text-xs hover:text-gray-300 transition-colors cursor-pointer"
            >
              放弃进入
            </button>
          </div>
        </div>
      )}
    </>
  );
};
