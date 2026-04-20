import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("subAppOrigins", () => {
  const snapshot = { ...process.env };

  /** @types/node 将 NODE_ENV 标为只读；Vitest 仍支持通过 stub 覆盖 */
  const stubNodeEnv = (value: string) => {
    (vi.stubEnv as (key: string, val: string) => void)("NODE_ENV", value);
  };

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    process.env = { ...snapshot };
    delete process.env.NEXT_PUBLIC_WUJIE_REACT_URL;
    delete process.env.NEXT_PUBLIC_WUJIE_VUE_URL;
    delete process.env.NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS;
    delete process.env.NEXT_PUBLIC_WUJIE_USE_PRODUCTION_SUBAPPS;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...snapshot };
  });

  it("WUJIE_SUB_APP_URL uses localhost defaults when env unset", async () => {
    const mod = await import("./subAppOrigins");
    expect(mod.WUJIE_SUB_APP_URL.react).toBe("http://localhost:3001");
    expect(mod.WUJIE_SUB_APP_URL.vue).toBe("http://localhost:3002");
  });

  it("WUJIE_SUB_APP_URL reads public env overrides when not development", async () => {
    process.env.NEXT_PUBLIC_WUJIE_REACT_URL = "https://react.example";
    process.env.NEXT_PUBLIC_WUJIE_VUE_URL = "https://vue.example";
    stubNodeEnv("production");
    vi.resetModules();
    const mod = await import("./subAppOrigins");
    expect(mod.WUJIE_SUB_APP_URL.react).toBe("https://react.example");
    expect(mod.WUJIE_SUB_APP_URL.vue).toBe("https://vue.example");
  });

  it("BFF_CORS_ORIGIN_SET merges default ports and comma-separated extras", async () => {
    process.env.NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS =
      " https://a.test ,https://b.test ";
    const mod = await import("./subAppOrigins");
    expect(mod.BFF_CORS_ORIGIN_SET.has("http://localhost:3000")).toBe(true);
    expect(mod.BFF_CORS_ORIGIN_SET.has("http://127.0.0.1:3000")).toBe(true);
    expect(mod.BFF_CORS_ORIGIN_SET.has("http://localhost:3001")).toBe(true);
    expect(mod.BFF_CORS_ORIGIN_SET.has("https://a.test")).toBe(true);
    expect(mod.BFF_CORS_ORIGIN_SET.has("https://b.test")).toBe(true);
  });

  it("resolveWujieSubAppBases: Host localhost forces local subapps even when NODE_ENV=production and env points to prod", async () => {
    stubNodeEnv("production");
    vi.stubEnv(
      "NEXT_PUBLIC_WUJIE_REACT_URL",
      "https://react.prod.example",
    );
    vi.stubEnv("NEXT_PUBLIC_WUJIE_VUE_URL", "https://vue.prod.example");
    vi.resetModules();
    const mod = await import("./subAppOrigins");
    const r = mod.resolveWujieSubAppBases("localhost:3000");
    expect(r.react).toBe("http://localhost:3001");
    expect(r.vue).toBe("http://localhost:3002");
  });

  it("resolveWujieSubAppBases: real domain in production uses NEXT_PUBLIC_WUJIE_*", async () => {
    stubNodeEnv("production");
    vi.stubEnv(
      "NEXT_PUBLIC_WUJIE_REACT_URL",
      "https://react.prod.example",
    );
    vi.stubEnv("NEXT_PUBLIC_WUJIE_VUE_URL", "https://vue.prod.example");
    vi.resetModules();
    const mod = await import("./subAppOrigins");
    const r = mod.resolveWujieSubAppBases("pzfnqbn.top");
    expect(r.react).toBe("https://react.prod.example");
    expect(r.vue).toBe("https://vue.prod.example");
  });

  it("development + null Host uses local even if env has prod URLs", async () => {
    stubNodeEnv("development");
    vi.stubEnv(
      "NEXT_PUBLIC_WUJIE_REACT_URL",
      "https://react.prod.example",
    );
    vi.stubEnv("NEXT_PUBLIC_WUJIE_VUE_URL", "https://vue.prod.example");
    vi.resetModules();
    const mod = await import("./subAppOrigins");
    const r = mod.resolveWujieSubAppBases(null);
    expect(r.react).toBe("http://localhost:3001");
    expect(mod.BFF_CORS_ORIGIN_SET.has("https://react.prod.example")).toBe(
      true,
    );
  });

  it("NEXT_PUBLIC_WUJIE_USE_PRODUCTION_SUBAPPS forces env URLs even on localhost", async () => {
    stubNodeEnv("development");
    vi.stubEnv("NEXT_PUBLIC_WUJIE_USE_PRODUCTION_SUBAPPS", "true");
    vi.stubEnv(
      "NEXT_PUBLIC_WUJIE_REACT_URL",
      "https://react.prod.example",
    );
    vi.stubEnv("NEXT_PUBLIC_WUJIE_VUE_URL", "https://vue.prod.example");
    vi.resetModules();
    const mod = await import("./subAppOrigins");
    expect(mod.resolveWujieSubAppBases("localhost:3000").react).toBe(
      "https://react.prod.example",
    );
  });

  it("isLocalHostHeader", async () => {
    const mod = await import("./subAppOrigins");
    expect(mod.isLocalHostHeader("localhost:3000")).toBe(true);
    expect(mod.isLocalHostHeader("127.0.0.1:3000")).toBe(true);
    expect(mod.isLocalHostHeader("[::1]:3000")).toBe(true);
    expect(mod.isLocalHostHeader("pzfnqbn.top")).toBe(false);
    expect(mod.isLocalHostHeader(null)).toBe(false);
  });
});
