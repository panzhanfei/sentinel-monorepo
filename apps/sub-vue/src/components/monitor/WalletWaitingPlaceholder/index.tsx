import { defineComponent } from "vue";
import type { IWalletWaitingPlaceholderProps } from "./interface";
import { useWalletWaitingPlaceholderData } from "./useData";

export default defineComponent({
  name: "WalletWaitingPlaceholder",
  ...useWalletWaitingPlaceholderData(),
  setup: (props: IWalletWaitingPlaceholderProps) => {
      return () =>
        props.visible ? (
          <div class="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-4xl">
            <div class="text-zinc-600 font-mono text-xs animate-pulse">
              WAITING_FOR_WALLET_CONNECTION...
            </div>
          </div>
        ) : null;
    },
});
