// src/global.d.ts 或 src/types/wujie.d.ts
export {}; // 确保文件是模块

// 扩展全局的 Window 接口
declare global {
  interface Window {
    $wujie?: {
      props: WujieProps;
      bus: EventBus;
      shadowRoot?: ShadowRoot;
    };
  }
}
