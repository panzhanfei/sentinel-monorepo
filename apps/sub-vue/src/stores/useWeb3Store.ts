// stores/user.js / stores/user.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export type Web3Date = {
  address?: string;
  chain?: { id: number; name: string };
  isConnected?: boolean;
};

export const useWeb3Store = defineStore(
  "web3",
  () => {
    const web3Date = ref<Web3Date>(window.$wujie?.props?.web3Date || {});
    const wujieAfterMount = window.$wujie?.props?.afterMount;

    const updateWeb3Date = (newWeb3Date: Web3Date) => {
      web3Date.value = newWeb3Date;
    };

    return {
      wujieAfterMount,
      web3Date,
      updateWeb3Date,
    };
  },
  {
    persist: true,
  },
);
