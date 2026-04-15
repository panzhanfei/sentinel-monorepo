export const isValidEvmAddress = (addr: string) : boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}
