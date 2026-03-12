import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // 临时关闭测试
  async rewrites() {
    return [
      {
        // 当访问 /node-api 时，转发到 Node 项目
        source: "/node-api/:path*",
        destination: "http://localhost:4000/:path*",
      },
    ];
  },
};

export default nextConfig;
