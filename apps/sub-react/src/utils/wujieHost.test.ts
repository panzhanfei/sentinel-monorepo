// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AUTH_SESSION_INVALID_EVENT,
  emitAuditAiStreamToHost,
  emitAuthSessionInvalidToHost,
} from "./wujieHost";

describe("wujieHost bus helpers", () => {
  beforeEach(() => {
    delete (window as unknown as { $wujie?: unknown }).$wujie;
  });

  it("emitAuditAiStreamToHost emits audit-ai-stream when bus exists", () => {
    const $emit = vi.fn();
    (window as unknown as { $wujie?: { bus?: { $emit: typeof $emit } } }).$wujie =
      { bus: { $emit } };
    emitAuditAiStreamToHost(true);
    expect($emit).toHaveBeenCalledWith("audit-ai-stream", { active: true });
  });

  it("emitAuthSessionInvalidToHost uses AUTH_SESSION_INVALID_EVENT", () => {
    const $emit = vi.fn();
    (window as unknown as { $wujie?: { bus?: { $emit: typeof $emit } } }).$wujie =
      { bus: { $emit } };
    emitAuthSessionInvalidToHost({ reason: "expired" });
    expect($emit).toHaveBeenCalledWith(AUTH_SESSION_INVALID_EVENT, {
      reason: "expired",
    });
  });

  it("swallows bus errors in standalone mode", () => {
    (window as unknown as { $wujie?: unknown }).$wujie = {
      bus: {
        $emit: () => {
          throw new Error("no bus");
        },
      },
    };
    expect(() => emitAuditAiStreamToHost(false)).not.toThrow();
  });
});
