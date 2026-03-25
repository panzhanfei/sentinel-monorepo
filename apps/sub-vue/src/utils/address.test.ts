import { describe, it, expect } from "vitest";
import { isValidEvmAddress } from "./address";

describe("isValidEvmAddress", () => {
  it("accepts 40 hex chars after 0x", () => {
    expect(
      isValidEvmAddress("0xabcdef0123456789abcdef0123456789abcdef01"),
    ).toBe(true);
  });

  it("rejects wrong length or charset", () => {
    expect(isValidEvmAddress("0xabc")).toBe(false);
    expect(isValidEvmAddress("abcdef0123456789abcdef0123456789abcdef01")).toBe(
      false,
    );
    expect(
      isValidEvmAddress("0xgggggggggggggggggggggggggggggggggggggg"),
    ).toBe(false);
  });
});
