import { describe, it, expect } from "vitest";
import { viemManager } from "./viemClients";
import { SUPPORTED_CHAINS } from "@/constants";

describe("viemManager", () => {
  it("exposes a client for every supported chain", () => {
    SUPPORTED_CHAINS.forEach((chain) => {
      const client = viemManager.getClient(chain.id);
      expect(client).toBeDefined();
    });
  });

  it("returns undefined for unknown chain id", () => {
    expect(viemManager.getClient(999_999_999)).toBeUndefined();
  });

  it("getAllClients matches supported chain count", () => {
    const all = viemManager.getAllClients();
    expect(all.size).toBe(SUPPORTED_CHAINS.length);
  });
});
