import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  /** 防点击劫持：主站仅允许同源嵌入；微前端子域由子应用自身响应头控制 */
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
] as const;

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // 临时关闭测试
  output: "standalone",
  // Monorepo root so standalone traces workspace packages; avoids odd nested absolute paths.
  // Scripts run with cwd = apps/main-next (pnpm --filter).
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
};

export default nextConfig;
