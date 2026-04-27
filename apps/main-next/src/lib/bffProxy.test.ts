import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { validateDualSession } = vi.hoisted(() => ({
  validateDualSession: vi.fn(),
}));

vi.mock("./authSession", () => ({
  validateDualSession,
}));

import {
  parseUpstreamJson,
  proxyHeadersToNode,
  dualAuthUnauthorizedJson,
} from "./bffProxy";

describe("parseUpstreamJson", () => {
  it("parses JSON bodies", async () => {
    const res = new Response('{"ok":true}');
    await expect(parseUpstreamJson(res)).resolves.toEqual({ ok: true });
  });

  it("treats whitespace-only body as empty object", async () => {
    const res = new Response("  \n  ");
    await expect(parseUpstreamJson(res)).resolves.toEqual({});
  });

  it("returns a structured error for non-JSON payloads", async () => {
    const res = new Response("plain", {
      status: 502,
      headers: { "content-type": "text/plain" },
    });
    await expect(parseUpstreamJson(res)).resolves.toEqual({
      error: "Upstream returned non-JSON response",
      status: 502,
      contentType: "text/plain",
    });
  });
});

describe("proxyHeadersToNode", () => {
  it("forwards Bearer token as Authorization", () => {
    const req = new NextRequest("http://localhost/x", {
      headers: { authorization: "Bearer token-1" },
    });
    const headers = new Headers(proxyHeadersToNode(req));
    expect(headers.get("Authorization")).toBe("Bearer token-1");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("prefixes Bearer for non-Bearer authorization values", () => {
    const req = new NextRequest("http://localhost/x", {
      headers: { authorization: "custom" },
    });
    const headers = new Headers(proxyHeadersToNode(req));
    expect(headers.get("Authorization")).toBe("Bearer custom");
  });
});

describe("dualAuthUnauthorizedJson", () => {
  beforeEach(() => {
    validateDualSession.mockReset();
  });

  it("returns 401 when either token is missing", async () => {
    const req = new NextRequest("http://localhost/x");
    const res = await dualAuthUnauthorizedJson(req);
    expect(res?.status).toBe(401);
    expect(validateDualSession).not.toHaveBeenCalled();
  });

  it("returns null when validation succeeds", async () => {
    validateDualSession.mockResolvedValue({
      ok: true,
      sub: "user",
      sid: "sid",
      accessPayload: {},
      refreshPayload: {},
    });
    const req = new NextRequest("http://localhost/x", {
      headers: {
        authorization: "Bearer access-token",
        cookie: "refreshToken=refresh-token",
      },
    });
    const res = await dualAuthUnauthorizedJson(req);
    expect(res).toBeNull();
    expect(validateDualSession).toHaveBeenCalledWith({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });
});
