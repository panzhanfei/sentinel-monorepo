"use server";

import { cookies } from "next/headers";
import { NonceService } from "@sentinel/auth";
import { redis } from "@/lib/redis";
import { revalidatePath } from "next/cache";
import {
  authCookieConfig,
  getAuthCookieBase,
  issueLoginTokens,
  revokeSession,
} from "@/lib/authSession";

const nonceService = new NonceService(redis, { prefix: "nonce", ttl: 300 });

export const getLoginNonce = async (address: string) => {
  const now = Date.now();
  const isAllowed = await redis.slidingWindowLimit(
    `rate_limit:nonce:${address.toLowerCase()}`,
    now,
    60000,
    5,
  );
  if (!isAllowed) {
    throw new Error("请求太频繁，请一分钟后再试");
  }

  const nonce = await nonceService.generate(address, "login");
  return nonce;
}

export const verifySignature = async (address: string, signature: string) => {
  const key = `nonce:login:${address.toLowerCase()}`;
  const savedNonce = await redis.get(key);
  if (!savedNonce) {
    throw new Error("Nonce 已过期或不存在，请重新获取");
  }

  const isValid = await nonceService.verify(
    address,
    "login",
    signature,
    savedNonce,
  );
  if (!isValid) {
    throw new Error("签名验证失败，疑似伪造请求");
  }

  const cookieStore = await cookies();
  const prevAccessToken = cookieStore.get("accessToken")?.value;
  const prevRefreshToken = cookieStore.get("refreshToken")?.value;
  const { accessToken, refreshToken } = await issueLoginTokens({
    sub: address.toLowerCase(),
    role: "user",
    prevAccessToken,
    prevRefreshToken,
  });

  cookieStore.delete("token");

  const cookieBase = getAuthCookieBase();
  cookieStore.set("accessToken", accessToken, {
    ...cookieBase,
    maxAge: authCookieConfig.accessMaxAge,
  });
  cookieStore.set("refreshToken", refreshToken, {
    ...cookieBase,
    maxAge: authCookieConfig.refreshMaxAge,
  });

  return { success: true };
}

export const logout = async () => {
  const cookieStore = await cookies();
  await revokeSession({
    accessToken: cookieStore.get("accessToken")?.value,
    refreshToken: cookieStore.get("refreshToken")?.value,
  });
  cookieStore.delete("token");
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  revalidatePath("/", "layout");
}
