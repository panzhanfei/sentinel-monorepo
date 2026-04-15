import { useQuery } from "@tanstack/react-query";
import { publicClient } from "@/utils";
import { fetchFootprintAudit } from "./auditApi";

export const useFootprintAudit = (address: string | undefined) => {
  return useQuery({
    queryKey: ["footprintAudit", address],
    queryFn: () =>
      fetchFootprintAudit(publicClient, address!, {
        limit: 10,
        maxBlocks: 300,
      }),
    enabled: !!address,
  });
}
