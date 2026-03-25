import { defineComponent, ref, computed } from "vue";
import { useMonitorDashboard } from "@/controllers/useMonitorDashboard";
import { EChartsSection } from "@/components/charts/EChartsSection";
import {
  WalletWaitingPlaceholder,
  ChainBalanceGrid,
  SentinelDeployerPanel,
} from "@/components/monitor";

/** View：只负责拼装展示组件，数据来自 Controller */
export default defineComponent({
  name: "MonitorDashboard",
  setup() {
    const {
      address,
      chainBalances,
      filteredTokens,
      distributionData,
      trendData,
      addToken,
      removeToken,
    } = useMonitorDashboard();

    const inputAddr = ref("");

    const hasWallet = computed(() => Boolean(address.value));

    const submitToken = () => {
      void addToken(inputAddr.value);
      inputAddr.value = "";
    };

    return () => (
      <div class="min-h-screen  text-zinc-100 p-8 font-mono">
        <WalletWaitingPlaceholder visible={!hasWallet.value} />
        <ChainBalanceGrid chains={chainBalances.value} />
        <EChartsSection
          distributionData={distributionData.value}
          trendData={trendData.value}
        />
        <SentinelDeployerPanel
          modelValue={inputAddr.value}
          onUpdate:modelValue={(v: string) => {
            inputAddr.value = v;
          }}
          tokens={filteredTokens.value}
          formDisabled={!hasWallet.value}
          onSubmit={submitToken}
          onRemove={(id: string) => removeToken(id)}
        />
      </div>
    );
  },
});
