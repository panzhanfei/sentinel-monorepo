/** 纯函数：EVM 地址校验（与 viem 规则一致的可选补充） */
export function isValidEvmAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}
