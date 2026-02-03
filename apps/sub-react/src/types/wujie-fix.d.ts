// src/types/wujie-react.d.ts
declare module "wujie-react" {
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
    bus: EventBus;
    shadowRoot?: ShadowRoot;
  };
  export default WujieReact;
}
