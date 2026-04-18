"use client";

import dynamic from "next/dynamic";
import {
  ComponentType,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useAccount } from "wagmi";
import { useWeb3Sync } from "@/app/src/hooks";

const EMPTY_PROPS: Record<string, unknown> = {};

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
  props: userProps,
  fallback,
  afterMount,
}: WujieProps) => {
  const props = userProps ?? EMPTY_PROPS;
  const { address, isConnected, chain } = useAccount();
  const [isLoaded, setIsLoaded] = useState(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const bffOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  useWeb3Sync();

  useEffect(
    () => () => {
      if (loadTimeoutRef.current !== undefined) {
        clearTimeout(loadTimeoutRef.current);
      }
    },
    [],
  );

  const handleAfterMount = useCallback(() => {
    if (loadTimeoutRef.current !== undefined) {
      clearTimeout(loadTimeoutRef.current);
    }
    loadTimeoutRef.current = setTimeout(() => {
      loadTimeoutRef.current = undefined;
      setIsLoaded(true);
      afterMount?.();
    }, 300);
  }, [afterMount]);

  const web3Data = useMemo(
    () => ({ address, chain, isConnected }),
    [address, chain, isConnected],
  );

  const wujieProps = useMemo(
    () => ({
      ...props,
      afterMount: handleAfterMount,
      web3Data,
      ...(bffOrigin ? { bffOrigin } : {}),
    }),
    [props, handleAfterMount, web3Data, bffOrigin],
  );

  const onActivated = useCallback(() => {
    handleAfterMount();
  }, [handleAfterMount]);

  return (
    <div className="relative w-full h-full" style={{ width, height }}>
      {!isLoaded && (
        <div className="absolute inset-0 z-10 bg-white">
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
        activated={onActivated}
        props={wujieProps}
      />
    </div>
  );
};
