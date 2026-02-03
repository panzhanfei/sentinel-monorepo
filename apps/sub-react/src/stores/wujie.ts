import { create } from "zustand";
import { devtools } from "zustand/middleware"; // 可选：用于Redux DevTools

// 1. 定义状态的类型
interface WujieState {
  wujieWeb3Date: WujieWeb3Date;
  updateWujieState: (newWeb3Date: Partial<WujieWeb3Date>) => void;
  reset: () => void;
}

export type WujieWeb3Date = {
  address?: string;
  chain?: { id: number; name: string };
  isConnected?: boolean;
};

export const useWujieStore = create<WujieState>()(
  devtools(
    (set) => ({
      wujieWeb3Date: window.$wujie?.props?.web3Date || {},
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
    }),
    { name: "WuJie Store" },
  ),
);
