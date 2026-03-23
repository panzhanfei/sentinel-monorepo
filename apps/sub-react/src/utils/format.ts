const WEI_PER_ETH = 1e18;

export function formatWeiToEth(weiStr: string, fractionDigits = 4): string {
  const n = parseFloat(weiStr);
  if (Number.isNaN(n)) return "0";
  return (n / WEI_PER_ETH).toFixed(fractionDigits);
}

export function truncateHash(hash: string, visibleChars = 18): string {
  if (hash.length <= visibleChars) return hash;
  return `${hash.slice(0, visibleChars)}...`;
}
