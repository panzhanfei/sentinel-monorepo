import { describe, it, expect } from "vitest";
import {
  isClearlyOffTopicQuestion,
  getAllowancesFromJobResult,
  hasCompletedScanWithData,
} from "./guards";

describe("isClearlyOffTopicQuestion", () => {
  it("treats empty as off-topic", () => {
    expect(isClearlyOffTopicQuestion("")).toBe(true);
    expect(isClearlyOffTopicQuestion("   ")).toBe(true);
  });

  it("returns false when message contains an ETH address", () => {
    expect(
      isClearlyOffTopicQuestion(
        "hello 0x1111111111111111111111111111111111111111",
      ),
    ).toBe(false);
  });

  it("flags short greeting without digits", () => {
    expect(isClearlyOffTopicQuestion("你好")).toBe(true);
  });

  it("flags creative off-topic patterns", () => {
    expect(isClearlyOffTopicQuestion("用python写排序")).toBe(true);
  });
});

describe("getAllowancesFromJobResult", () => {
  it("returns null for non-object", () => {
    expect(getAllowancesFromJobResult(null)).toBeNull();
    expect(getAllowancesFromJobResult("x")).toBeNull();
  });

  it("returns array when allowances present", () => {
    const allowances = [{ token: "a" }];
    expect(getAllowancesFromJobResult({ allowances })).toEqual(allowances);
  });

  it("returns null when allowances missing or not array", () => {
    expect(getAllowancesFromJobResult({})).toBeNull();
    expect(getAllowancesFromJobResult({ allowances: 1 })).toBeNull();
  });
});

describe("hasCompletedScanWithData", () => {
  it("requires completed status and non-empty allowances", () => {
    expect(hasCompletedScanWithData(null)).toBe(false);
    expect(
      hasCompletedScanWithData({
        status: "PENDING",
        result: { allowances: [1] },
      }),
    ).toBe(false);
    expect(
      hasCompletedScanWithData({
        status: "COMPLETED",
        result: { allowances: [] },
      }),
    ).toBe(false);
    expect(
      hasCompletedScanWithData({
        status: "COMPLETED",
        result: { allowances: [{}] },
      }),
    ).toBe(true);
  });
});
