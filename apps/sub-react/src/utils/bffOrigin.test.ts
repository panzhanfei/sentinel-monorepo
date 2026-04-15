// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBffBaseUrl } from "./bffOrigin";

describe("getBffBaseUrl", () => {
  beforeEach(() => {
    delete (window as unknown as { $wujie?: unknown }).$wujie;
    vi.stubEnv("VITE_BFF_ORIGIN", "");
    vi.stubEnv("DEV", false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers trimmed wujie bffOrigin", () => {
    (window as unknown as { $wujie?: unknown }).$wujie = {
      props: { bffOrigin: "https://bff.example/api/" },
    };
    expect(getBffBaseUrl()).toBe("https://bff.example/api");
  });

  it("falls back to VITE_BFF_ORIGIN when wujie absent", () => {
    vi.stubEnv("VITE_BFF_ORIGIN", "https://env-bff/");
    expect(getBffBaseUrl()).toBe("https://env-bff");
  });

  it("uses window.location.origin by default", () => {
    window.history.pushState({}, "", "/sub-path");
    expect(getBffBaseUrl()).toBe(window.location.origin);
  });
});
