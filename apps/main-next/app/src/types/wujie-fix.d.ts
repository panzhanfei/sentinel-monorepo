// src/types/wujie-react.d.ts
declare module "wujie-react" {
  import { FC, HTMLAttributes } from "react";

  export interface WujieProps {
    name: string;
    url: string;
    width?: string;
    height?: string;
    childWindowKeepAlive?: boolean;
    props?: Record<string, unknown>;
    sync?: boolean;
    loading?: React.ReactNode;
    // ... 根据需要添加其他官方文档支持的属性
  }

  const WujieReact: {
    props: WujieProps;
    bus: WujieBus;
    shadowRoot?: ShadowRoot;
  };

  export const bus: {
    $on: (event: string, callback: (...args: unknown[]) => void) => void;
    $off: (event: string, callback: (...args: unknown[]) => void) => void;
    $emit: (event: string, ...args: unknown[]) => void;
  };
  export const setupApp: (options: unknown) => void;
  export const destroyApp: (name: string) => void;
  export default WujieReact;
}
