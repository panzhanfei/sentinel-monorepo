import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMonitorStore } from "./useMonitorStore";
import type { TokenBalance } from "@/types/monitor";

describe("useMonitorStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("mergeScannedTokens upserts by id", () => {
    const store = useMonitorStore();
    const a: TokenBalance = {
      id: "1-0xabc",
      chainId: 1,
      chainName: "Ethereum",
      address: "0xabc",
      symbol: "A",
      balance: "1",
      loading: false,
    };
    store.mergeScannedTokens([a]);
    expect(store.customTokens).toHaveLength(1);

    const a2: TokenBalance = { ...a, balance: "2" };
    store.mergeScannedTokens([a2]);
    expect(store.customTokens).toHaveLength(1);
    expect(store.customTokens[0]?.balance).toBe("2");
  });

  it("removeToken filters list", () => {
    const store = useMonitorStore();
    store.mergeScannedTokens([
      {
        id: "x",
        chainId: 1,
        chainName: "Ethereum",
        address: "0x1",
        symbol: "S",
        balance: "0",
        loading: false,
      },
    ]);
    store.removeToken("x");
    expect(store.customTokens).toHaveLength(0);
  });

  it("clearCustomTokens empties monitored tokens", () => {
    const store = useMonitorStore();
    store.mergeScannedTokens([
      {
        id: "y",
        chainId: 1,
        chainName: "Ethereum",
        address: "0x2",
        symbol: "S",
        balance: "0",
        loading: false,
      },
    ]);
    store.clearCustomTokens();
    expect(store.customTokens).toHaveLength(0);
  });
});
