import { NextResponse } from "next/server";
import fetch from "node-fetch"; // 使用 node-fetch 而不是内置 fetch
import { HttpsProxyAgent } from "https-proxy-agent";

const proxyUrl = process.env.HTTPS_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids") || "ethereum";

  const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  console.log("Fetching URL with node-fetch:", apiUrl);

  try {
    // 使用 node-fetch 并传入 agent
    const response = await fetch(apiUrl, {
      agent: proxyAgent,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CoinGecko API error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `CoinGecko API 返回 ${response.status}`,
          detail: errorText,
          ids,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log("Data received:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("价格 API 内部错误:", error);
    return NextResponse.json(
      { error: "获取价格失败", message: String(error), ids },
      { status: 500 },
    );
  }
}
