import { defineComponent } from "vue";
import {
  EChartsSection,
  WalletWaitingPlaceholder,
  ChainBalanceGrid,
  SentinelDeployerPanel,
} from "@/components";
import { useMonitorDashboardData } from "./useData";

export default defineComponent({
  name: "MonitorDashboard",
  setup: () => {
        const {
          chainBalances,
          filteredTokens,
          distributionData,
          trendData,
          inputAddr,
          hasWallet,
          submitToken,
          removeToken,
        } = useMonitorDashboardData();

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
