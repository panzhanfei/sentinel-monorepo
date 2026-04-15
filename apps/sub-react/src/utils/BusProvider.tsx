import { useEffect } from "react";
import { useWujieStore, type WujieWeb3Date } from "@/stores";

export const BusProvider = ({ children }: { children: React.ReactNode }) => {
  const updateWujieState = useWujieStore((state) => state.updateWujieState);

  useEffect(() => {
    const onWeb3DataChange = (payload: unknown) => {
      updateWujieState(payload as Partial<WujieWeb3Date>);
    };
    if (window.$wujie?.bus) {
      window.$wujie.bus.$on("web3-data-change", onWeb3DataChange);
    }
    return () => {
      window.$wujie?.bus?.$off("web3-data-change", onWeb3DataChange);
    };
  }, [updateWujieState]);

  return <>{children}</>;
}
