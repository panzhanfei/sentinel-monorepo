/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), tailwindcss()],
  preview: {
    host: "0.0.0.0",
    port: 3002,
    allowedHosts: true,
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
    },
  },
  server: {
    port: 3002, // 设置为你想要的端口，例如 3000
    cors: true,
    // host: "0.0.0.0", // 可选：允许局域网访问（如手机调试）
    // open: true, // 可选：启动时自动打开浏览器
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"), // 确保这里有配置
    },
  },
});
