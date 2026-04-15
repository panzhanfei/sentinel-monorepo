import { useQuery } from "@tanstack/react-query";
import { publicClient } from "@/utils";

export const useWalletTransactionCount = (address: string | undefined) => {
  return useQuery<number>({
    queryKey: ["txCount", address],
    enabled: Boolean(address),
    queryFn: async () => {
      const account = address as `0x${string}`;
      const latestCount = await publicClient.getTransactionCount({
        address: account,
        blockTag: "latest",
      });
      return latestCount;
    },
    refetchInterval: 3_000,
    refetchOnWindowFocus: true,
  });
}
