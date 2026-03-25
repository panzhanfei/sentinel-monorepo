import { describe, expect, it } from "vitest";
import { getMiddlewareAuthNavigation } from "./middlewareAuthNavigation";

describe("getMiddlewareAuthNavigation", () => {
  it("redirects unauthenticated users from protected routes to login with from", () => {
    expect(
      getMiddlewareAuthNavigation({
        pathname: "/dashboard",
        hasSession: false,
      })
    ).toEqual({
      kind: "redirect",
      path: "/login",
      search: { from: "/dashboard" },
    });
  });

  it("allows unauthenticated access to non-protected routes", () => {
    expect(
      getMiddlewareAuthNavigation({ pathname: "/", hasSession: false })
    ).toEqual({ kind: "continue" });
  });

  it("redirects authenticated users away from login to dashboard", () => {
    expect(
      getMiddlewareAuthNavigation({ pathname: "/login", hasSession: true })
    ).toEqual({ kind: "redirect", path: "/dashboard" });
  });

  it("allows authenticated users on protected routes", () => {
    expect(
      getMiddlewareAuthNavigation({
        pathname: "/audit",
        hasSession: true,
      })
    ).toEqual({ kind: "continue" });
  });
});
