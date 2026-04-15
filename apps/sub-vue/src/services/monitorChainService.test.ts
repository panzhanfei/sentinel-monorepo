import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Address } from "viem";
import {
  createInitialChainBalances,
  fetchErc20OnChain,
  refreshChainBalanceRow,
  refreshAllNativeBalances,
  scanErc20AcrossChains,
} from "./monitorChainService";
import { SUPPORTED_CHAINS } from "@/constants/chains";
import type { ChainBalance } from "@/types/monitor";

describe("createInitialChainBalances", () => {
  it("aligns rows with supported chains", () => {
    const rows = createInitialChainBalances();
    expect(rows).toHaveLength(SUPPORTED_CHAINS.length);
    expect(rows[0]).toMatchObject({
      balance: "0.00",
      height: 0,
      loading: false,
      isError: false,
    });
  });

  it("maps each supported chain id, name, and native symbol", () => {
    const rows = createInitialChainBalances();
    rows.forEach((row, i) => {
      const chain = SUPPORTED_CHAINS[i]!;
      expect(row.chainId).toBe(chain.id);
      expect(row.chainName).toBe(chain.name);
      expect(row.symbol).toBe(chain.nativeCurrency?.symbol || "ETH");
    });
  });
});

describe("refreshChainBalanceRow", () => {
  const user = "0x2222222222222222222222222222222222222222" as Address;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("no-ops when client is missing", async () => {
    const item: ChainBalance = {
      chainId: 1,
      chainName: "Ethereum",
      balance: "0.00",
      symbol: "ETH",
      height: 0,
      loading: false,
      isError: false,
    };
    await refreshChainBalanceRow(item, user, () => undefined);
    expect(item.loading).toBe(false);
    expect(item.balance).toBe("0.00");
  });

  it("updates balance, height, and clears error on success", async () => {
    const item: ChainBalance = {
      chainId: 1,
      chainName: "Ethereum",
      balance: "0.00",
      symbol: "ETH",
      height: 0,
      loading: false,
      isError: true,
    };
    const mockClient = {
      getBalance: vi.fn().mockResolvedValue(10n ** 18n),
      getBlockNumber: vi.fn().mockResolvedValue(12345n),
    };
    await refreshChainBalanceRow(item, user, () => mockClient as never);
    expect(item.balance).toBe("1.0000");
    expect(item.height).toBe(12345);
    expect(item.isError).toBe(false);
    expect(item.loading).toBe(false);
  });

  it("sets isError and clears loading when fetch fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const item: ChainBalance = {
      chainId: 1,
      chainName: "Ethereum",
      balance: "0.00",
      symbol: "ETH",
      height: 0,
      loading: false,
      isError: false,
    };
    const mockClient = {
      getBalance: vi.fn().mockRejectedValue(new Error("rpc down")),
      getBlockNumber: vi.fn().mockResolvedValue(1n),
    };
    await refreshChainBalanceRow(item, user, () => mockClient as never);
    expect(item.isError).toBe(true);
    expect(item.loading).toBe(false);
  });
});

describe("refreshAllNativeBalances", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("refreshes every row in parallel", async () => {
    const rows = createInitialChainBalances();
    const mockClient = {
      getBalance: vi.fn().mockResolvedValue(0n),
      getBlockNumber: vi.fn().mockResolvedValue(1n),
    };
    await refreshAllNativeBalances(
      rows,
      "0x2222222222222222222222222222222222222222" as Address,
      () => mockClient as never,
    );
    expect(mockClient.getBalance).toHaveBeenCalledTimes(rows.length);
    rows.forEach((r) => {
      expect(r.loading).toBe(false);
      expect(r.isError).toBe(false);
    });
  });
});

describe("fetchErc20OnChain", () => {
  const token = "0x1111111111111111111111111111111111111111" as Address;
  const user = "0x2222222222222222222222222222222222222222" as Address;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when client is missing", async () => {
    const result = await fetchErc20OnChain(
      1,
      "Ethereum",
      token,
      user,
      () => undefined,
    );
    expect(result).toBeNull();
  });

  it("returns token row when contract reads succeed", async () => {
    const readContract = vi
      .fn()
      .mockResolvedValueOnce("TST")
      .mockResolvedValueOnce(18)
      .mockResolvedValueOnce(5000n);

    const mockClient = { readContract };
    const result = await fetchErc20OnChain(1, "Ethereum", token, user, () =>
      mockClient as never,
    );

    expect(result).toEqual({
      id: `1-${token.toLowerCase()}`,
      chainId: 1,
      chainName: "Ethereum",
      address: token,
      symbol: "TST",
      balance: "0.000000000000005",
      loading: false,
    });
  });

  it("returns null when readContract throws", async () => {
    const mockClient = {
      readContract: vi.fn().mockRejectedValue(new Error("revert")),
    };
    const result = await fetchErc20OnChain(1, "Ethereum", token, user, () =>
      mockClient as never,
    );
    expect(result).toBeNull();
  });
});

describe("scanErc20AcrossChains", () => {
  const token = "0x1111111111111111111111111111111111111111" as Address;
  const user = "0x2222222222222222222222222222222222222222" as Address;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array for invalid token address", async () => {
    const readContract = vi.fn();
    const result = await scanErc20AcrossChains("not-an-address", user, () =>
      ({ readContract } as never),
    );
    expect(result).toEqual([]);
    expect(readContract).not.toHaveBeenCalled();
  });

  it("aggregates non-null results from each chain", async () => {
    const successChainId = SUPPORTED_CHAINS[0]!.id;
    const successClient = {
      readContract: vi
        .fn()
        .mockResolvedValueOnce("TST")
        .mockResolvedValueOnce(18)
        .mockResolvedValueOnce(1000n),
    };
    const failClient = {
      readContract: vi.fn().mockRejectedValue(new Error("no contract")),
    };
    const result = await scanErc20AcrossChains(token, user, (id) =>
      id === successChainId ? (successClient as never) : (failClient as never),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      chainId: successChainId,
      symbol: "TST",
      address: token,
      id: `${successChainId}-${token.toLowerCase()}`,
    });
    expect(failClient.readContract).toHaveBeenCalled();
  });
});
