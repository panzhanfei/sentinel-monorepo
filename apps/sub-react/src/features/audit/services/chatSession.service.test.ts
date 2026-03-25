import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  ChatSessionInitError,
  initChatSession,
} from "./chatSession.service";

describe("initChatSession", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns sessionId on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ sessionId: "sess-1" }),
      }),
    );
    await expect(initChatSession("0xabc", "http://bff.local")).resolves.toBe(
      "sess-1",
    );
    expect(fetch).toHaveBeenCalledWith(
      "http://bff.local/api/chat/session",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("throws ChatSessionInitError when not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      }),
    );
    await expect(initChatSession("0x", "http://x")).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof ChatSessionInitError && e.status === 401,
    );
  });

  it("throws when sessionId missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );
    await expect(initChatSession("0x", "http://x")).rejects.toThrow(
      "Session ID missing",
    );
  });
});
