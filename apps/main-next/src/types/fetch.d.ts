import { ProxyAgent } from "http";

declare global {
  interface RequestInit {
    agent?: ProxyAgent | undefined;
  }
}
