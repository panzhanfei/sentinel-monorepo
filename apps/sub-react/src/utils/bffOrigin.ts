export const getBffBaseUrl = () : string => {
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
