/**
 * Sentinel 项目 - 通用格式化工具库
 */
export const shortenAddress = (
  address: string | `0x${string}` | undefined,
): string => {
  if (!address) return "0x000...0000";
  // 按照 Web3 惯例，保留前 6 位 (含 0x) 和后 4 位
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * 2. 货币/资产数值格式化
 * 场景：总资产净值展示 ($24,580.12)
 */
export const formatCurrency = (value: number | string): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * 3. 相对时间转换
 * 场景：安全审计快报中的 "10分钟前"
 */
export const getRelativeTime = (timestamp: number | Date): string => {
  const now = new Date().getTime();
  const diff = now - new Date(timestamp).getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
};
