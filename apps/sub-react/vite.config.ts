/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: {
    host: "0.0.0.0",
    port: 3001,
    allowedHosts: true,
  },
  server: {
    port: 3001, // 设置为你想要的端口，例如 3000
    cors: true,
    // host: "0.0.0.0", // 可选：允许局域网访问（如手机调试）
    // open: true, // 可选：启动时自动打开浏览器
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
                  proxy.on("proxyReq", (proxyReq, req) => {
                    const cookie = req.headers.cookie;
                    if (cookie) {
                      proxyReq.setHeader("cookie", cookie);
                    }
                  });
                },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
