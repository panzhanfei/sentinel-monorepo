import { onMounted } from "vue";
import { useWeb3Store } from "@/stores";

export const useAppData = () => {
  const web3Store = useWeb3Store();

  onMounted(() => {
    web3Store.wujieAfterMount?.();
  });

  return {};
}
