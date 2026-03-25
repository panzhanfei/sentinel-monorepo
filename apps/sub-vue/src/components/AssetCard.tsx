import type { ChainBalance, TokenBalance } from "@/types/monitor";

export interface AssetCardProps {
  record: ChainBalance | TokenBalance;
  isRemovable?: boolean;
  className?: string;
}

export const AssetCard = (props: AssetCardProps) => {
  const { record } = props;
  const { loading, isError, chainName, balance, symbol } = record;
  return (
    <div
      class={`p-4 bg-white rounded-xl border border-gray-100 shadow-sm ${props.className || ""}`}
    >
      <div class="text-xs text-gray-400 mb-1">{chainName}</div>

      <div class="flex items-center justify-between">
        {loading ? (
          // 骨架态
          <div class="space-y-2">
            <div class="h-6 w-28 bg-gray-200 animate-pulse rounded"></div>
          </div>
        ) : (
          // 真实内容态
          <div class="text-xl font-bold font-mono flex items-baseline gap-1">
            <span>{balance}</span>
            <span class="text-sm text-gray-500">{symbol}</span>
          </div>
        )}
        <div
          class={[
            "w-2 h-2 rounded-full",
            loading
              ? "bg-blue-300 animate-ping"
              : isError
                ? "bg-red-500"
                : "bg-green-500",
          ]}
        ></div>
      </div>
    </div>
  );
};
