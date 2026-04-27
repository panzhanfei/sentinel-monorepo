import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { useWeb3Store } from "@/stores";
import { initWujieBusListener } from "./wujie-bus-listener";

describe("initWujieBusListener", () => {
  let $on: ReturnType<typeof vi.fn>;
  let $off: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const pinia = createPinia();
    pinia.use(piniaPluginPersistedstate);
    setActivePinia(pinia);
    $on = vi.fn();
    $off = vi.fn();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("registers web3-data-change on the wujie bus", () => {
    vi.stubGlobal("$wujie", { bus: { $on, $off } });
    initWujieBusListener();
    expect($off).toHaveBeenCalledWith("web3-data-change", expect.any(Function));
    expect($on).toHaveBeenCalledWith("web3-data-change", expect.any(Function));
  });

  it("warns when bus is missing", () => {
    vi.stubGlobal("$wujie", {});
    initWujieBusListener();
    expect(console.warn).toHaveBeenCalled();
  });

  it("handler updates web3 store", () => {
    vi.stubGlobal("$wujie", { bus: { $on, $off } });
    initWujieBusListener();
    const handler = $on.mock.calls.find(
      (c) => c[0] === "web3-data-change",
    )?.[1] as ((p: unknown) => void) | undefined;
    expect(handler).toBeTypeOf("function");
    const store = useWeb3Store();
    handler?.({ address: "0xfeed", isConnected: true });
    expect(store.web3Date.address).toBe("0xfeed");
  });
});
