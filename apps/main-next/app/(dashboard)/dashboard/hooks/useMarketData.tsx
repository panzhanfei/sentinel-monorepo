import { useState, useEffect } from "react";
import { useChainId } from "wagmi";
import { chainToCoinGeckoId } from "@/app/src/config";

export function useMarketData() {
  const currentChainId = useChainId();
  const [ethPrice, setEthPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);

  useEffect(() => {
    const fetchMarketData = async () => {
      const cgId = chainToCoinGeckoId[currentChainId] || "ethereum";
      try {
        const res = await fetch(`/api/price?ids=${cgId}`);
        const data = await res.json();
        if (data[cgId]) {
          setEthPrice(data[cgId].usd);
          setPriceChange(data[cgId].usd_24h_change);
        }
      } catch (err) {
        console.warn("Market sync deferred");
      }
    };
    fetchMarketData();
    const timer = setInterval(fetchMarketData, 60000);
    return () => clearInterval(timer);
  }, [currentChainId]);

  return { ethPrice, priceChange };
}
