import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("authSession cookie helpers", () => {
  const snapshot = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    process.env = { ...snapshot };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = snapshot;
  });

  it("authCookieConfig exposes max-age seconds", async () => {
    const { authCookieConfig } = await import("./authSession");
    expect(authCookieConfig.accessMaxAge).toBe(15 * 60);
    expect(authCookieConfig.refreshMaxAge).toBe(60 * 60 * 24 * 7);
  });

  it("getAuthCookieBase uses none+secure in development for microfrontend creds", async () => {
    (vi.stubEnv as (key: string, val: string) => void)("NODE_ENV", "development");
    delete process.env.AUTH_COOKIE_SAME_SITE;
    const { getAuthCookieBase } = await import("./authSession");
    const base = getAuthCookieBase();
    expect(base.httpOnly).toBe(true);
    expect(base.path).toBe("/");
    expect(base.sameSite).toBe("none");
    expect(base.secure).toBe(true);
  });

  it("getAuthCookieBase honors AUTH_COOKIE_SAME_SITE=lax in development", async () => {
    (vi.stubEnv as (key: string, val: string) => void)("NODE_ENV", "development");
    process.env.AUTH_COOKIE_SAME_SITE = "lax";
    const { getAuthCookieBase } = await import("./authSession");
    const base = getAuthCookieBase();
    expect(base.sameSite).toBe("lax");
    expect(base.secure).toBe(false);
  });

  it("getAuthCookieBase honors AUTH_COOKIE_SAME_SITE=none", async () => {
    process.env.AUTH_COOKIE_SAME_SITE = "none";
    const { getAuthCookieBase } = await import("./authSession");
    const base = getAuthCookieBase();
    expect(base.sameSite).toBe("none");
    expect(base.secure).toBe(true);
  });
});
