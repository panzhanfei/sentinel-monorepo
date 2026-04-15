import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./asyncHandler";

describe("asyncHandler", () => {
  it("forwards async errors to next", async () => {
    const err = new Error("boom");
    const fn = vi.fn().mockRejectedValue(err);
    const handler = asyncHandler(fn);
    const next = vi.fn() as NextFunction;
    await handler({} as Request, {} as Response, next);
    expect(fn).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(err);
  });

  it("does not call next when handler resolves", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);
    const next = vi.fn() as NextFunction;
    await handler({} as Request, {} as Response, next);
    expect(next).not.toHaveBeenCalled();
  });
});
