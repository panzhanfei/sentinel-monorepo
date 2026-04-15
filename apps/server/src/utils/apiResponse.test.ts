import { describe, it, expect, vi } from "vitest";
import type { Response } from "express";
import {
  HttpError,
  sendSuccess,
  sendFailure,
} from "./apiResponse";

const mockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

describe("HttpError", () => {
  it("carries status and optional code", () => {
    const err = new HttpError(403, "nope", "E_FORBIDDEN");
    expect(err.status).toBe(403);
    expect(err.message).toBe("nope");
    expect(err.code).toBe("E_FORBIDDEN");
  });
});

describe("sendSuccess", () => {
  it("responds with success envelope", () => {
    const res = mockRes();
    sendSuccess(res, { id: 1 }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1 },
    });
  });
});

describe("sendFailure", () => {
  it("responds with error envelope and optional code", () => {
    const res = mockRes();
    sendFailure(res, 400, "bad", "BAD");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: "bad", code: "BAD" },
    });
  });

  it("omits code when not provided", () => {
    const res = mockRes();
    sendFailure(res, 500, "oops");
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: "oops" },
    });
  });
});
