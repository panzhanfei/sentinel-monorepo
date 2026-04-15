import { describe, it, expect } from "vitest";
import { formatWeiToEth, truncateHash } from "./format";

describe("formatWeiToEth", () => {
  it("converts wei string to ETH with fixed digits", () => {
    expect(formatWeiToEth(String(1e18), 2)).toBe("1.00");
    expect(formatWeiToEth(String(5e17), 4)).toBe("0.5000");
  });

  it("returns 0 for invalid input", () => {
    expect(formatWeiToEth("nope")).toBe("0");
  });
});

describe("truncateHash", () => {
  it("returns short hashes unchanged", () => {
    expect(truncateHash("0xabc", 10)).toBe("0xabc");
  });

  it("truncates long hashes", () => {
    const h = "0x" + "a".repeat(64);
    expect(truncateHash(h, 8)).toBe("0xaaaaaa...");
  });
});
