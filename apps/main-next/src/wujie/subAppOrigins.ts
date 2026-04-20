/**
 * 微前端子应用地址：Wujie url、BFF CORS 白名单共用，避免多处硬编码漂移。
 */
const DEFAULT_ORIGINS = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3002",
] as const;

const parseExtraOrigins = (raw: string | undefined) : string[] => {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const envReact = process.env.NEXT_PUBLIC_WUJIE_REACT_URL?.trim();
const envVue = process.env.NEXT_PUBLIC_WUJIE_VUE_URL?.trim();
const envExtra = parseExtraOrigins(process.env.NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS);

/** 供 Wujie `url` 使用（子应用入口） */
export const WUJIE_SUB_APP_URL = {
  react: envReact || "http://localhost:3001",
  vue: envVue || "http://localhost:3002",
} as const;

/** 供 proxy（/api CORS）校验：默认端口 + 环境覆盖的完整源列表 */
export const BFF_CORS_ORIGIN_SET = new Set<string>([
  ...DEFAULT_ORIGINS,
  ...(envReact ? [envReact] : []),
  ...(envVue ? [envVue] : []),
  ...envExtra,
]);
