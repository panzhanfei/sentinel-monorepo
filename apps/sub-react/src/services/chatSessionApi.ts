import { getBffBaseUrl } from "@/utils/bffOrigin";
import { bffFetch } from "@/utils/bffFetch";

export class ChatSessionInitError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = "ChatSessionInitError";
    this.status = status;
    this.statusText = statusText;
  }
}

export const initChatSession = async (address: string | undefined, bffBase: string = getBffBaseUrl()) : Promise<string> => {
  const res = await bffFetch(`${bffBase}/api/chat/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ address }),
  });

  if (!res.ok) {
    throw new ChatSessionInitError(
      `Failed to init session: ${res.status} ${res.statusText}`,
      res.status,
      res.statusText,
    );
  }

  const body = (await res.json()) as {
    success?: boolean;
    data?: { sessionId?: string };
  };
  if (!body.success || typeof body.data?.sessionId !== "string") {
    throw new Error("Session ID missing in response");
  }
  return body.data.sessionId;
}
