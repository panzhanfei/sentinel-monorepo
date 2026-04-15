import { describe, it, expect } from "vitest";
import { useChainBalanceGridData } from "./useData";

describe("useChainBalanceGridData", () => {
  it("exposes props schema with required chains", () => {
    const { props } = useChainBalanceGridData();
    expect(props.chains).toMatchObject({ required: true });
  });
});
