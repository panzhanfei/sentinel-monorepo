// 1. 定义一个通用的代币映射类型
type TokenConfig = {
  [tokenSymbol: string]: `0x${string}`;
};

export const TOKEN_WHITELIST: Record<number, TokenConfig> = {
  1: {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eb48",
    LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA", // 现在不报错了
  },
  31337: {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eb48",
    LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  },
};
