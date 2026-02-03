import { useEffect } from "react";
import { useWujieStore } from "@/stores";

export function BusProvider({ children }: { children: React.ReactNode }) {
  const updateWujieState = useWujieStore((state) => state.updateWujieState);

  useEffect(() => {
    if (window.$wujie?.bus) {
      window.$wujie.bus.$on("web3-data-change", updateWujieState);
    }
    return () => {
      window.$wujie?.bus?.$off("web3-data-change", updateWujieState);
    };
  }, [updateWujieState]);

  return <>{children}</>;
}
