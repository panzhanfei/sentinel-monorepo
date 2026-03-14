import { useWriteContract } from "wagmi";
import { erc20Abi, type Address } from "viem";
import { publicClient } from "@sentinel/security-sdk";

export function useRevoke({ onSuccess }: { onSuccess?: () => void }) {
  const { writeContractAsync } = useWriteContract();

  const handleRevoke = async (
    tokenAddress: Address,
    spenderAddress: Address,
  ) => {
    try {
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, BigInt(0)],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "success") {
        onSuccess?.();
      }
      return hash;
    } catch (error) {
      console.error("Revoke failed:", error);
      throw error;
    }
  };

  return { handleRevoke };
}
