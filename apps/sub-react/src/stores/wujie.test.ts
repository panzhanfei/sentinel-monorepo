// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("useWujieStore", () => {
  beforeEach(() => {
    vi.resetModules();
    (window as unknown as { $wujie?: unknown }).$wujie = {
      props: {
        web3Date: { address: "0x1111111111111111111111111111111111111111" },
        afterMount: vi.fn(),
      },
    };
  });

  it("hydrates from wujie props and merges partial updates", async () => {
    const { useWujieStore } = await import("./wujie");
    const store = useWujieStore.getState();
    expect(store.wujieWeb3Date.address).toBe(
      "0x1111111111111111111111111111111111111111",
    );

    store.updateWujieState({ isConnected: true });
    expect(useWujieStore.getState().wujieWeb3Date.isConnected).toBe(true);

    useWujieStore.getState().reset();
    const after = useWujieStore.getState().wujieWeb3Date;
    expect(after.address).toBeUndefined();
    expect(after.isConnected).toBe(false);
  });
});
