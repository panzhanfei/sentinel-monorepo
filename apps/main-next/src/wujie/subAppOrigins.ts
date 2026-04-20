/**
 * 微前端子应用地址：Wujie url、BFF CORS 白名单共用，避免多处硬编码漂移。
 *
 * iframe 基址须用 resolveWujieSubAppBases(requestHost)：仅依赖 NODE_ENV === "development"
 * 无法覆盖「本地 next start（NODE_ENV=production）+ Host 仍为 localhost」等情况。
 */
/** 主站壳 + 子应用常用本机 Origin（含 localhost / 127.0.0.1，避免混用导致 BFF 预检失败） */
const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3002",
] as const;

const LOCAL_REACT = "http://localhost:3001";
const LOCAL_VUE = "http://localhost:3002";

const parseExtraOrigins = (raw: string | undefined): string[] => {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const envReact = process.env.NEXT_PUBLIC_WUJIE_REACT_URL?.trim();
const envVue = process.env.NEXT_PUBLIC_WUJIE_VUE_URL?.trim();
const envExtra = parseExtraOrigins(process.env.NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS);

const useProductionSubAppsFlag =
  process.env.NEXT_PUBLIC_WUJIE_USE_PRODUCTION_SUBAPPS === "true";

/** 从 Host 头解析主机名（去掉端口）；支持 IPv6 本机 [::1]:port */
export const isLocalHostHeader = (host: string | null): boolean => {
  if (!host?.trim()) return false;
  let h = host.trim().toLowerCase();
  if (h.startsWith("[")) {
    const end = h.indexOf("]");
    h = end === -1 ? h : h.slice(1, end);
  } else {
    const colon = h.indexOf(":");
    if (colon !== -1) h = h.slice(0, colon);
  }
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
};

/**
 * 按当前请求 Host（来自 headers().get('host')）与 NODE_ENV 决定 Wujie 子应用源。
 * - 显式 `NEXT_PUBLIC_WUJIE_USE_PRODUCTION_SUBAPPS=true` 且 env 已配：始终用 env（本地强开生产子域调试用）。
 * - Host 为 localhost / 127.0.0.1 / ::1：始终用本机 3001/3002（覆盖 next start + 生产 env 误配）。
 * - `NODE_ENV === development` 且无 Host 信息：本机子应用（兼容旧逻辑）。
 * - 其余（线上域名 + production）：使用 NEXT_PUBLIC_WUJIE_*。
 */
export const resolveWujieSubAppBases = (
  requestHost: string | null,
): { react: string; vue: string } => {
  if (useProductionSubAppsFlag && envReact && envVue) {
    return { react: envReact, vue: envVue };
  }

  if (isLocalHostHeader(requestHost)) {
    return { react: LOCAL_REACT, vue: LOCAL_VUE };
  }

  if (process.env.NODE_ENV === "development") {
    return { react: LOCAL_REACT, vue: LOCAL_VUE };
  }

  return {
    react: envReact || LOCAL_REACT,
    vue: envVue || LOCAL_VUE,
  };
};

/**
 * 无请求 Host 时的回退（如静态推断）；布局层应优先传入 resolveWujieSubAppBases(host)。
 */
export const WUJIE_SUB_APP_URL = resolveWujieSubAppBases(null);

/** 供 proxy（/api CORS）校验：默认端口 + 环境覆盖的完整源列表 */
export const BFF_CORS_ORIGIN_SET = new Set<string>([
  ...DEFAULT_ORIGINS,
  ...(envReact ? [envReact] : []),
  ...(envVue ? [envVue] : []),
  ...envExtra,
]);
