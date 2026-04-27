import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMonitorStore } from "./useMonitorStore";
import type { TokenBalance } from "@/types";

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

  it("filteredTokens returns all when activeTab is all", () => {
    const store = useMonitorStore();
    store.activeTab = "all";
    store.mergeScannedTokens([
      {
        id: "a-1",
        chainId: 1,
        chainName: "Ethereum",
        address: "0x1",
        symbol: "A",
        balance: "1",
        loading: false,
      },
      {
        id: "b-2",
        chainId: 2,
        chainName: "Other",
        address: "0x2",
        symbol: "B",
        balance: "2",
        loading: false,
      },
    ]);
    expect(store.filteredTokens).toHaveLength(2);
  });

  it("filteredTokens narrows by chain id tab", () => {
    const store = useMonitorStore();
    store.mergeScannedTokens([
      {
        id: "a-1",
        chainId: 1,
        chainName: "Ethereum",
        address: "0x1",
        symbol: "A",
        balance: "1",
        loading: false,
      },
      {
        id: "b-2",
        chainId: 42,
        chainName: "Other",
        address: "0x2",
        symbol: "B",
        balance: "2",
        loading: false,
      },
    ]);
    store.activeTab = 42;
    expect(store.filteredTokens).toHaveLength(1);
    expect(store.filteredTokens[0]?.id).toBe("b-2");
  });
});
