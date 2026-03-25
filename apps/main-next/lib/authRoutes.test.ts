import { describe, expect, it } from "vitest";
import { isProtectedRoute } from "./authRoutes";

describe("isProtectedRoute", () => {
  it("matches configured prefixes", () => {
    expect(isProtectedRoute("/dashboard")).toBe(true);
    expect(isProtectedRoute("/dashboard/settings")).toBe(true);
    expect(isProtectedRoute("/monitor/live")).toBe(true);
    expect(isProtectedRoute("/audit/run")).toBe(true);
  });

  it("returns false for public paths", () => {
    expect(isProtectedRoute("/login")).toBe(false);
    expect(isProtectedRoute("/")).toBe(false);
    expect(isProtectedRoute("/api/health")).toBe(false);
  });
});
