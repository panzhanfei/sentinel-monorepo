const ETHERSCAN_API_KEY = "Z6CP2H1T624YUE3KVR2PNCHAPIEINE6D3Q";

export const fetchTransactions = async (address: string) => {
  // const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

  const response = await fetch(url);

  const data = await response.json();
  if (data.status !== "1") return [];
  return data.result; // 这里返回的是交易数组
};
