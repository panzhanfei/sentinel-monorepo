import type { ComponentObjectPropsOptions } from "vue";
import type { IWalletWaitingPlaceholderProps } from "./interface";

const walletWaitingPlaceholderPropsOptions: ComponentObjectPropsOptions<IWalletWaitingPlaceholderProps> =
  {
    visible: { type: Boolean, required: true },
  };

export const useWalletWaitingPlaceholderData = () => {
  return { props: walletWaitingPlaceholderPropsOptions };
}
