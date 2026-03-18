import { ref, onMounted, onUnmounted, computed } from "vue";

export function useMonitorLogic() {
  const blockHeights = ref<Record<string, number>>({
    Ethereum: 19456780,
    Base: 12894560,
    Arbitrum: 20184466,
    Polygon: 54896712,
  });

  const simulateSSE = () => {
    // 模拟 EventSource 接收后端推送
    const timer = setInterval(() => {
      Object.keys(blockHeights.value).forEach((chain) => {
        // 随机增加 1-3 个区块
        blockHeights.value[chain]! += Math.floor(Math.random() * 2);
      });
    }, 3000);
    return () => clearInterval(timer);
  };

  // --- V-3: 哨兵注册逻辑 ---
  const sentinelAddr = ref("");
  const isRegistering = ref(false);
  const registerStatus = ref<"idle" | "success" | "error">("idle");

  const validateAddr = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const handleRegister = async () => {
    if (!validateAddr(sentinelAddr.value)) {
      registerStatus.value = "error";
      return;
    }
    isRegistering.value = true;
    // 模拟注册动效
    await new Promise((resolve) => setTimeout(resolve, 1500));
    isRegistering.value = false;
    registerStatus.value = "success";
    setTimeout(() => {
      registerStatus.value = "idle";
      sentinelAddr.value = "";
    }, 3000);
  };

  // --- V-2 & V-4: 图表数据准备 ---
  const assetDistribution = computed(() => [
    { value: 45, name: "Ethereum", itemStyle: { color: "#6366f1" } },
    { value: 25, name: "Arbitrum", itemStyle: { color: "#3b82f6" } },
    { value: 20, name: "Base", itemStyle: { color: "#10b981" } },
    { value: 10, name: "Others", itemStyle: { color: "#64748b" } },
  ]);

  const historyTrend = computed(() => ({
    dates: ["04:00", "08:00", "12:00", "16:00", "20:00", "00:00"],
    values: [12000, 13500, 12800, 15000, 14200, 16000],
  }));

  onMounted(() => {
    const stopSSE = simulateSSE();
    onUnmounted(stopSSE);
  });

  return {
    blockHeights,
    sentinelAddr,
    isRegistering,
    registerStatus,
    handleRegister,
    assetDistribution,
    historyTrend,
  };
}
