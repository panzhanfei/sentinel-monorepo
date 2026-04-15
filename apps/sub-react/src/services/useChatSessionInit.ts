import { useCallback } from "react";
import { ChatSessionInitError, initChatSession } from "./chatSessionApi";

export { ChatSessionInitError, initChatSession };

export const useChatSessionInit = () => {
  const run = useCallback(
    (address: string | undefined, bffBase?: string) =>
      initChatSession(address, bffBase),
    [],
  );
  return { initChatSession: run };
}
