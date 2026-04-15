import { describe, it, expect } from "vitest";
import { buildDistributionSlices, buildTrendSeries } from "./useChartSeries";

describe("buildDistributionSlices", () => {
  it("merges chain and custom token rows and drops non-positive values", () => {
    const slices = buildDistributionSlices(
      [
        { symbol: "ETH", balance: "1.5" },
        { symbol: "ZERO", balance: "0" },
      ],
      [{ symbol: "USDC", balance: "100" }],
    );
    expect(slices).toEqual([
      { name: "ETH", value: 1.5 },
      { name: "USDC", value: 100 },
    ]);
  });

  it("drops invalid balances", () => {
    const slices = buildDistributionSlices(
      [{ symbol: "X", balance: "not-a-number" }],
      [],
    );
    expect(slices).toEqual([]);
  });
});

describe("buildTrendSeries", () => {
  it("scales trend from summed native balances", () => {
    const series = buildTrendSeries([
      { symbol: "A", balance: "10" },
      { symbol: "B", balance: "20" },
    ]);
    expect(series.dates).toHaveLength(6);
    expect(series.values).toHaveLength(6);
    expect(series.values[series.values.length - 1]).toBe(30);
    expect(series.values[0]).toBe(27);
  });
});
