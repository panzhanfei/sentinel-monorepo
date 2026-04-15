import { getBffBaseUrl } from "@/utils/bffOrigin";

export const buildChatStreamUrl = (sessionId: string, message: string) : string => {
  const url = new URL("/api/chat/stream", getBffBaseUrl());
  url.searchParams.set("sessionId", sessionId);
  url.searchParams.set("message", message);
  return url.toString();
}
