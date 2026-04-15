import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { ChainBalance, TokenBalance } from "@/types/monitor";
import { createInitialChainBalances } from "@/services/monitorChainService";

/** 监控看板状态（不含副作用） */
export const useMonitorStore = defineStore("monitor", () => {
  const chainBalances = ref<ChainBalance[]>(createInitialChainBalances());
  const customTokens = ref<TokenBalance[]>([]);
  const activeTab = ref<number | "all">("all");

  const filteredTokens = computed(() => {
    if (activeTab.value === "all") return customTokens.value;
    return customTokens.value.filter((t) => t.chainId === activeTab.value);
  });

  const mergeScannedTokens = (found: TokenBalance[]) => {
        for (const newToken of found) {
          const idx = customTokens.value.findIndex((t) => t.id === newToken.id);
          if (idx > -1) {
            customTokens.value[idx] = newToken;
          } else {
            customTokens.value.push(newToken);
          }
        }
      }

  const removeToken = (tokenId: string) => {
        customTokens.value = customTokens.value.filter((t) => t.id !== tokenId);
      }

  const clearCustomTokens = () => {
        customTokens.value = [];
      }

  return {
    chainBalances,
    customTokens,
    activeTab,
    filteredTokens,
    mergeScannedTokens,
    removeToken,
    clearCustomTokens,
  };
});
