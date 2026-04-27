import { useWeb3Store, type Web3Date } from "@/stores";

export const initWujieBusListener = () => {
  const web3Store = useWeb3Store();

  const handleMessageFromMain = (web3Date: Web3Date) => {
    web3Store.updateWeb3Date(web3Date);
  };

  if (window.$wujie?.bus) {
    window.$wujie.bus.$off("web3-data-change", handleMessageFromMain);
    window.$wujie.bus.$on("web3-data-change", handleMessageFromMain);
  } else {
    console.warn("[Wujie Bus] 未找到总线，监听器初始化失败");
  }
};
