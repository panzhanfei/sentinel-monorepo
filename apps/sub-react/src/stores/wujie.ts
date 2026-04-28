import { create } from "zustand";
import { devtools } from "zustand/middleware"; // 可选：用于Redux DevTools

// 1. 定义状态的类型
interface WujieState {
  wujieWeb3Date: WujieWeb3Date;
  wujieAfterMount?: () => void;
  updateWujieState: (newWeb3Date: Partial<WujieWeb3Date>) => void;
  reset: () => void;
}

export type WujieWeb3Date = {
  address?: string;
  chain?: { id: number; name: string };
  isConnected?: boolean;
};

/** Node/SSR：`window` 可能不存在；勿直接读 `window` 以免 ReferenceError。 */
const readWujiePropsFromWindow = ():
  | {
      afterMount?: () => void;
      web3Data?: WujieWeb3Date;
      web3Date?: WujieWeb3Date;
    }
  | undefined => {
  if (typeof window === "undefined") return undefined;
  return (
    window as Window & {
      $wujie?: {
        props?: {
          afterMount?: () => void;
          web3Data?: WujieWeb3Date;
          web3Date?: WujieWeb3Date;
        };
      };
    }
  ).$wujie?.props;
};

export const useWujieStore = create<WujieState>()(
  devtools(
    (set) => {
      const wujieProps = readWujiePropsFromWindow();
      return {
        wujieAfterMount: wujieProps?.afterMount,
        wujieWeb3Date:
          wujieProps?.web3Data || wujieProps?.web3Date || {},
        updateWujieState: (newWeb3Date: WujieWeb3Date) =>
        set(
          (state) => ({
            wujieWeb3Date: {
              ...state.wujieWeb3Date, // 保留旧状态
              ...newWeb3Date, // 覆盖新状态
            },
          }),
          false,
          "wujie/updateWujieState",
        ),

        reset: () =>
        set(
          {
            wujieWeb3Date: {
              address: undefined,
              chain: undefined,
              isConnected: false,
            },
          },
          false,
          "wujie/reset",
        ),
      };
    },
    { name: "WuJie Store" },
  ),
);
