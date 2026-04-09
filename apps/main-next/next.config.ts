import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // 临时关闭测试
  output: "standalone",
  // Monorepo root so standalone traces workspace packages; avoids odd nested absolute paths.
  // Scripts run with cwd = apps/main-next (pnpm --filter).
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
};

export default nextConfig;
