import { describe, it, expect } from "vitest";
import { SUPPORTED_TOKENS, COMMON_SPENDERS } from "./constants";

describe("SUPPORTED_TOKENS", () => {
  it("lists known symbols with 0x addresses", () => {
    expect(SUPPORTED_TOKENS.length).toBeGreaterThanOrEqual(4);
    SUPPORTED_TOKENS.forEach((t) => {
      expect(t.symbol).toBeTruthy();
      expect(t.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(t.decimals).toBeGreaterThan(0);
    });
  });
});

describe("COMMON_SPENDERS", () => {
  it("lists named spenders with addresses", () => {
    expect(COMMON_SPENDERS.length).toBeGreaterThanOrEqual(3);
    COMMON_SPENDERS.forEach((s) => {
      expect(s.name).toBeTruthy();
      expect(s.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });
});
