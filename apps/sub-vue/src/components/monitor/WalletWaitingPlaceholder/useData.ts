import type { ComponentObjectPropsOptions } from "vue";
import type { IProps } from "./interface";

const walletWaitingPlaceholderPropsOptions: ComponentObjectPropsOptions<IProps> =
  {
    visible: { type: Boolean, required: true },
  };

export const useWalletWaitingPlaceholderData = () => {
  return { props: walletWaitingPlaceholderPropsOptions };
}
