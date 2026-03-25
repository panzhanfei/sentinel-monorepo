/** 主应用 BFF（Next `/api/*`）基址：Cookie JWT 挂在主域，子应用 iframe 在 3001 时必须直连主域 */
export function getBffBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const fromWujie = (window.$wujie?.props?.bffOrigin as string | undefined)?.trim();
  if (fromWujie) return fromWujie.replace(/\/$/, "");
  const env = (import.meta.env.VITE_BFF_ORIGIN as string | undefined)?.trim();
  if (env) return env.replace(/\/$/, "");
  if (import.meta.env.DEV && window.location.port === "3001") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000`;
  }
  return window.location.origin;
}
