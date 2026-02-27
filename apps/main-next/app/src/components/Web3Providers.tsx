"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// 引入 RainbowKit
import { RainbowKitProvider, midnightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { config } from "@/app/src/config/wagmi";
import { ReactNode, useState } from "react";
import { AuthGuard } from "./AuthGuard";
import "@rainbow-me/rainbowkit/styles.css";

export const Web3Providers = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* 使用午夜主题，定制蓝色调 */}
        <RainbowKitProvider
          theme={midnightTheme({
            accentColor: "#3b82f6", // 这里的蓝色要和你 UI 的 Shield 图标统一
            borderRadius: "large",
          })}
          modalSize="compact" // 紧凑型弹窗更有高级感
        >
          <AuthGuard />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
