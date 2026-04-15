import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("subAppOrigins", () => {
  const snapshot = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...snapshot };
    delete process.env.NEXT_PUBLIC_WUJIE_REACT_URL;
    delete process.env.NEXT_PUBLIC_WUJIE_VUE_URL;
    delete process.env.NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS;
  });

  afterEach(() => {
    process.env = snapshot;
  });

  it("WUJIE_SUB_APP_URL uses localhost defaults when env unset", async () => {
    const mod = await import("./subAppOrigins");
    expect(mod.WUJIE_SUB_APP_URL.react).toBe("http://localhost:3001");
    expect(mod.WUJIE_SUB_APP_URL.vue).toBe("http://localhost:3002");
  });

  it("WUJIE_SUB_APP_URL reads public env overrides", async () => {
    process.env.NEXT_PUBLIC_WUJIE_REACT_URL = "https://react.example";
    process.env.NEXT_PUBLIC_WUJIE_VUE_URL = "https://vue.example";
    const mod = await import("./subAppOrigins");
    expect(mod.WUJIE_SUB_APP_URL.react).toBe("https://react.example");
    expect(mod.WUJIE_SUB_APP_URL.vue).toBe("https://vue.example");
  });

  it("BFF_CORS_ORIGIN_SET merges default ports and comma-separated extras", async () => {
    process.env.NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS =
      " https://a.test ,https://b.test ";
    const mod = await import("./subAppOrigins");
    expect(mod.BFF_CORS_ORIGIN_SET.has("http://localhost:3001")).toBe(true);
    expect(mod.BFF_CORS_ORIGIN_SET.has("https://a.test")).toBe(true);
    expect(mod.BFF_CORS_ORIGIN_SET.has("https://b.test")).toBe(true);
  });
});
