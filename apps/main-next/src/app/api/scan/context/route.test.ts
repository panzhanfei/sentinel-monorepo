import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const parseUpstreamJson = vi.hoisted(() =>
  vi.fn(async (r: Response) => r.json()),
);
const dualAuthUnauthorizedJson = vi.hoisted(() =>
  vi.fn(async (_req: NextRequest) => null),
);
const authHeadersForProxy = vi.hoisted(() =>
  vi.fn((_req: NextRequest) : HeadersInit => ({})),
);

vi.mock("@/lib/bffProxy", () => ({
  parseUpstreamJson: (r: Response) => parseUpstreamJson(r),
  dualAuthUnauthorizedJson: (req: NextRequest) => dualAuthUnauthorizedJson(req),
  authHeadersForProxy: (req: NextRequest) => authHeadersForProxy(req),
}));

vi.mock("@/config/node_service", () => ({
  NODE_SERVICE: "http://node.test/v1",
}));

import { GET } from "./route";

describe("GET /api/scan/context (BFF)", () => {
  beforeEach(() => {
    parseUpstreamJson.mockReset();
    dualAuthUnauthorizedJson.mockReset();
    authHeadersForProxy.mockReset();
    dualAuthUnauthorizedJson.mockResolvedValue(null);
    global.fetch = vi.fn();
  });

  it("returns 400 when address is missing", async () => {
    const req = new NextRequest("http://localhost/api/scan/context");
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("forwards to Node scan/context and returns upstream JSON", async () => {
    const payload = { success: true, data: { latest: null, telegramChatId: null } };
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    const req = new NextRequest(
      "http://localhost/api/scan/context?address=0xabc",
    );
    const res = await GET(req);
    expect(dualAuthUnauthorizedJson).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      "http://node.test/v1/scan/context?address=0xabc",
      expect.objectContaining({ cache: "no-store" }),
    );
    const body = (await res.json()) as typeof payload;
    expect(body).toEqual(payload);
  });
});
