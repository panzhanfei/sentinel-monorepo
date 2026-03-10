import { Address } from 'viem';

// 主流代币配置
export const SUPPORTED_TOKENS = [
  {
    symbol: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
    decimals: 6,
  },
  {
    symbol: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
    decimals: 6,
  },
  {
    symbol: 'DAI',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
    decimals: 18,
  },
  {
    symbol: 'WETH',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
    decimals: 18,
  },
];

// 常见协议 Spender（用于审计用户可能授权的对象）
export const COMMON_SPENDERS = [
  {
    name: 'Uniswap V3 Router',
    address: '0xE592427A0AEce92De3Edee1F18E0157C05861564' as Address,
  },
  {
    name: 'OpenSea Seaport',
    address: '0x00000000006c3852cbEf3e08E8dF289169EdE581' as Address,
  },
  {
    name: 'Blur Marketplace',
    address: '0x000000000000ad05ccc4572d0097c7f35077b538' as Address,
  },
];
