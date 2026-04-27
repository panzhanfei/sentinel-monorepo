// hooks/useLogin.ts
import { useState } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { getLoginNonce, verifySignature } from "@/app/actions";
import { useRouter } from "next/navigation";

export type LoginStatus = "idle" | "loading" | "signing" | "verifying";

export const useLogin = () => {
  const router = useRouter();
  const { address, isConnected, status: accountStatus } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const [pageStatus, setPageStatus] = useState<LoginStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!address || !isConnected) return;

    try {
      setError(null);
      setPageStatus("loading");
      // 1. 获取 Nonce
      const nonce = await getLoginNonce(address);
      // 2. 请求钱包签名
      setPageStatus("signing");
      const signature = await signMessageAsync({ message: nonce });

      // 3. 提交后端验证
      setPageStatus("verifying");
      const result = await verifySignature(address, signature);
      if (result.success) {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "身份验证失败";
      setError(message);
      setPageStatus("idle");
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return {
    // 状态
    accountStatus,
    isConnected,
    address,
    pageStatus,
    error,
    // 方法
    handleAuth,
    handleDisconnect,
  };
}
