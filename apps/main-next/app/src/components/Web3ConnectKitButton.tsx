"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// 在 Header 中使用
export const Web3ConnectKitButton = () => {
  return (
    <ConnectButton
      accountStatus="address"
      showBalance={false}
      chainStatus="icon"
    />
  );
};
