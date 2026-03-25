"use client";

import dynamic from "next/dynamic";
import { ComponentType, useState, useEffect, ReactNode } from "react";
import { useAccount } from "wagmi";
import { useWeb3Sync } from "@/app/src/hooks";

export interface WujieProps {
  name: string;
  url: string;
  width?: string;
  height?: string;
  sync?: boolean;
  alive?: boolean;
  props?: Record<string, unknown>;
  fallback?: ReactNode;
  shadowDOM?: boolean;
  activated?: () => void;
  afterMount?: () => void;
}

const WujieReact = dynamic(
  () =>
    import("wujie-react").then(
      (mod) => mod.default as unknown as ComponentType<WujieProps>,
    ),
  {
    ssr: false,

    loading: () => null,
  },
);

export const WujieClient = ({
  name,
  url,
  width = "100%",
  height = "100%",
  sync = true,
  alive = true,
  props = {},
  fallback,
  afterMount,
}: WujieProps) => {
  const { address, isConnected, chain } = useAccount();
  const [isLoaded, setIsLoaded] = useState(false); // 手动控制状态
  const [bffOrigin, setBffOrigin] = useState("");

  useWeb3Sync();

  useEffect(() => {
    setBffOrigin(window.location.origin);
  }, []);

  const handleAfterMount = () => {
    setTimeout(() => {
      setIsLoaded(true);
      afterMount?.();
    }, 300);
  };
  return (
    <div className="relative w-full h-full" style={{ width, height }}>
      {!isLoaded && (
        <div className="absolute inset-0 z-5 bg-white">
          {fallback || <div className="p-4">加载中...</div>}
        </div>
      )}

      <WujieReact
        name={name}
        url={url}
        width="100%"
        height="100%"
        sync={sync}
        alive={alive}
        activated={() => {
          handleAfterMount();
        }}
        props={{
          ...props,
          afterMount: handleAfterMount,
          web3Data: { address, chain, isConnected },
          ...(bffOrigin ? { bffOrigin } : {}),
        }}
      />
    </div>
  );
};
