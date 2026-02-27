// components/WujieClient.tsx
"use client";

import dynamic from "next/dynamic";
import { ComponentType } from "react";
import { useAccount } from "wagmi";
import {useWeb3Sync} from "@/app/src/hooks";

// 定义严谨的类型接口
export interface WujieProps {
  name: string;
  url: string;
  width?: string;
  height?: string;
  sync?: boolean;
  alive?: boolean;
  props?: Record<string, unknown>;
}

const WujieReact = dynamic(
  () =>
    import("wujie-react").then(
      (mod) => mod.default as unknown as ComponentType<WujieProps>,
    ),
  {
    ssr: false,
    loading: () => <p>加载中...</p>,
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
}: WujieProps) => {
  const { address, isConnected, chain } = useAccount();
  useWeb3Sync();
  return (
    <WujieReact
      name={name}
      url={url}
      width={width}
      height={height}
      sync={sync}
      alive={alive}
      props={{
        ...props,
        web3Date: {
          address,
          chain,
          isConnected,
        },
      }}
    />
  );
};
