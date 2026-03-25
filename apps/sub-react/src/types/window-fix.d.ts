// src/global.d.ts 或 src/types/wujie.d.ts
export {}; // 确保文件是模块

declare global {
  interface WujieEventBus {
    $on(event: string, fn: (...args: unknown[]) => void): void;
    $off(event: string, fn: (...args: unknown[]) => void): void;
    $emit(event: string, payload?: unknown): void;
  }

  interface Window {
    $wujie?: {
      props: Record<string, unknown>;
      bus: WujieEventBus;
      shadowRoot?: ShadowRoot;
    };
  }
}
