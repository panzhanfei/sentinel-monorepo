import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { useWeb3Store } from "./useWeb3Store";

describe("useWeb3Store", () => {
  beforeEach(() => {
    const pinia = createPinia();
    pinia.use(piniaPluginPersistedstate);
    setActivePinia(pinia);
    vi.stubGlobal("$wujie", undefined);
  });

  it("defaults web3Date from window.$wujie.props when present", () => {
    const initial = { address: "0xabc", isConnected: true };
    vi.stubGlobal("$wujie", {
      props: { web3Date: initial, afterMount: vi.fn() },
    });
    const store = useWeb3Store();
    expect(store.web3Date).toEqual(initial);
  });

  it("updateWeb3Date replaces state", () => {
    const store = useWeb3Store();
    store.updateWeb3Date({
      address: "0x1111111111111111111111111111111111111111",
      chain: { id: 1, name: "Ethereum" },
      isConnected: true,
    });
    expect(store.web3Date.address).toBe(
      "0x1111111111111111111111111111111111111111",
    );
    expect(store.web3Date.chain?.id).toBe(1);
  });
});
