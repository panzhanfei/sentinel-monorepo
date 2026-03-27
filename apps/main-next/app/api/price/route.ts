import { NextResponse } from "next/server";
import fetch from "node-fetch"; // 使用 node-fetch 而不是内置 fetch
import { HttpsProxyAgent } from "https-proxy-agent";

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
const REQUEST_TIMEOUT_MS = 12_000;
const isProduction = process.env.NODE_ENV === "production";
const PRICE_API_MODE = (process.env.PRICE_API_MODE || "mock").toLowerCase();

function parseNoProxyList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function shouldBypassProxy(hostname: string, noProxyRules: string[]): boolean {
  const host = hostname.toLowerCase();
  for (const rule of noProxyRules) {
    if (rule === "*") return true;
    if (rule.startsWith(".")) {
      // .example.com 匹配 foo.example.com
      if (host.endsWith(rule)) return true;
      continue;
    }
    if (rule.startsWith("*.")) {
      // *.example.com 匹配 foo.example.com
      const suffix = rule.slice(1);
      if (host.endsWith(suffix)) return true;
      continue;
    }
    if (rule === host) return true;
  }
  return false;
}

function asErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error);
}

function hashId(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function buildMockPriceResponse(ids: string): Record<string, unknown> {
  const idList = ids
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const data: Record<string, unknown> = {};
  for (const id of idList.length ? idList : ["ethereum"]) {
    const h = hashId(id);
    const usdBase = 100 + (h % 4000);
    const usd = Number((usdBase + ((h % 100) / 100)).toFixed(2));
    const change = Number((((h % 2000) - 1000) / 100).toFixed(2)); // -10.00 ~ +9.99
    data[id] = {
      usd,
      usd_24h_change: change,
    };
  }
  return data;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids") || "ethereum";

  if (PRICE_API_MODE !== "real") {
    return NextResponse.json(buildMockPriceResponse(ids));
  }

  const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  console.log("Fetching URL with node-fetch:", apiUrl);

  try {
    // 同时兼容本地/线上：根据环境与 NO_PROXY 决定优先级，并自动回退。
    const hostname = new URL(apiUrl).hostname;
    const noProxyRules = parseNoProxyList(
      process.env.NO_PROXY || process.env.no_proxy,
    );
    const bypassProxy = shouldBypassProxy(hostname, noProxyRules);
    const useProxy = Boolean(proxyAgent) && !bypassProxy;
    const preferProxyFirst = isProduction && useProxy;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Awaited<ReturnType<typeof fetch>> | undefined;
    let lastError: unknown;

    const attempts: Array<"proxy" | "direct"> = preferProxyFirst
      ? ["proxy", "direct"]
      : ["direct", "proxy"];

    try {
      for (const mode of attempts) {
        if (mode === "proxy" && !useProxy) continue;
        try {
          response = await fetch(apiUrl, {
            agent: mode === "proxy" ? proxyAgent : undefined,
            signal: controller.signal,
          });
          break;
        } catch (err) {
          lastError = err;
          console.warn(`Price API request failed via ${mode}, trying fallback:`, err);
        }
      }
    } finally {
      clearTimeout(timeout);
    }

    if (!response) {
      throw lastError || new Error("Unable to fetch CoinGecko");
    }

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
      { error: "获取价格失败", message: asErrorMessage(error), ids },
      { status: 500 },
    );
  }
}
