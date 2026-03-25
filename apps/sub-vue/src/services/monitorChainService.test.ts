import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Address } from "viem";
import {
  createInitialChainBalances,
  fetchErc20OnChain,
} from "./monitorChainService";
import { SUPPORTED_CHAINS } from "@/constants/chains";

describe("createInitialChainBalances", () => {
  it("aligns rows with supported chains", () => {
    const rows = createInitialChainBalances();
    expect(rows).toHaveLength(SUPPORTED_CHAINS.length);
    expect(rows[0]).toMatchObject({
      balance: "0.00",
      height: 0,
      loading: false,
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
